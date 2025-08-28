
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
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import type { Category } from '@/lib/types';
import { upsertCategory } from '@/lib/actions/catalog.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircle className="mr-2 animate-spin" />}
      {isEditing ? 'Salvar Alterações' : 'Criar Categoria'}
    </Button>
  );
}

interface CategoryDialogProps {
  category?: Category;
  children?: React.ReactNode;
}

export function CategoryDialog({ category, children }: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!category;
  
  const [state, formAction] = useFormState(upsertCategory, null);
  
  useEffect(() => {
    if (state?.success) {
      toast({
        title: `Categoria ${isEditing ? 'atualizada' : 'criada'}!`,
        description: `A categoria foi salva com sucesso.`,
      });
      router.refresh();
      setOpen(false);
    }
  }, [state, isEditing, router, toast]);
  
  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
    }
  }, [open]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os detalhes da categoria.' : 'Crie uma nova categoria para seus produtos.'}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
           {category?.id && <input type="hidden" name="id" value={category.id} />}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input id="name" name="name" defaultValue={category?.name} required />
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <SubmitButton isEditing={isEditing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
