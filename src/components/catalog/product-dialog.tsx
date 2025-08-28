
'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Image from 'next/image';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, AlertTriangle, Sparkles } from 'lucide-react';
import type { Category, Product } from '@/lib/types';
import { upsertProduct } from '@/lib/actions/catalog.actions';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';


interface ProductDialogProps {
  product?: Product;
  categories: Category[];
  children?: React.ReactNode;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircle className="mr-2 animate-spin" />}
      {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
    </Button>
  );
}


export function ProductDialog({ product, categories, children }: ProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState(product?.data_ai_hint || '');
  const [isGenerating, startGeneratingTransition] = useTransition();
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(product?.image_url || null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const isEditing = !!product;
  
  const [state, formAction] = useFormState(upsertProduct, null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: `Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
        description: `O produto "${state.data?.name}" foi salvo.`,
      });
      router.refresh();
      setOpen(false);
    }
  }, [state, isEditing, router, toast]);

  useEffect(() => {
    if (open) {
      setKeywords(product?.data_ai_hint || '');
      setPreviewUrl(product?.image_url || null);
    } else {
       setTimeout(() => {
        formRef.current?.reset();
        setKeywords('');
        setPreviewUrl(null);
       }, 200);
    }
  }, [open, product]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(product?.image_url || null);
    }
  };
  
  const handleGenerateKeywords = async () => {
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    const productName = formData.get('name') as string;
    const productDetails = formData.get('description') as string;

    if (!productName || !productDetails) {
        toast({
            variant: "destructive",
            title: "Campos obrigatórios",
            description: "Por favor, preencha o nome e a descrição do produto para gerar palavras-chave.",
        });
        return;
    }

    startGeneratingTransition(async () => {
        try {
            const result = await generateProductDescription({ productName, productDetails });
            if (result.keywords) {
                setKeywords(result.keywords);
                 toast({
                    title: "Palavras-chave geradas!",
                });
            }
        } catch (e) {
             toast({
                variant: "destructive",
                title: "Erro ao gerar palavras-chave",
                description: "Não foi possível gerar as palavras-chave. Tente novamente.",
            });
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Altere os detalhes do produto.' : 'Crie um novo produto para o seu catálogo.'}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
           {product?.id && <input type="hidden" name="id" value={product.id} />}
           {product?.image_url && <input type="hidden" name="image_url" value={product.image_url} />}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input id="name" name="name" defaultValue={product?.name} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price} required />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" name="description" defaultValue={product?.description || ''} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="category_id">Categoria</Label>
                     <Select name="category_id" defaultValue={product?.category_id?.toString()}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                  <Label>Imagem do Produto</Label>
                  <div className="flex items-center gap-4">
                      {previewUrl ? (
                          <Image src={previewUrl} alt="Preview" width={80} height={80} className="rounded-md object-cover" />
                      ) : (
                          <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">Sem imagem</span>
                          </div>
                      )}
                      <Input 
                          type="file"
                          name="image_file"
                          className="max-w-48"
                          accept="image/*"
                          onChange={handleImageChange}
                      />
                  </div>
                </div>
            </div>
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="data_ai_hint">Palavras-chave (para IA)</Label>
                     <Button type="button" variant="outline" size="sm" onClick={handleGenerateKeywords} disabled={isGenerating}>
                        {isGenerating ? <LoaderCircle className="mr-2 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Gerar com IA
                    </Button>
                </div>
                <Input id="data_ai_hint" name="data_ai_hint" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                 <p className="text-sm text-muted-foreground">
                    Essas palavras ajudam a IA a encontrar imagens para o produto. Ex: "arma pressão"
                </p>
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
