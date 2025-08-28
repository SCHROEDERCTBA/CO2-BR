'use client';

import { useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { OrderStatus, UserRole } from '@/lib/types';
import { updateOrderStatus } from '@/lib/actions/order.actions';
import { LoaderCircle, Shuffle } from 'lucide-react';

// MODIFICADO: Novos status
const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
  role: UserRole; // Mantido para referência futura, mas não mais usado para filtrar
  isDropdownItem?: boolean;
}

export function OrderStatusUpdater({ orderId, currentStatus, role, isDropdownItem = false }: OrderStatusUpdaterProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (newStatus === status) return;
    
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus);
        setStatus(newStatus);
        toast({
          title: 'Status do pedido atualizado!',
          description: `O pedido foi marcado como "${statusOptions.find(s => s.value === newStatus)?.label}".`,
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar status',
          description: error.message || 'Não foi possível alterar o status do pedido.',
        });
      }
    });
  };
  
  // MODIFICADO: Não há mais filtro, todas as opções estão disponíveis para todos.
  const availableOptions = statusOptions;

  if (isDropdownItem) {
    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Shuffle className="mr-2 h-4 w-4" />}
                Alterar Status
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    {availableOptions.map(option => (
                        <DropdownMenuItem 
                            key={option.value}
                            disabled={isPending || status === option.value}
                            onSelect={() => handleStatusChange(option.value)}
                        >
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isPending && <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />}
      <Select onValueChange={handleStatusChange} value={status} disabled={isPending}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Alterar status" />
        </SelectTrigger>
        <SelectContent>
          {availableOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}