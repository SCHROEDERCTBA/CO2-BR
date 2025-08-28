'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { createOrder, updateOrderDetails } from '@/lib/actions/order.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, LoaderCircle, PlusCircle, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Product, Category, Order } from '@/lib/types';
import { Separator } from '../ui/separator';
import { AddItemSheet, type CartItem } from './add-item-sheet';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { useRouter } from 'next/navigation';
import { runFlow } from '@genkit-ai/web';
import { parseOrderTextFlow } from '@/ai/flows/parse-order';

interface OrderFormProps {
    order?: Order;
    products: Product[];
    categories: Category[];
    onSuccess: () => void;
}

export function OrderForm({ order, products, categories, onSuccess }: OrderFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  // Controlled form state
  const [formData, setFormData] = useState({
    customer_name: order?.customer_name || '',
    customer_cpf: order?.customer_cpf || '',
    customer_phone: order?.customer_phone || '',
    customer_email: order?.customer_email || '',
    customer_address: order?.customer_address || '',
    customer_zip: order?.customer_zip || '',
    notes: order?.notes || '',
    ai_input_text: '',
  });

  const [items, setItems] = useState<CartItem[]>(order?.order_items || []);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [isPending, startTransition] = useTransition();
  const [isAiParsing, startAiParsingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Update form data when order prop changes (e.g., when editing a different order)
  useEffect(() => {
    setFormData({
      customer_name: order?.customer_name || '',
      customer_cpf: order?.customer_cpf || '',
      customer_phone: order?.customer_phone || '',
      customer_email: order?.customer_email || '',
      customer_address: order?.customer_address || '',
      customer_zip: order?.customer_zip || '',
      notes: order?.notes || '',
      ai_input_text: '',
    });
    setItems(order?.order_items || []);
    setError(null);
  }, [order]);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current) return;

    const data = new FormData(formRef.current);
    setError(null);
    
    startTransition(async () => {
        if (items.length === 0 && !order) { // Don't require items if just editing details
            setError("O pedido deve ter pelo menos um item.");
            return;
        }

        // Append controlled form data to FormData object
        data.set('customer_name', formData.customer_name);
        data.set('customer_cpf', formData.customer_cpf.replace(/\D/g, ''));
        data.set('customer_phone', formData.customer_phone.replace(/\D/g, ''));
        data.set('customer_email', formData.customer_email);
        data.set('customer_address', formData.customer_address);
        data.set('customer_zip', formData.customer_zip.replace(/\D/g, ''));
        data.set('notes', formData.notes);
        data.set('items', JSON.stringify(items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price }))));

        const action = order ? updateOrderDetails : createOrder;
        const result = await action(data);

        if (result?.error) {
          setError(result.error);
          return;
        }

        toast({
            title: `Pedido ${order ? 'atualizado' : 'criado'} com sucesso!`,
            description: `O pedido foi salvo.`,
        });
        router.refresh();
        onSuccess();
    });
  };
  
  const subtotal = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);

  const handleAiParse = async () => {
    if (!formData.ai_input_text) {
      toast({
        variant: "destructive",
        title: "Campo vazio",
        description: "Por favor, insira o texto para a IA analisar.",
      });
      return;
    }

    startAiParsingTransition(async () => {
      try {
        const result = await runFlow(parseOrderTextFlow, { text: formData.ai_input_text });
        setFormData(prev => ({
          ...prev,
          customer_name: result.customer_name || prev.customer_name,
          customer_cpf: result.customer_cpf || prev.customer_cpf,
          customer_phone: result.customer_phone || prev.customer_phone,
          customer_email: result.customer_email || prev.customer_email,
          customer_address: result.customer_address || prev.customer_address,
          customer_zip: result.customer_zip || prev.customer_zip,
          notes: result.notes || prev.notes,
        }));
        toast({
          title: "Campos preenchidos pela IA!",
          description: "Verifique e ajuste as informações se necessário.",
        });
      } catch (e: any) {
        console.error("AI Parsing Error:", e);
        toast({
          variant: "destructive",
          title: "Erro na IA",
          description: e.message || "Não foi possível preencher os campos com a IA. Tente novamente.",
        });
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <ScrollArea className="h-full flex-1">
                <div className="p-6 space-y-6">
                    {/* AI Input Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Preenchimento Automático (IA)</h3>
                        <div className="space-y-2">
                            <Label htmlFor="ai_input_text">Colar Texto do Pedido</Label>
                            <Textarea 
                                id="ai_input_text" 
                                placeholder="Cole aqui o texto completo do pedido para a IA analisar..."
                                value={formData.ai_input_text}
                                onChange={(e) => setFormData(prev => ({ ...prev, ai_input_text: e.target.value }))}
                                rows={5}
                            />
                        </div>
                        <Button type="button" variant="outline" onClick={handleAiParse} disabled={isAiParsing || !formData.ai_input_text}>
                            {isAiParsing ? <LoaderCircle className="mr-2 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Preencher Campos com IA
                        </Button>
                    </div>
                    <Separator />

                    {/* Customer Data Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dados do Cliente</h3>
                        <div className="space-y-2">
                            <Label htmlFor="customer_name">Nome Completo</Label>
                            <Input 
                                id="customer_name" 
                                name="customer_name" 
                                value={formData.customer_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer_cpf">CPF</Label>
                            <Input 
                                id="customer_cpf" 
                                name="customer_cpf" 
                                value={formData.customer_cpf}
                                onChange={(e) => setFormData(prev => ({ ...prev, customer_cpf: e.target.value }))}
                                placeholder="000.000.000-00" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer_phone">Telefone</Label>
                            <Input 
                                id="customer_phone" 
                                name="customer_phone" 
                                value={formData.customer_phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                                placeholder="(00) 00000-0000" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer_email">Email</Label>
                            <Input 
                                id="customer_email" 
                                name="customer_email" 
                                type="email" 
                                value={formData.customer_email}
                                onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer_address">Endereço</Label>
                            <Input 
                                id="customer_address" 
                                name="customer_address" 
                                value={formData.customer_address}
                                onChange={(e) => setFormData(prev => ({ ...prev, customer_address: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customer_zip">CEP</Label>
                            <Input 
                                id="customer_zip" 
                                name="customer_zip" 
                                value={formData.customer_zip}
                                onChange={(e) => setFormData(prev => ({ ...prev, customer_zip: e.target.value }))}
                                placeholder="00000-000" 
                            />
                        </div>
                    </div>
                    <Separator />

                    {/* Notes Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Observações</h3>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações do Pedido</Label>
                            <Textarea 
                                id="notes" 
                                name="notes" 
                                placeholder="Detalhes adicionais, instruções especiais..."
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>
                    </div>
                    <Separator />

                    {/* Image Upload Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Anexar Imagens</h3>
                        <div className="space-y-2">
                            <Label htmlFor="payment_proof_urls">Comprovantes de Pagamento</Label>
                            <Input id="payment_proof_urls" name="payment_proof_urls" type="file" multiple className="file:text-foreground"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="final_product_image_urls">Imagens Finais do Produto</Label>
                            <Input id="final_product_image_urls" name="final_product_image_urls" type="file" multiple className="file:text-foreground"/>
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="flex flex-col bg-muted/30 md:w-1/3 md:border-l border-t md:border-t-0">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-medium">Itens do Pedido</h3>
                </div>
                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-4 py-4">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                <p>Seu carrinho está vazio.</p>
                                <p className="text-xs">Use o botão abaixo para adicionar produtos.</p>
                            </div>
                        ) : (
                            items.map((item) => (
                            <div key={item.product_id} className="flex items-start gap-4">
                                <Image src={item.image_url || `https://picsum.photos/seed/${item.product_id}/100/100`} alt={item.name} width={48} height={48} className="rounded-md" />
                                <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {item.quantity} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}
                                </p>
                                </div>
                                <p className="font-medium text-right">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price * item.quantity)}
                                </p>
                            </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                <div className="p-6 mt-auto border-t space-y-4 bg-muted/50">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                    </div>
                    <AddItemSheet products={products} categories={categories} existingItems={items} onAddItems={setItems}>
                        <Button variant="outline" className="w-full" type="button">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {items.length > 0 ? 'Editar Itens' : 'Adicionar Itens'}
                        </Button>
                    </AddItemSheet>
                </div>
            </div>
        </div>

        <div className="p-6 pt-4 border-t bg-background flex-row justify-between w-full items-center">
        <div className="min-h-[40px]">
            {error && (
                <Alert variant="destructive" className="p-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
               </Alert>
            )}
        </div>
        <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <LoaderCircle className="mr-2 animate-spin" />}
                    {order ? 'Salvar Alterações' : 'Criar Pedido'}
                </Button>
        </div>
        </div>
    </form>
  );
}
