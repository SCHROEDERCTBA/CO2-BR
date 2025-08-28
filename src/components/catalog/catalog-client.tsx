'use client';

import { useState } from "react";
import type { Category, Product } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTable } from "@/components/catalog/products-table";
import { CategoriesTable } from "@/components/catalog/categories-table";
import { ProductDialog } from "@/components/catalog/product-dialog";
import { CategoryDialog } from "@/components/catalog/category-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface CatalogClientProps {
    initialProducts: Product[];
    initialCategories: Category[];
}

export function CatalogClient({ initialProducts, initialCategories }: CatalogClientProps) {
    const [activeTab, setActiveTab] = useState("products");
    
    // Although we receive initial data, we pass it to the tables
    // router.refresh() will cause the parent Server Component to re-fetch and pass new props down.
    // So we don't need to manage the state of products/categories here.

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <TabsList>
                    <TabsTrigger value="products">Produtos</TabsTrigger>
                    <TabsTrigger value="categories">Categorias</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2">
                   {activeTab === 'products' ? (
                        <ProductDialog categories={initialCategories}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Novo Produto
                            </Button>
                        </ProductDialog>
                   ) : (
                        <CategoryDialog>
                             <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nova Categoria
                            </Button>
                        </CategoryDialog>
                   )}
                </div>
            </div>
            <TabsContent value="products">
                <ProductsTable data={initialProducts} categories={initialCategories} />
            </TabsContent>
            <TabsContent value="categories">
                <CategoriesTable data={initialCategories} />
            </TabsContent>
        </Tabs>
    );
}
