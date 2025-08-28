
'use client';

import { useState } from 'react';
import { OrderDetails } from './order-details';
import { OrderForm } from './order-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { OrderWithDetails, Product, Category } from '@/lib/types';

interface Props {
  order: OrderWithDetails;
  products: Product[];
  categories: Category[];
}

export function OrderDetailsClient({ order, products, categories }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <>
      <OrderDetails order={order} onEdit={() => setIsSheetOpen(true)} />
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-4xl p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Editar Pedido #{order.id.substring(0, 8)}</SheetTitle>
          </SheetHeader>
          <OrderForm
            order={order}
            products={products}
            categories={categories}
            onSuccess={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
