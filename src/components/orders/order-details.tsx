'use client';

import type { OrderWithDetails } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { FormattedDate } from '../formatted-date';
import { Button } from '../ui/button';
import { Pencil, Upload, ImageOff } from 'lucide-react';
import { UploadImagesDialog } from './upload-images-dialog';

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

interface OrderDetailsProps {
    order: OrderWithDetails;
    onEdit?: () => void;
}

export function OrderDetails({ order, onEdit }: OrderDetailsProps) {
    const total = order.total_amount || order.order_items.reduce((acc, item) => acc + (item.total_price || item.unit_price * item.quantity), 0);
    const paymentProofs = order.payment_proof_urls || [];
    const finalImages = order.final_product_image_urls || [];

    return (
        <div className="flex flex-col gap-6 h-full">
            <Card className="flex-1 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-2xl font-bold">Pedido <span className="text-muted-foreground font-mono text-xl">#{order.id.substring(0, 8)}</span></h2>
                        <p className="text-muted-foreground">
                            <FormattedDate date={order.created_at} format="dd 'de' MMMM 'de' yyyy, 'às' HH:mm" prefix="Realizado em " />
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={statusVariantMap[order.status]} className="text-base px-4 py-2 capitalize">
                            {statusTextMap[order.status] || order.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Itens do Pedido</CardTitle></CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[80px] hidden sm:table-cell">Imagem</TableHead>
                                                <TableHead>Produto</TableHead>
                                                <TableHead className="text-right">Qtd.</TableHead>
                                                <TableHead className="text-right hidden md:table-cell">Preço Unit.</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {order.order_items.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="hidden sm:table-cell">
                                                        <Image
                                                            src={item.products?.image_url || '/placeholder.svg'}
                                                            alt={item.products?.name || 'Produto'}
                                                            width={64}
                                                            height={64}
                                                            className="rounded-md object-cover bg-muted"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">{item.products?.name}</TableCell>
                                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                                    <TableCell className="text-right hidden md:table-cell">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price * item.quantity)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Nome</span>
                                        <span className="font-medium text-right">{order.customer_name}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Telefone</span>
                                        <span className="font-mono">{order.customer_phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Email</span>
                                        <span className="font-mono text-right truncate">{order.customer_email || 'N/A'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Anexos do Pedido</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-sm mb-2">Comprovantes</h4>
                                        {paymentProofs.length > 0 ? (
                                            <Carousel className="w-full max-w-xs mx-auto">
                                                <CarouselContent>
                                                    {paymentProofs.map((url, index) => (
                                                        <CarouselItem key={index}>
                                                            <Image src={url} alt={`Comprovante ${index + 1}`} width={300} height={400} className="rounded-lg object-contain mx-auto" />
                                                        </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                                <CarouselPrevious />
                                                <CarouselNext />
                                            </Carousel>
                                        ) : (
                                            <div className="text-center text-muted-foreground text-sm p-4 border rounded-md flex flex-col items-center justify-center">
                                                <ImageOff className="w-6 h-6 mb-2"/>
                                                <span>Nenhum comprovante.</span>
                                            </div>
                                        )}
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="font-medium text-sm mb-2">Imagens Finais</h4>
                                        {finalImages.length > 0 ? (
                                            <Carousel className="w-full max-w-xs mx-auto">
                                                <CarouselContent>
                                                    {finalImages.map((url, index) => (
                                                        <CarouselItem key={index}>
                                                            <Image src={url} alt={`Imagem Final ${index + 1}`} width={300} height={300} className="rounded-lg object-contain mx-auto" />
                                                        </CarouselItem>
                                                    ))}
                                                </CarouselContent>
                                                <CarouselPrevious />
                                                <CarouselNext />
                                            </Carousel>
                                        ) : (
                                            <div className="text-center text-muted-foreground text-sm p-4 border rounded-md flex flex-col items-center justify-center">
                                                <ImageOff className="w-6 h-6 mb-2"/>
                                                <span>Nenhuma imagem final.</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 flex justify-between items-center flex-wrap gap-2">
                    <div className="font-bold text-xl">
                        <span>Total: </span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
                        <UploadImagesDialog orderId={order.id}>
                            <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Anexos</Button>
                        </UploadImagesDialog>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
