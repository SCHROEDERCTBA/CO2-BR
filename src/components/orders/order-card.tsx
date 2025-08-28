'use client';

import type { OrderWithDetails, UserRole } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormattedDate } from '../formatted-date';
import { OrderStatusUpdater } from './order-status-updater';
import { UploadImagesDialog } from './upload-images-dialog';
import { DollarSign, Image as ImageIcon, MessageSquare, Pencil } from 'lucide-react';

const statusTextMap: Record<any, string> = {
    PENDENTE: 'Pendente',
    ENVIADO: 'Enviado',
    CANCELADO: 'Cancelado'
};

const statusVariantMap: Record<any, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PENDENTE: 'secondary',
    ENVIADO: 'default',
    CANCELADO: 'destructive'
};

interface OrderCardProps {
  order: OrderWithDetails;
  role: UserRole;
}

export function OrderCard({ order, role }: OrderCardProps) {
  const total = order.total_amount || order.order_items.reduce((acc, item) => acc + (item.total_price || item.unit_price * item.quantity), 0);
  const allImages = [...(order.payment_proof_urls || []), ...(order.final_product_image_urls || [])];

  return (
    <Card className="flex flex-col h-full hover:border-primary/60 transition-colors duration-200">
      <Link href={`/orders/${order.id}`} className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{order.customer_name}</CardTitle>
            <Badge variant={statusVariantMap[order.status]} className="capitalize">
              {statusTextMap[order.status] || order.status}
            </Badge>
          </div>
          <CardDescription>
            <FormattedDate date={order.created_at} />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <DollarSign className="mr-2 h-4 w-4" />
            <span className="font-semibold text-base text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
            </span>
          </div>
          {order.notes && 
            <div className="flex items-start text-sm text-muted-foreground">
              <MessageSquare className="mr-2 h-4 w-4 mt-1 flex-shrink-0" />
              <p className="truncate italic">{order.notes}</p>
            </div>
          }
          {allImages.length > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <ImageIcon className="mr-2 h-4 w-4" />
              <div className="flex -space-x-2 overflow-hidden">
                {allImages.slice(0, 3).map((url, index) => (
                  <Image
                    key={index}
                    src={url}
                    alt={`Anexo ${index + 1}`}
                    width={24}
                    height={24}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-background object-cover"
                  />
                ))}
                {allImages.length > 3 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                    <span className="text-xs font-bold">+{allImages.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Link>
      <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
        <UploadImagesDialog orderId={order.id}>
            <Button variant="ghost" size="icon">
                <ImageIcon className="h-5 w-5" />
                <span className="sr-only">Anexar Imagens</span>
            </Button>
        </UploadImagesDialog>
        <Button asChild variant="ghost" size="icon">
            <Link href={`/orders/${order.id}`}>
                <Pencil className="h-5 w-5" />
                <span className="sr-only">Editar Pedido</span>
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
