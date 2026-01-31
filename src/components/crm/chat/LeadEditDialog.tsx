/**
 * LeadEditDialog - Modal para edição de informações do Lead
 * Suporta campos padrão + campos customizados criados pelo usuário
 */

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/hooks/useLeads';

// Países com DDI
const countryCodes = [
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'EUA/Canadá', flag: '🇺🇸' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+34', country: 'Espanha', flag: '🇪🇸' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+49', country: 'Alemanha', flag: '🇩🇪' },
  { code: '+33', country: 'França', flag: '🇫🇷' },
  { code: '+39', country: 'Itália', flag: '🇮🇹' },
  { code: '+81', country: 'Japão', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
];

// Schema de validação
const leadEditSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  countryCode: z.string().min(1, 'Selecione o DDI'),
  phone: z.string()
    .regex(/^\d{8,11}$/, 'Telefone deve ter entre 8 e 11 dígitos numéricos')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  source: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  customFields: z.array(z.object({
    id: z.string(),
    label: z.string().min(1, 'Nome do campo obrigatório').max(50),
    value: z.string().max(500),
    type: z.enum(['text', 'number', 'date', 'select']),
  })),
});

type LeadEditFormData = z.infer<typeof leadEditSchema>;

interface LeadEditDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

// Extrair DDI do telefone
function extractPhoneParts(phone: string | null | undefined): { countryCode: string; number: string } {
  if (!phone) return { countryCode: '+55', number: '' };
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Tentar identificar DDI
  for (const cc of countryCodes) {
    const codeDigits = cc.code.replace('+', '');
    if (cleaned.startsWith(codeDigits)) {
      return {
        countryCode: cc.code,
        number: cleaned.slice(codeDigits.length),
      };
    }
  }
  
  // Default Brasil
  return { countryCode: '+55', number: cleaned };
}

// Formatar telefone para exibição
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned;
}

export function LeadEditDialog({ lead, open, onOpenChange, onSaved }: LeadEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const phoneParts = extractPhoneParts(lead?.phone);
  
  const form = useForm<LeadEditFormData>({
    resolver: zodResolver(leadEditSchema),
    defaultValues: {
      name: '',
      countryCode: '+55',
      phone: '',
      email: '',
      source: '',
      notes: '',
      customFields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  // Carregar dados do lead quando abre
  useEffect(() => {
    if (lead && open) {
      const parts = extractPhoneParts(lead.phone);
      form.reset({
        name: lead.name || '',
        countryCode: parts.countryCode,
        phone: parts.number,
        email: lead.email || '',
        source: lead.source || '',
        notes: lead.notes || '',
        customFields: [],
      });
    }
  }, [lead, open, form]);

  const onSubmit = async (data: LeadEditFormData) => {
    if (!lead) return;
    
    setIsSaving(true);
    try {
      // Montar telefone completo com DDI
      const fullPhone = data.phone 
        ? `${data.countryCode}${data.phone.replace(/\D/g, '')}` 
        : lead.phone;

      const { error } = await supabase
        .from('leads')
        .update({
          name: data.name.trim(),
          phone: fullPhone,
          email: data.email?.trim() || null,
          source: data.source?.trim() || null,
          notes: data.notes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Lead atualizado com sucesso!');
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomField = () => {
    append({
      id: crypto.randomUUID(),
      label: '',
      value: '',
      type: 'text',
    });
  };

  // Handler para permitir apenas números no telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    form.setValue('phone', value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
            Editar Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-2">
              {/* Nome */}
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">
                  Nome completo *
                </Label>
                <Input
                  {...form.register('name')}
                  placeholder="Nome do lead"
                  className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Telefone com DDI */}
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">
                  Telefone (com DDI)
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={form.watch('countryCode')}
                    onValueChange={(v) => form.setValue('countryCode', v)}
                  >
                    <SelectTrigger className="w-[130px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((cc) => (
                        <SelectItem key={cc.code} value={cc.code}>
                          {cc.flag} {cc.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={form.watch('phone')}
                    onChange={handlePhoneChange}
                    placeholder="11999998888"
                    maxLength={11}
                    className="flex-1 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                  />
                </div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  {form.watch('phone') && formatPhoneNumber(form.watch('phone'))}
                </p>
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-400">{form.formState.errors.phone.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Email</Label>
                <Input
                  {...form.register('email')}
                  type="email"
                  placeholder="email@exemplo.com"
                  className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Origem */}
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">
                  Origem / Fonte
                </Label>
                <Input
                  {...form.register('source')}
                  placeholder="Ex: Instagram, Google Ads, Indicação"
                  className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Observações</Label>
                <Textarea
                  {...form.register('notes')}
                  placeholder="Notas sobre o lead..."
                  rows={3}
                  className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
              </div>

              <Separator className="bg-[hsl(var(--avivar-border))]" />

              {/* Campos Customizados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[hsl(var(--avivar-foreground))]">
                    Campos Personalizados
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomField}
                    className="gap-1 text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))]"
                  >
                    <Plus className="h-3 w-3" />
                    Novo Campo
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] text-center py-3">
                    Nenhum campo personalizado. Clique em "Novo Campo" para adicionar.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex gap-2 items-start p-3 rounded-lg bg-[hsl(var(--avivar-muted)/0.3)] border border-[hsl(var(--avivar-border))]"
                      >
                        <div className="flex-1 space-y-2">
                          <Input
                            {...form.register(`customFields.${index}.label`)}
                            placeholder="Nome do campo"
                            className="text-sm bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                          />
                          <Input
                            {...form.register(`customFields.${index}.value`)}
                            placeholder="Valor"
                            className="text-sm bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="shrink-0 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t border-[hsl(var(--avivar-border))]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[hsl(var(--avivar-muted-foreground))]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
