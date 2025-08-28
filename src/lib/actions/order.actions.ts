'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Order, OrderStatus, UserRole } from '@/lib/types';

async function checkUserRole(allowedRoles: UserRole[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Usuário não autenticado.');
    }
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: UserRole }>();

    if (!profile || !allowedRoles.includes(profile.role)) {
        throw new Error('Acesso não autorizado.');
    }
    return { user, profile };
}

async function uploadFilesAndUpdateOrder(orderId: string, files: File[], bucket: 'orders' | 'invoices', column: 'final_product_image_urls' | 'payment_proof_urls') {
    const validFiles = files.filter(f => f && f.size > 0);
    if (validFiles.length === 0) {
        console.log(`No valid files to upload for ${column}`);
        return;
    }

    console.log(`Starting upload of ${validFiles.length} files to bucket '${bucket}' for column '${column}'`);
    const supabaseAdmin = createAdminClient();

    const uploadPromises = validFiles.map(async (file, index) => {
        try {
            const fileName = `${orderId}/${crypto.randomUUID()}-${file.name}`;
            console.log(`Uploading file ${index + 1}/${validFiles.length}: ${fileName}`);
            
            const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from(bucket)
                .upload(fileName, file, {
                    upsert: false,
                    cacheControl: '3600'
                });

            if (uploadError) {
                console.error(`Storage Error for file ${fileName} in bucket ${bucket}:`, uploadError);
                throw new Error(`Erro no upload: ${uploadError.message}`);
            }
            
            const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(uploadData.path);
            console.log(`File uploaded successfully: ${publicUrl}`);
            return publicUrl;
        } catch (error) {
            console.error(`Error uploading file ${index + 1}:`, error);
            throw error;
        }
    });

    const settledUrls = await Promise.all(uploadPromises);
    console.log(`All files uploaded. URLs generated: ${settledUrls.length}`);

    if (settledUrls.length > 0) {
        // Buscar pedido existente
        const { data: existingOrder, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select(column)
            .eq('id', orderId)
            .single();

        if (fetchError) {
            console.error(`Failed to fetch existing order to update ${column}:`, fetchError);
            throw new Error(`Erro ao buscar pedido: ${fetchError.message}`);
        }
        
        const existingUrls = (existingOrder?.[column] as string[] | null) || [];
        const allUrls = [...existingUrls, ...settledUrls];

        console.log(`Updating order ${orderId} with ${allUrls.length} total URLs for ${column}`);

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update({ [column]: allUrls })
            .eq('id', orderId);
        
        if (updateError) {
            console.error(`Failed to update order with ${column}:`, updateError);
            throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
        }

        console.log(`Successfully updated order ${orderId} with new ${column}`);
    }
}


export async function createOrder(formData: FormData) {
    const { user } = await checkUserRole(['ADMIN', 'CONSULTANT', 'ASSEMBLER']);

    const customer_name = formData.get('customer_name') as string;
    const items = JSON.parse(formData.get('items') as string) as { product_id: number; quantity: number; unit_price: number }[];

    if (!customer_name || items.length === 0) {
        return { error: 'O nome do cliente e pelo menos um item são obrigatórios.' };
    }
        
    const supabaseAdmin = createAdminClient();
    const orderId = crypto.randomUUID();
    
    const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            id: orderId,
            customer_name,
            customer_cpf: formData.get('customer_cpf') as string || null,
            customer_phone: formData.get('customer_phone') as string || null,
            customer_email: formData.get('customer_email') as string || null,
            customer_address: formData.get('customer_address') as string || null,
            customer_zip: formData.get('customer_zip') as string || null,
            consultant_id: user.id,
            status: 'PENDENTE',
            notes: formData.get('notes') as string || null,
        }).select('id').single();
    
    if (orderError || !orderData) {
        console.error('Create Order Error:', orderError);
        return { error: 'Não foi possível criar o registro do pedido.' };
    }

    // Buscar informações dos produtos para obter product_name
    const productIds = items.map(item => item.product_id);
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, name')
        .in('id', productIds);

    const orderItems = items.map(item => {
        const product = products?.find(p => p.id === item.product_id);
        return {
            ...item,
            order_id: orderData.id,
            product_name: product?.name || 'Produto não encontrado'
        };
    });

    const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);
    
    if (itemsError) {
        console.error('Create Order Items Error:', itemsError);
        await supabaseAdmin.from('orders').delete().eq('id', orderData.id);
        return { error: 'Não foi possível adicionar os itens ao pedido.' };
    }

    const paymentProofFiles = formData.getAll('payment_proof_urls') as File[];
    const finalProductImageFiles = formData.getAll('final_product_image_urls') as File[];

    // Fire-and-forget background uploads
    Promise.all([
        uploadFilesAndUpdateOrder(orderData.id, paymentProofFiles, 'invoices', 'payment_proof_urls'),
        uploadFilesAndUpdateOrder(orderData.id, finalProductImageFiles, 'orders', 'final_product_image_urls')
    ]).catch(err => {
        // Log error, but don't block the user response
        console.error("Error during background file upload:", err);
    });

    revalidatePath('/orders');
    return { error: null, success: true };
}

