/**
 * Seção "Políticas da Clínica" para a Pauta de Onboarding
 * Campos vindos do formulário público de onboarding (OnboardingPublicForm)
 */

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { YesNoSelector } from "./YesNoSelector";
import { Badge } from "@/components/ui/badge";
import { Ban, DollarSign, Clock, RotateCcw, MessageSquare, Video, FileText, Wallet } from "lucide-react";

function SubSectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h4>
    </div>
  );
}

interface OnboardingPoliciesSectionProps {
  onboardingFormData?: Record<string, any> | null;
}

export default function OnboardingPoliciesSection({ onboardingFormData }: OnboardingPoliciesSectionProps) {
  const form = useFormContext();

  return (
    <div className="space-y-5 pt-2 max-w-2xl">
      {onboardingFormData && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            ✅ Dados pré-preenchidos a partir do formulário de onboarding enviado pelo cliente
          </p>
        </div>
      )}

      {/* Clínica */}
      <SubSectionHeader icon={FileText} title="Dados da Clínica" />

      <FormField
        control={form.control}
        name="polDocEntityType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>📄 Documentos em nome de</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="pessoa_fisica">Pessoa Física (Médico)</SelectItem>
                <SelectItem value="pessoa_juridica">Pessoa Jurídica (Clínica)</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polCnpj"
        render={({ field }) => (
          <FormItem>
            <FormLabel>🏢 CNPJ</FormLabel>
            <FormControl>
              <Input placeholder="00.000.000/0000-00" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polClinicAddress"
        render={({ field }) => (
          <FormItem>
            <FormLabel>📍 Endereço completo da clínica</FormLabel>
            <FormControl>
              <Textarea placeholder="Rua, número, bairro, cidade, estado, CEP" className="min-h-[60px]" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />

      {/* Política de Cancelamento */}
      <SubSectionHeader icon={Ban} title="Política de Cancelamento" />

      <FormField
        control={form.control}
        name="polCancelMinHours"
        render={({ field }) => (
          <FormItem>
            <FormLabel>⏰ Prazo mínimo para cancelamento sem cobrança (horas)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Ex: 24" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polCancelHasFine"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="💰 Multa por cancelamento fora do prazo?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polCancelFineDetail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>📝 Detalhe da multa</FormLabel>
            <FormControl>
              <Input placeholder="Ex: 50% do valor da consulta" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polNoshowFullCharge"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="🚫 No-show: cobrança integral?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polNoshowReschedulePolicy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>🔄 Política de remarcação após no-show</FormLabel>
            <FormControl>
              <Textarea placeholder="O paciente poderá remarcar ou precisará novo pagamento?" className="min-h-[60px]" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polCancelMedicalEmergency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>🏥 Cancelamento por emergência médica</FormLabel>
            <FormControl>
              <Textarea placeholder="Como será tratado?" className="min-h-[60px]" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />

      {/* Sinal / Reserva */}
      <SubSectionHeader icon={DollarSign} title="Sinal / Reserva de Agenda" />

      <FormField
        control={form.control}
        name="polDepositRequired"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="💵 Cobra sinal para confirmar consulta?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polDepositAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>💲 Valor ou percentual do sinal</FormLabel>
            <FormControl>
              <Input placeholder="Ex: R$ 100 ou 30%" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polDepositRefundable"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="↩️ Sinal reembolsável?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polDepositConvertible"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="🔄 Sinal convertível em crédito?" />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />

      {/* Atrasos */}
      <SubSectionHeader icon={Clock} title="Atrasos e Pontualidade" />

      <FormField
        control={form.control}
        name="polLateToleranceMinutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>⏱️ Tolerância de atraso (minutos)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Ex: 15" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polLateLimitMinutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>🚨 Limite máximo de atraso (minutos)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Ex: 30" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polLatePolicy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>📋 Após o limite, a consulta será:</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="cancelada">Cancelada</SelectItem>
                <SelectItem value="reduzida">Reduzida no tempo restante</SelectItem>
                <SelectItem value="remarcada">Remarcada</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polLateFitIn"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="🔀 Possibilidade de encaixe em caso de atraso?" />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />

      {/* Retorno */}
      <SubSectionHeader icon={RotateCcw} title="Retorno e Continuidade" />

      <FormField
        control={form.control}
        name="polHasFollowup"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="🔁 Paciente terá direito a retorno?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polFollowupDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>📅 Prazo do retorno (dias após consulta)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Ex: 30" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polFollowupModality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>📍 Modalidade do retorno</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polFollowupScope"
        render={({ field }) => (
          <FormItem>
            <FormLabel>🎯 O retorno cobre</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="avaliacao">Apenas avaliação</SelectItem>
                <SelectItem value="ajustes">Avaliação e ajustes de tratamento</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polFollowupExpiredPolicy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>⚠️ Política após expirar prazo do retorno</FormLabel>
            <FormControl>
              <Textarea placeholder="Ex: Será cobrada nova consulta" className="min-h-[60px]" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />

      {/* Confirmação e Comunicação */}
      <SubSectionHeader icon={MessageSquare} title="Confirmação e Comunicação" />

      <FormField
        control={form.control}
        name="polConfirmationAttempts"
        render={({ field }) => (
          <FormItem>
            <FormLabel>📞 Tentativas de contato para confirmação</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Ex: 3" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polNoResponseAutoCancel"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="❌ Sem resposta = cancelamento automático?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polOfficialChannel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>📱 Canal oficial de comunicação</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="phone">Ligação</SelectItem>
                <SelectItem value="multiple">Múltiplos canais</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polUsesAutoMessages"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="🤖 Usa mensagens automáticas?" />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />

      {/* Teleconsulta */}
      <SubSectionHeader icon={Video} title="Consulta Online" />

      <FormField
        control={form.control}
        name="polHasTeleconsultation"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="💻 Opção de teleconsulta?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polTeleconsultationPlatform"
        render={({ field }) => (
          <FormItem>
            <FormLabel>🖥️ Plataforma utilizada</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Google Meet, Zoom" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />

      {/* Documentação e Preparo */}
      <SubSectionHeader icon={FileText} title="Documentação e Preparo" />

      <FormField
        control={form.control}
        name="polHasPriorInstructions"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="📋 Orientação prévia antes da consulta?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polArrivalAdvanceMinutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>🕐 Antecedência de chegada (minutos)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Ex: 15" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polConsultationDurationMinutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>⏳ Duração da consulta (minutos)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Ex: 30" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
            </FormControl>
          </FormItem>
        )}
      />

      <Separator />

      {/* Regras Financeiras */}
      <SubSectionHeader icon={Wallet} title="Regras Financeiras" />

      <FormField
        control={form.control}
        name="polHasConsultationRefund"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="💰 Reembolso de consulta em alguma hipótese?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polHasProcedureRefund"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="💳 Reembolso de procedimento em alguma hipótese?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polAdvancePaymentCredit"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <YesNoSelector value={field.value} onChange={field.onChange} label="🔄 Pagamento antecipado vira crédito?" />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="polCreditValidityDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>📅 Prazo de validade do crédito (dias)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Ex: 90" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
