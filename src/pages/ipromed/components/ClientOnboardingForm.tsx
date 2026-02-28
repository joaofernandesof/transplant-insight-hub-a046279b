/**
 * CPG Advocacia - Card de respostas do formulário de onboarding na página do cliente
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
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientOnboardingFormProps {
  clientId: string;
  clientName: string;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean | null | undefined }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant={value ? "default" : "secondary"} className="text-xs">
        {value ? "Sim" : "Não"}
      </Badge>
    </div>
  );
}

export function ClientOnboardingForm({ clientId, clientName }: ClientOnboardingFormProps) {
  const [creating, setCreating] = useState(false);

  const { data: form, isLoading, refetch } = useQuery({
    queryKey: ['client-onboarding-form', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_onboarding_forms')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
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

      // Create task for Larissa
      await supabase.from('ipromed_legal_tasks').insert({
        title: `Enviar formulário de onboarding para ${clientName}`,
        description: `Enviar o link do formulário de onboarding para o cliente ${clientName}. Link: ${window.location.origin}/forms/onboarding/${token}`,
        assigned_to_name: 'Isabele Cartaxo',
        status: 'pending',
        priority: 'high',
        category: 'onboarding',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
      });

      toast.success('Formulário criado e tarefa atribuída!');
      refetch();
    } catch (err) {
      console.error('Error creating form:', err);
      toast.error('Erro ao criar formulário.');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    if (!form?.token) return;
    const link = `${window.location.origin}/forms/onboarding/${form.token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (!form) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground mb-4">
            Nenhum formulário de onboarding enviado para este cliente.
          </p>
          <Button onClick={generateFormLink} disabled={creating} className="gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Gerar Formulário de Onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formLink = `${window.location.origin}/forms/onboarding/${form.token}`;
  const isPending = form.status === 'pending';

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Formulário de Onboarding
            </CardTitle>
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
              <Clock className="h-3 w-3" /> Aguardando resposta
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
            <code className="text-xs flex-1 truncate">{formLink}</code>
            <Button variant="ghost" size="icon" onClick={copyLink} title="Copiar link">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" asChild title="Abrir formulário">
              <a href={formLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Form submitted - show all responses
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Formulário de Onboarding
          </CardTitle>
          <Badge className="gap-1 bg-emerald-500 text-white">
            <CheckCircle2 className="h-3 w-3" /> Respondido
            {form.submitted_at && (
              <span className="ml-1">
                em {format(new Date(form.submitted_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dados Pessoais */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">👨‍⚕️ Dados do Médico</h4>
          <InfoRow label="Nome" value={form.doctor_name} />
          <InfoRow label="Data de Nascimento" value={form.birth_date ? format(new Date(form.birth_date + 'T12:00:00'), "dd/MM/yyyy") : null} />
        </div>

        {/* Clínica */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">🏥 Clínica</h4>
          <InfoRow label="Tipo" value={form.doc_entity_type === 'pessoa_fisica' ? 'Pessoa Física' : form.doc_entity_type === 'pessoa_juridica' ? 'Pessoa Jurídica' : null} />
          <InfoRow label="CNPJ" value={form.cnpj} />
          <InfoRow label="Endereço" value={form.clinic_address} />
        </div>

        {/* Cancelamento */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">🚫 Política de Cancelamento</h4>
          <InfoRow label="Prazo mínimo (horas)" value={form.cancel_min_hours?.toString()} />
          <BoolRow label="Multa por cancelamento" value={form.cancel_has_fine} />
          <InfoRow label="Detalhe da multa" value={form.cancel_fine_detail} />
          <BoolRow label="Cobrança integral no-show" value={form.noshow_full_charge} />
          <InfoRow label="Política de remarcação" value={form.noshow_reschedule_policy} />
          <InfoRow label="Emergência médica" value={form.cancel_medical_emergency} />
        </div>

        {/* Sinal */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">💰 Sinal / Reserva</h4>
          <BoolRow label="Cobra sinal" value={form.deposit_required} />
          <InfoRow label="Valor/Percentual" value={form.deposit_amount} />
          <BoolRow label="Reembolsável" value={form.deposit_refundable} />
          <BoolRow label="Convertível em crédito" value={form.deposit_convertible} />
          <InfoRow label="Tolerância de atraso (min)" value={form.late_tolerance_minutes?.toString()} />
        </div>

        {/* Atrasos */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">⏰ Atrasos</h4>
          <InfoRow label="Limite de atraso (min)" value={form.late_limit_minutes?.toString()} />
          <InfoRow label="Após o prazo" value={form.late_policy === 'cancelada' ? 'Cancelada' : form.late_policy === 'reduzida' ? 'Reduzida' : form.late_policy === 'remarcada' ? 'Remarcada' : null} />
          <BoolRow label="Possibilidade de encaixe" value={form.late_fit_in} />
        </div>

        {/* Retorno */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">🔄 Retorno</h4>
          <BoolRow label="Tem retorno" value={form.has_followup} />
          <InfoRow label="Dias de validade" value={form.followup_days?.toString()} />
          <InfoRow label="Modalidade" value={form.followup_modality === 'presencial' ? 'Presencial' : form.followup_modality === 'online' ? 'Online' : form.followup_modality === 'ambos' ? 'Ambos' : null} />
          <InfoRow label="Escopo" value={form.followup_scope === 'avaliacao' ? 'Apenas avaliação' : form.followup_scope === 'ajustes' ? 'Avaliação + ajustes' : null} />
          <InfoRow label="Após o prazo" value={form.followup_expired_policy} />
        </div>

        {/* Confirmação */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">💬 Confirmação</h4>
          <InfoRow label="Tentativas de contato" value={form.confirmation_attempts?.toString()} />
          <BoolRow label="Cancelamento automático" value={form.no_response_auto_cancel} />
          <InfoRow label="Canal oficial" value={
            form.official_channel === 'whatsapp' ? 'WhatsApp' :
            form.official_channel === 'email' ? 'E-mail' :
            form.official_channel === 'phone' ? 'Ligação' :
            form.official_channel === 'multiple' ? 'Múltiplos canais' : null
          } />
          <BoolRow label="Mensagens automáticas" value={form.uses_auto_messages} />
        </div>

        {/* Teleconsulta */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">📹 Consulta Online</h4>
          <BoolRow label="Teleconsulta" value={form.has_teleconsultation} />
          <InfoRow label="Plataforma" value={form.teleconsultation_platform} />
        </div>

        {/* Documentação */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">📄 Documentação e Preparo</h4>
          <BoolRow label="Orientação prévia" value={form.has_prior_instructions} />
          <InfoRow label="Antecedência (min)" value={form.arrival_advance_minutes?.toString()} />
          <InfoRow label="Duração da consulta (min)" value={form.consultation_duration_minutes?.toString()} />
        </div>

        {/* Financeiro */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">💳 Regras Financeiras</h4>
          <BoolRow label="Reembolso de consulta" value={form.has_consultation_refund} />
          <BoolRow label="Reembolso de procedimento" value={form.has_procedure_refund} />
          <BoolRow label="Pagamento vira crédito" value={form.advance_payment_credit} />
          <InfoRow label="Validade do crédito (dias)" value={form.credit_validity_days?.toString()} />
        </div>
      </CardContent>
    </Card>
  );
}