// Função para verificar se um pedido tem imagens finais
export async function checkOrderImages(orderId: string) {
    const supabase = createClient();
    
    const { data: order, error } = await supabase
        .from('orders')
        .select('final_product_image_urls')
        .eq('id', orderId)
        .single();
    
    if (error) {
        console.error('Error checking order images:', error);
        return { hasImages: false, urls: [] };
    }
    
    const urls = order?.final_product_image_urls || [];
    return { 
        hasImages: Array.isArray(urls) && urls.length > 0,
        urls: urls
    };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    await checkUserRole(['ADMIN', 'CONSULTANT', 'ASSEMBLER']);
    
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) {
        console.error('Update Order Status Error:', error);
        throw new Error('Não foi possível atualizar o status do pedido.');
    }

    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);
}


export async function deleteOrder(orderId: string) {
    await checkUserRole(['ADMIN', 'CONSULTANT', 'ASSEMBLER']);
    const supabaseAdmin = createAdminClient();

    const { error: itemError } = await supabaseAdmin
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

    if(itemError) {
        console.error('Delete Order Items Error:', itemError);
        throw new Error('Não foi possível excluir os itens do pedido.');
    }

    const { error: orderError } = await supabaseAdmin
        .from('orders')
        .delete()
        .eq('id', orderId);
    
    if (orderError) {
        console.error('Delete Order Error:', orderError);
        throw new Error('Não foi possível excluir o pedido.');
    }

    revalidatePath('/orders');
}

export async function updateOrderDetails(prevState: any, formData: FormData) {
  const { user } = await checkUserRole(['ADMIN', 'CONSULTANT', 'ASSEMBLER']);
  
  const id = formData.get('id') as string;
  if (!id) {
    return { error: 'ID do pedido não encontrado.' };
  }
  
  const orderData: Partial<Order> = {
    customer_name: formData.get('customer_name') as string,
    customer_cpf: (formData.get('customer_cpf') as string) || null,
    customer_phone: (formData.get('customer_phone') as string) || null,
    customer_email: (formData.get('customer_email') as string) || null,
    customer_address: (formData.get('customer_address') as string) || null,
    customer_zip: (formData.get('customer_zip') as string) || null,
    notes: (formData.get('notes') as string) || null,
  };

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from('orders')
    .update(orderData)
    .eq('id', id);

  if (error) {
    console.error('Update Order Details Error:', error);
    return { error: 'Não foi possível atualizar os detalhes do pedido.' };
  }
  
  revalidatePath('/orders');
  revalidatePath(`/orders/${id}`);
  
  return { success: true };
}

export async function addImagesToOrder(prevState: any, formData: FormData) {
    const { user } = await checkUserRole(['ADMIN', 'CONSULTANT', 'ASSEMBLER']);

    const orderId = formData.get('id') as string;
    if (!orderId) {
        return { error: "ID do pedido não encontrado." };
    }

    const paymentProofFiles = formData.getAll('payment_proof_urls') as File[];
    const finalProductImageFiles = formData.getAll('final_product_image_urls') as File[];
    
    // Filtrar arquivos válidos
    const validPaymentFiles = paymentProofFiles.filter(f => f && f.size > 0);
    const validFinalImages = finalProductImageFiles.filter(f => f && f.size > 0);
    
    if (validPaymentFiles.length === 0 && validFinalImages.length === 0) {
        return { error: "Nenhum arquivo válido selecionado para upload." };
    }

    console.log(`Uploading files for order ${orderId}:`, {
        paymentFiles: validPaymentFiles.length,
        finalImages: validFinalImages.length
    });

    try {
        // Upload sequencial para melhor debugging
        if (validPaymentFiles.length > 0) {
            await uploadFilesAndUpdateOrder(orderId, validPaymentFiles, 'invoices', 'payment_proof_urls');
            console.log('Payment files uploaded successfully');
        }
        
        if (validFinalImages.length > 0) {
            await uploadFilesAndUpdateOrder(orderId, validFinalImages, 'orders', 'final_product_image_urls');
            console.log('Final product images uploaded successfully');
        }
        
        // Revalidar múltiplas rotas para garantir refresh
        revalidatePath('/orders');
        revalidatePath(`/orders/${orderId}`);
        revalidatePath('/dashboard');
        
        return { success: true };

    } catch (err: any) {
        console.error("Error during manual file upload:", err);
        return { error: err.message || "Ocorreu um erro durante o upload. Verifique os logs do servidor." };
    }
}
