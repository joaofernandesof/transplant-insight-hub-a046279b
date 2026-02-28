/**
 * CPG Advocacia - Widget "Formulários" na página do cliente
 * Lista todos os formulários enviados para o cliente (onboarding, etc.)
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Send,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ClientOnboardingFormProps {
  clientId: string;
  clientName: string;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={value ? "default" : "secondary"} className="text-xs">
        {value ? "Sim" : "Não"}
      </Badge>
    </div>
  );
}

function FormCard({ form }: { form: any }) {
  const [expanded, setExpanded] = useState(false);
  const formLink = `${window.location.origin}/forms/onboarding/${form.token}`;
  const isPending = form.status === 'pending';
  const isSubmitted = form.status === 'submitted';

  const copyLink = () => {
    navigator.clipboard.writeText(formLink);
    toast.success('Link copiado!');
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border border-border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Formulário de Onboarding</span>
            </div>
            <div className="flex items-center gap-2">
              {isPending && (
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50 text-xs">
                  <Clock className="h-3 w-3" /> Aguardando
                </Badge>
              )}
              {isSubmitted && (
                <Badge className="gap-1 bg-emerald-500 text-white text-xs">
                  <CheckCircle2 className="h-3 w-3" /> Respondido
                </Badge>
              )}
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Always show link bar */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
            <code className="text-xs flex-1 truncate">{formLink}</code>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); copyLink(); }} title="Copiar link">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Abrir formulário">
              <a href={formLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
          {isPending && (
            <p className="text-xs text-muted-foreground mt-1.5">
              Criado em {form.created_at ? format(new Date(form.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
            </p>
          )}
        </div>

        <CollapsibleContent>
          {isSubmitted && (
            <div className="px-3 pb-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Respondido em {form.submitted_at ? format(new Date(form.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
              </p>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">👨‍⚕️ Dados do Médico</h4>
                <InfoRow label="Nome" value={form.doctor_name} />
                <InfoRow label="Data de Nascimento" value={form.birth_date ? format(new Date(form.birth_date + 'T12:00:00'), "dd/MM/yyyy") : null} />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">🏥 Clínica</h4>
                <InfoRow label="Tipo" value={form.doc_entity_type === 'pessoa_fisica' ? 'Pessoa Física' : form.doc_entity_type === 'pessoa_juridica' ? 'Pessoa Jurídica' : null} />
                <InfoRow label="CNPJ" value={form.cnpj} />
                <InfoRow label="Endereço" value={form.clinic_address} />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">🚫 Cancelamento</h4>
                <InfoRow label="Prazo mínimo (h)" value={form.cancel_min_hours?.toString()} />
                <BoolRow label="Multa" value={form.cancel_has_fine} />
                <InfoRow label="Detalhe" value={form.cancel_fine_detail} />
                <BoolRow label="Cobrança integral no-show" value={form.noshow_full_charge} />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">💰 Sinal / Reserva</h4>
                <BoolRow label="Cobra sinal" value={form.deposit_required} />
                <InfoRow label="Valor/%" value={form.deposit_amount} />
                <BoolRow label="Reembolsável" value={form.deposit_refundable} />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">🔄 Retorno</h4>
                <BoolRow label="Tem retorno" value={form.has_followup} />
                <InfoRow label="Dias" value={form.followup_days?.toString()} />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">💳 Financeiro</h4>
                <BoolRow label="Reembolso consulta" value={form.has_consultation_refund} />
                <BoolRow label="Reembolso procedimento" value={form.has_procedure_refund} />
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ClientOnboardingForm({ clientId, clientName }: ClientOnboardingFormProps) {
  const [creating, setCreating] = useState(false);

  const { data: forms, isLoading, refetch } = useQuery({
    queryKey: ['client-onboarding-forms', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_onboarding_forms')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const generateFormLink = async () => {
    setCreating(true);
    try {
      const token = crypto.randomUUID().replace(/-/g, '').substring(0, 32);
      
      const { error } = await supabase
        .from('ipromed_onboarding_forms')
        .insert({
          client_id: clientId,
          token,
          status: 'pending',
        });

      if (error) throw error;

      await supabase.from('ipromed_legal_tasks').insert([{
        title: `Enviar formulário de onboarding para ${clientName}`,
        description: `Enviar o link do formulário de onboarding para o cliente ${clientName}. Link: ${window.location.origin}/forms/onboarding/${token}`,
        assigned_to_name: 'Isabele Cartaxo',
        status: 'pending',
        priority: 3,
        category: 'onboarding',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }]);

      toast.success('Formulário criado e tarefa atribuída!');
      refetch();
    } catch (err) {
      console.error('Error creating form:', err);
      toast.error('Erro ao criar formulário.');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Formulários ({forms?.length || 0})
        </CardTitle>
        <Button size="sm" variant="outline" onClick={generateFormLink} disabled={creating} className="gap-1">
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Novo Formulário
        </Button>
      </CardHeader>
      <CardContent>
        {(!forms || forms.length === 0) ? (
          <div className="py-6 text-center">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nenhum formulário enviado para este cliente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {forms.map((form: any) => (
              <FormCard key={form.id} form={form} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
