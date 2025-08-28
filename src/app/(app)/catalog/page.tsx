import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Category, Product, UserProfile } from "@/lib/types";
import { CatalogClient } from "@/components/catalog/catalog-client";

export default async function CatalogPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
        return;
    }

    const profilePromise = supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<Pick<UserProfile, 'role'>>();
    
    const productsPromise = supabase
        .from('products')
        .select(`
            id,
            name,
            description,
            price,
            category_id,
            image_url,
            status,
            data_ai_hint,
            sku,
            weight,
            dimensions,
            stock_quantity,
            min_stock_level,
            created_at,
            updated_at,
            categories ( name, description, is_active )
        `)
        .order('name', { ascending: true });

    const categoriesPromise = supabase
        .from('categories')
        .select(`
            id,
            name,
            description,
            is_active,
            created_at,
            updated_at
        `)
        .order('name', { ascending: true });
    
    const [profileResult, productsResult, categoriesResult] = await Promise.all([
        profilePromise,
        productsPromise,
        categoriesPromise,
    ]);

    if (profileResult.data?.role !== 'ADMIN') {
        redirect('/dashboard');
        return;
    }

    const products = productsResult.data || [];
    const categories = categoriesResult.data || [];

    return (
        <CatalogClient initialProducts={products} initialCategories={categories} />
    );
}
