
'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { Category, Product, UserRole } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export async function upsertCategory(prevState: any, formData: FormData) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado.' };
    }
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single<{ role: UserRole }>();

    if (profile?.role !== 'ADMIN') {
      return { error: 'Acesso não autorizado.' };
    }
    
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    
    if (!name) {
        return { error: 'O nome da categoria é obrigatório.' };
    }

    const supabaseAdmin = createAdminClient();
    const categoryData = { name };

    let error;
    if (id) {
      const { error: updateError } = await supabaseAdmin
        .from('categories')
        .update(categoryData)
        .eq('id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('categories')
        .insert(categoryData);
      error = insertError;
    }

    if (error) {
      console.error('Upsert Category Error:', error);
      return { error: 'Não foi possível salvar a categoria.' };
    }

    revalidatePath('/catalog');
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteCategory(categoryId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single<{ role: UserRole }>();
    if (profile?.role !== 'ADMIN') throw new Error('Acesso não autorizado.');

    const supabaseAdmin = createAdminClient();

    const { data: products, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1);
    
    if(productsError) {
        console.error('Error checking for products in category:', productsError);
        throw new Error('Erro ao verificar produtos na categoria.');
    }

    if (products && products.length > 0) {
        throw new Error('Não é possível excluir a categoria, pois existem produtos associados a ela.');
    }

    const { error: deleteError } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', categoryId);
    
    if (deleteError) {
        console.error('Delete Category Error:', deleteError);
        throw new Error('Não foi possível excluir a categoria.');
    }

    revalidatePath('/catalog');
}

export async function upsertProduct(prevState: any, formData: FormData) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { error: 'Usuário não autenticado.' };
        }
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single<{ role: UserRole }>();
        if (profile?.role !== 'ADMIN') {
            return { error: 'Acesso não autorizado.' };
        }

        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const price = formData.get('price') as string;
        const category_id = formData.get('category_id') as string;
        let image_url = formData.get('image_url') as string;
        const data_ai_hint = formData.get('data_ai_hint') as string;
        const image_file = formData.get('image_file') as File;
        
        if (!name || !price || !category_id) {
            return { error: 'Nome, preço e categoria são obrigatórios.' };
        }
        
        const supabaseAdmin = createAdminClient();

        if (image_file && image_file.size > 0) {
            const fileName = `${crypto.randomUUID()}-${image_file.name}`;
            const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from('products')
                .upload(fileName, image_file, {
                    upsert: true,
                });

            if (uploadError) {
                console.error('Storage Error:', uploadError);
                return { error: 'Não foi possível fazer o upload da imagem.' };
            }
            
            const { data: { publicUrl } } = supabaseAdmin.storage.from('products').getPublicUrl(uploadData.path);
            image_url = publicUrl;
        }


        const productData = {
            name,
            description,
            price: parseFloat(price),
            category_id: parseInt(category_id),
            image_url,
            data_ai_hint,
            status: 'ACTIVE'
        };

        let error;
        let resultProduct;
        if (id) {
            const { data, error: updateError } = await supabaseAdmin
                .from('products')
                .update(productData)
                .eq('id', id)
                .select()
                .single();
            error = updateError;
            resultProduct = data;
        } else {
            const { data, error: insertError } = await supabaseAdmin
                .from('products')
                .insert(productData)
                .select()
                .single();
            error = insertError;
            resultProduct = data;
        }

        if (error) {
            console.error('Upsert Product Error:', error);
            return { error: 'Não foi possível salvar o produto.' };
        }

        revalidatePath('/catalog');
        return { success: true, data: resultProduct };

    } catch (e: any) {
        return { error: e.message || "Ocorreu um erro inesperado." };
    }
}

export async function deleteProduct(productId: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single<{ role: UserRole }>();
    if (profile?.role !== 'ADMIN') throw new Error('Acesso não autorizado.');
    
    const supabaseAdmin = createAdminClient();

    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

    if (orderItemsError) {
        console.error('Error checking for order items:', orderItemsError);
        throw new Error('Erro ao verificar se o produto está em um pedido.');
    }

    if (orderItems && orderItems.length > 0) {
        throw new Error('Não é possível excluir o produto, pois ele faz parte de um ou mais pedidos.');
    }

    const { error: deleteError } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', productId);

    if (deleteError) {
        console.error('Delete Product Error:', deleteError);
        throw new Error('Não foi possível excluir o produto.');
    }

    revalidatePath('/catalog');
}
