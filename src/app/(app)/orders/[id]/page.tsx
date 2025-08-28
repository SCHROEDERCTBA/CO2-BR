

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { OrderWithDetails, Product, Category } from "@/lib/types";
import { OrderDetailsClient } from "@/components/orders/order-details-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function OrderDetailsPage({ params }: { params: { id: string }}) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Fetch order, products, and categories in parallel
    const [
        { data: order, error: orderError },
        { data: products, error: productsError },
        { data: categories, error: categoriesError }
    ] = await Promise.all([
        supabase
            .from('orders')
            .select('*, order_items(*, products(*)), users:consultant_id(id, full_name, email)')
            .eq('id', params.id)
            .single<OrderWithDetails>(),
        supabase.from('products').select('*'),
        supabase.from('categories').select('*')
    ]);
    
    if (orderError || !order) {
        console.error("Order not found or error:", orderError);
        return notFound();
    }

    if (productsError) console.error("Error fetching products:", productsError);
    if (categoriesError) console.error("Error fetching categories:", categoriesError);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="icon">
                    <Link href="/orders">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">Detalhes do Pedido</h1>
            </div>
            <OrderDetailsClient 
                order={order} 
                products={products || []} 
                categories={categories || []} 
            />
        </div>
    )
}
