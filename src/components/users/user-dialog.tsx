
'use client';

import { useState, useEffect, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, PlusCircle, AlertTriangle, Pencil } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { upsertUser } from '@/lib/actions/user.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircle className="mr-2 animate-spin" />}
      {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
    </Button>
  );
}

interface UserDialogProps {
    user?: UserProfile;
    children?: React.ReactNode;
}


export function UserDialog({ user, children }: UserDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!user;

  const [state, formAction] = useFormState(upsertUser, null);
  
  useEffect(() => {
    if (state?.success) {
      toast({
        title: `Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
        description: `O usuário "${state.data?.full_name}" foi salvo.`,
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
          <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os detalhes do usuário.' : 'Crie um novo usuário e defina sua função.'}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          {user?.id && <input type="hidden" name="id" value={user.id} />}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input id="full_name" name="full_name" defaultValue={user?.full_name || ''} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={user?.email || ''} required disabled={isEditing} />
          </div>
           {!isEditing && (
             <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" required />
            </div>
            )}
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select name="role" defaultValue={user?.role || 'CONSULTANT'}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CONSULTANT">Consultant</SelectItem>
                <SelectItem value="ASSEMBLER">Assembler</SelectItem>
              </SelectContent>
            </Select>
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
