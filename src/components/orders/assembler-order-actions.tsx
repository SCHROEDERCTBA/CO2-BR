'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, AlertTriangle, Upload, Send } from 'lucide-react';
import { addImagesToOrder, updateOrderStatus } from '@/lib/actions/order.actions';
import { useToast } from '@/hooks/use-toast';
import type { OrderWithDetails } from '@/lib/types';

interface AssemblerOrderActionsProps {
  order: OrderWithDetails;
}

export function AssemblerOrderActions({ order }: AssemblerOrderActionsProps) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Verificar se tem imagens finais do produto anexadas
  const hasFinalImages = order.final_product_image_urls && 
    Array.isArray(order.final_product_image_urls) && 
    order.final_product_image_urls.length > 0 &&
    order.final_product_image_urls.some(url => url && url.trim() !== '');

  const handleImageUpload = async (formData: FormData) => {
    setUploadError(null);
    formData.append('id', order.id);
    
    startTransition(async () => {
      try {
        const result = await addImagesToOrder(null, formData);
        if (result?.error) {
          setUploadError(result.error);
        } else {
          toast({
            title: 'Imagens anexadas!',
            description: 'As imagens do produto final foram anexadas com sucesso.',
          });
          setIsImageDialogOpen(false);
          formRef.current?.reset();
          router.refresh();
        }
      } catch (error) {
        setUploadError('Erro ao anexar imagens. Tente novamente.');
      }
    });
  };

  const handleSendOrder = () => {
    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, 'SENT');
        toast({
          title: 'Pedido enviado!',
          description: 'O pedido foi marcado como enviado e o cliente foi notificado.',
        });
        router.refresh();
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível enviar o pedido. Tente novamente.',
          variant: 'destructive',
        });
      }
    });
  };

  // Só renderizar se o pedido estiver APPROVED
  if (order.status !== 'APPROVED') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-2">
      {/* Botão Anexar Imagem */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size="default"
            variant="outline"
            className="flex items-center gap-2 border-0 bg-gray-700 text-white hover:bg-gray-800"
          >
            <Upload className="h-4 w-4" />
            Anexar Imagem
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anexar Imagens do Produto Final</DialogTitle>
            <DialogDescription>
              Anexe fotos do produto montado antes de enviar para o cliente.
            </DialogDescription>
          </DialogHeader>
          <form 
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleImageUpload(formData);
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="final_product_image_urls">Imagens do Produto Final</Label>
              <Input 
                id="final_product_image_urls" 
                name="final_product_image_urls" 
                type="file" 
                multiple 
                accept="image/*"
                required
                className="file:text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Selecione uma ou mais imagens do produto montado (JPG, PNG, etc.)
              </p>
            </div>

            {uploadError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsImageDialogOpen(false);
                  setUploadError(null);
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Anexar Imagens
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Botão Enviar - só habilitado após anexar imagens */}
      <Button
        size="default"
        variant="default"
        onClick={handleSendOrder}
        disabled={!hasFinalImages || isPending}
        className="flex items-center gap-2 border-0 bg-green-600 hover:bg-green-700 disabled:opacity-50"
        title={!hasFinalImages ? 'Anexe imagens do produto final antes de enviar' : 'Marcar pedido como enviado'}
      >
        {isPending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Enviar
      </Button>
    </div>
  );
}
