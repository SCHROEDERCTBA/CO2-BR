
'use client';

import { useEffect, useState, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
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
import { LoaderCircle, AlertTriangle, Upload } from 'lucide-react';
import { addImagesToOrder } from '@/lib/actions/order.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircle className="mr-2 animate-spin" />}
      Adicionar Imagens
    </Button>
  );
}

interface UploadImagesDialogProps {
  orderId: string;
  children?: React.ReactNode;
}

export function UploadImagesDialog({ orderId, children }: UploadImagesDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [state, formAction] = useFormState(addImagesToOrder, null);
  
  useEffect(() => {
    if (state?.success) {
      toast({
        title: `Imagens adicionadas!`,
        description: `As imagens foram adicionadas ao pedido com sucesso.`,
      });
      router.refresh();
      setOpen(false);
    }
  }, [state, router, toast]);
  
  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children || (
          <DialogTrigger asChild>
              <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Anexar Imagens
              </Button>
          </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anexar Novas Imagens</DialogTitle>
          <DialogDescription>
            Selecione imagens para adicionar ao pedido. Elas serão adicionadas às imagens existentes.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-6">
           <input type="hidden" name="id" value={orderId} />
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="payment_proof_urls">Comprovantes de Pagamento</Label>
                    <Input id="payment_proof_urls" name="payment_proof_urls" type="file" multiple className="file:text-foreground"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="final_product_image_urls">Imagens Finais do Produto</Label>
                    <Input id="final_product_image_urls" name="final_product_image_urls" type="file" multiple className="file:text-foreground"/>
                </div>
            </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
