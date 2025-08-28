'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger
} from '@/components/ui/sheet';
import { OrderForm } from './order-form';
import type { Order, Product, Category } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

interface OrderFormSheetProps {
  order?: Order;
  products: Product[];
  categories: Category[];
}

export function OrderFormSheet({ order, products, categories }: OrderFormSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>{order ? 'Editar Pedido' : 'Criar Novo Pedido'}</SheetTitle>
        </SheetHeader>
        <OrderForm 
          order={order} 
          products={products} 
          categories={categories} 
          onSuccess={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
