'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Product, Category } from '@/lib/types';
import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';

export interface CartItem {
    product_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    image_url: string | null;
}

interface AddItemSheetProps {
  products: Product[];
  categories: Category[];
  existingItems: CartItem[];
  onAddItems: (items: CartItem[]) => void;
  children: React.ReactNode;
}

export function AddItemSheet({ products, categories, existingItems, onAddItems, children }: AddItemSheetProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<Record<number, number>>({});

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const initialCart = existingItems.reduce((acc, item) => {
        acc[item.product_id] = item.quantity;
        return acc;
      }, {} as Record<number, number>);
      setCart(initialCart);
    }
    setOpen(isOpen);
  };

  const filteredProducts = useMemo(() => {
    return products
        .filter(p => selectedCategory === 'ALL' || p.category_id?.toString() === selectedCategory)
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm, selectedCategory]);

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    setCart(prev => {
        const updatedCart = { ...prev };
        if (newQuantity <= 0) {
            delete updatedCart[productId];
        } else {
            updatedCart[productId] = newQuantity;
        }
        return updatedCart;
    });
  };

  const handleSubmit = () => {
    const itemsToAdd = Object.entries(cart).map(([productIdStr, quantity]) => {
        const productId = parseInt(productIdStr);
        const product = products.find(p => p.id === productId)!;
        return {
            product_id: product.id,
            name: product.name,
            quantity,
            unit_price: product.price,
            image_url: product.image_url,
        };
    });
    onAddItems(itemsToAdd);
    setOpen(false);
  };

  const totalItems = Object.values(cart).reduce((acc, qty) => acc + qty, 0);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex flex-col sm:max-w-md p-0">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle>Adicionar Itens ao Pedido</SheetTitle>
        </SheetHeader>
        <div className="px-6 pb-4 flex gap-2">
            <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-4">
            {filteredProducts.map(product => {
              const quantity = cart[product.id] || 0;
              return (
                <div key={product.id} className="flex items-center gap-4">
                    <Image 
                        src={product.image_url || `https://picsum.photos/seed/${product.id}/100/100`} 
                        alt={product.name}
                        width={48}
                        height={48}
                        className="rounded-md"
                    />
                    <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(product.id, quantity - 1)} disabled={quantity === 0}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(product.id, quantity + 1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              );
            })}
             {filteredProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado.</p>
            )}
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 mt-auto border-t bg-background">
          <Button onClick={handleSubmit} className="w-full">
            Adicionar {totalItems > 0 ? `${totalItems} Iten(s)` : ''} ao Pedido
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
