import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Order, UserProfile, Product, Category } from "@/lib/types";
import { OrderCard } from "@/components/orders/order-card";
import { OrderFormSheet } from "@/components/orders/order-form-sheet";

export default async function OrdersPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    const profilePromise = supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: UserProfile['role'] }>();

    const productsPromise = supabase
        .from('products')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name', { ascending: true });

    const categoriesPromise = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
        
    const ordersPromise = supabase
        .from('orders')
        .select('*, order_items(*, products(*)), users:consultant_id(id, full_name, email)')
        .order('created_at', { ascending: false }); 

    const [profileResult, productsResult, categoriesResult, ordersResult] = await Promise.all([
        profilePromise,
        productsPromise,
        categoriesPromise,
        ordersPromise,
    ]);

    const { data: profile } = profileResult;
    const { data: products } = productsResult;
    const { data: categories } = categoriesResult;
    const { data: orders, error } = ordersResult;
    
    if (error) {
        console.error('Error fetching orders:', error);
        return <div>Erro ao carregar os pedidos.</div>
    }
    
    if (!profile) {
        return redirect('/login');
    }

    const canCreateOrder = profile.role === 'CONSULTANT' || profile.role === 'ADMIN';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Pedidos</h1>
                {canCreateOrder && (
                    <OrderFormSheet 
                        products={products as Product[] || []} 
                        categories={categories as Category[] || []} 
                    />
                )}
            </div>
            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                    <p className="text-lg text-muted-foreground">Nenhum pedido encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(orders as Order[]).map(order => (
                        <OrderCard key={order.id} order={order} role={profile!.role} />
                    ))}
                </div>
            )}
        </div>
    );
}
