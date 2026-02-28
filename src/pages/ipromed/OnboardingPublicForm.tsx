/**
 * CPG Advocacia Médica - Formulário Público de Onboarding
 * Acessível via link único sem autenticação (estilo Google Forms)
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  Building2,
  Ban,
  DollarSign,
  Clock,
  RotateCcw,
  MessageSquare,
  Video,
  FileText,
  Wallet,
} from "lucide-react";
import cpgLogo from "@/assets/cpg-logo-horizontal.png";

interface FormData {
  doctor_name: string;
  birth_date: string;
  doc_entity_type: string;
  cnpj: string;
  clinic_address: string;
  cancel_min_hours: string;
  cancel_has_fine: string;
  cancel_fine_detail: string;
  noshow_full_charge: string;
  noshow_reschedule_policy: string;
  cancel_medical_emergency: string;
  deposit_required: string;
  deposit_amount: string;
  deposit_refundable: string;
  deposit_convertible: string;
  late_tolerance_minutes: string;
  late_limit_minutes: string;
  late_policy: string;
  late_fit_in: string;
  has_followup: string;
  followup_days: string;
  followup_modality: string;
  followup_scope: string;
  followup_expired_policy: string;
  confirmation_attempts: string;
  no_response_auto_cancel: string;
  official_channel: string;
  uses_auto_messages: string;
  has_teleconsultation: string;
  teleconsultation_platform: string;
  has_prior_instructions: string;
  arrival_advance_minutes: string;
  consultation_duration_minutes: string;
  has_consultation_refund: string;
  has_procedure_refund: string;
  advance_payment_credit: string;
  credit_validity_days: string;
}

const initialFormData: FormData = {
  doctor_name: '',
  birth_date: '',
  doc_entity_type: '',
  cnpj: '',
  clinic_address: '',
  cancel_min_hours: '',
  cancel_has_fine: '',
  cancel_fine_detail: '',
  noshow_full_charge: '',
  noshow_reschedule_policy: '',
  cancel_medical_emergency: '',
  deposit_required: '',
  deposit_amount: '',
  deposit_refundable: '',
  deposit_convertible: '',
  late_tolerance_minutes: '',
  late_limit_minutes: '',
  late_policy: '',
  late_fit_in: '',
  has_followup: '',
  followup_days: '',
  followup_modality: '',
  followup_scope: '',
  followup_expired_policy: '',
  confirmation_attempts: '',
  no_response_auto_cancel: '',
  official_channel: '',
  uses_auto_messages: '',
  has_teleconsultation: '',
  teleconsultation_platform: '',
  has_prior_instructions: '',
  arrival_advance_minutes: '',
  consultation_duration_minutes: '',
  has_consultation_refund: '',
  has_procedure_refund: '',
  advance_payment_credit: '',
  credit_validity_days: '',
};

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 pt-8 pb-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#2d4a2e] text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold text-[#2d4a2e]">{title}</h2>
    </div>
  );
}

function YesNoField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="flex gap-4">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="true" id={`${label}-yes`} />
          <Label htmlFor={`${label}-yes`} className="cursor-pointer text-sm">Sim</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="false" id={`${label}-no`} />
          <Label htmlFor={`${label}-no`} className="cursor-pointer text-sm">Não</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

export default function OnboardingPublicForm() {
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    loadForm();
  }, [token]);

  const loadForm = async () => {
    if (!token) { setError('Token inválido'); setLoading(false); return; }

    const { data, error: fetchError } = await supabase
      .from('ipromed_onboarding_forms')
      .select('*, ipromed_legal_clients(name)')
      .eq('token', token)
      .single();

    if (fetchError || !data) {
      setError('Formulário não encontrado ou link inválido.');
      setLoading(false);
      return;
    }

    if (data.status === 'submitted') {
      setSubmitted(true);
      setLoading(false);
      return;
    }

    setClientName((data as any).ipromed_legal_clients?.name || '');
    
    // Pre-fill with existing data if any
    if (data.doctor_name) setFormData(prev => ({ ...prev, doctor_name: data.doctor_name || '' }));
    
    setLoading(false);
  };

  const set = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.doctor_name.trim()) {
      toast.error('Por favor, preencha o nome do médico.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('ipromed_onboarding_forms')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          doctor_name: formData.doctor_name,
          birth_date: formData.birth_date || null,
          doc_entity_type: formData.doc_entity_type || null,
          cnpj: formData.cnpj || null,
          clinic_address: formData.clinic_address || null,
          cancel_min_hours: formData.cancel_min_hours ? parseInt(formData.cancel_min_hours) : null,
          cancel_has_fine: formData.cancel_has_fine ? formData.cancel_has_fine === 'true' : null,
          cancel_fine_detail: formData.cancel_fine_detail || null,
          noshow_full_charge: formData.noshow_full_charge ? formData.noshow_full_charge === 'true' : null,
          noshow_reschedule_policy: formData.noshow_reschedule_policy || null,
          cancel_medical_emergency: formData.cancel_medical_emergency || null,
          deposit_required: formData.deposit_required ? formData.deposit_required === 'true' : null,
          deposit_amount: formData.deposit_amount || null,
          deposit_refundable: formData.deposit_refundable ? formData.deposit_refundable === 'true' : null,
          deposit_convertible: formData.deposit_convertible ? formData.deposit_convertible === 'true' : null,
          late_tolerance_minutes: formData.late_tolerance_minutes ? parseInt(formData.late_tolerance_minutes) : null,
          late_limit_minutes: formData.late_limit_minutes ? parseInt(formData.late_limit_minutes) : null,
          late_policy: formData.late_policy || null,
          late_fit_in: formData.late_fit_in ? formData.late_fit_in === 'true' : null,
          has_followup: formData.has_followup ? formData.has_followup === 'true' : null,
          followup_days: formData.followup_days ? parseInt(formData.followup_days) : null,
          followup_modality: formData.followup_modality || null,
          followup_scope: formData.followup_scope || null,
          followup_expired_policy: formData.followup_expired_policy || null,
          confirmation_attempts: formData.confirmation_attempts ? parseInt(formData.confirmation_attempts) : null,
          no_response_auto_cancel: formData.no_response_auto_cancel ? formData.no_response_auto_cancel === 'true' : null,
          official_channel: formData.official_channel || null,
          uses_auto_messages: formData.uses_auto_messages ? formData.uses_auto_messages === 'true' : null,
          has_teleconsultation: formData.has_teleconsultation ? formData.has_teleconsultation === 'true' : null,
          teleconsultation_platform: formData.teleconsultation_platform || null,
          has_prior_instructions: formData.has_prior_instructions ? formData.has_prior_instructions === 'true' : null,
          arrival_advance_minutes: formData.arrival_advance_minutes ? parseInt(formData.arrival_advance_minutes) : null,
          consultation_duration_minutes: formData.consultation_duration_minutes ? parseInt(formData.consultation_duration_minutes) : null,
          has_consultation_refund: formData.has_consultation_refund ? formData.has_consultation_refund === 'true' : null,
          has_procedure_refund: formData.has_procedure_refund ? formData.has_procedure_refund === 'true' : null,
          advance_payment_credit: formData.advance_payment_credit ? formData.advance_payment_credit === 'true' : null,
          credit_validity_days: formData.credit_validity_days ? parseInt(formData.credit_validity_days) : null,
        })
        .eq('token', token);

      if (updateError) throw updateError;
      setSubmitted(true);
      toast.success('Formulário enviado com sucesso!');
    } catch (err) {
      console.error('Error submitting form:', err);
      toast.error('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2d4a2e]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <Ban className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Link Inválido</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Formulário Enviado!</h2>
          <p className="text-gray-600">
            Obrigado por preencher o formulário de onboarding. Nossa equipe jurídica analisará suas respostas e entrará em contato.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#2d4a2e] text-white py-8">
        <div className="max-w-2xl mx-auto px-4 flex flex-col items-center text-center">
          <img src={cpgLogo} alt="CPG Advocacia Médica" className="h-16 md:h-20 mb-4 object-contain" />
          <h1 className="text-2xl md:text-3xl font-bold">
            Questionário de Onboarding
          </h1>
          <p className="text-white/70 mt-2 text-sm md:text-base">
            {clientName ? `${clientName} — ` : ''}Preencha com os dados da sua clínica para que possamos finalizar a documentação.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-6 p-6 md:p-8">
          {/* Dados do Cliente */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#2d4a2e]">Dados do Cliente</h2>
            <div>
              <Label className="text-sm font-medium text-gray-700">Nome do cliente *</Label>
              <Input value={formData.doctor_name} onChange={e => set('doctor_name')(e.target.value)} placeholder="Nome completo" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Data de nascimento</Label>
              <Input type="date" value={formData.birth_date} onChange={e => set('birth_date')(e.target.value)} className="mt-1" />
            </div>
          </div>
        </div>

        {/* CLÍNICA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6 md:p-8">
          <SectionHeader icon={Building2} title="Clínica" />
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Os documentos ficarão em nome de:</Label>
              <RadioGroup value={formData.doc_entity_type} onValueChange={set('doc_entity_type')} className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pessoa_fisica" id="pf" />
                  <Label htmlFor="pf" className="cursor-pointer text-sm">Pessoa Física (Médico)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pessoa_juridica" id="pj" />
                  <Label htmlFor="pj" className="cursor-pointer text-sm">Pessoa Jurídica (Clínica)</Label>
                </div>
              </RadioGroup>
            </div>
            {formData.doc_entity_type === 'pessoa_juridica' && (
              <div>
                <Label className="text-sm font-medium text-gray-700">CNPJ</Label>
                <Input value={formData.cnpj} onChange={e => set('cnpj')(e.target.value)} placeholder="00.000.000/0000-00" className="mt-1" />
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-700">Endereço completo da clínica</Label>
              <Textarea value={formData.clinic_address} onChange={e => set('clinic_address')(e.target.value)} placeholder="Rua, número, bairro, cidade, estado, CEP" className="mt-1" />
            </div>
          </div>
        </div>

        {/* POLÍTICA DE CANCELAMENTO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6 md:p-8">
          <SectionHeader icon={Ban} title="Política de Cancelamento" />
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Prazo mínimo para cancelamento sem cobrança (em horas)</Label>
              <Input type="number" value={formData.cancel_min_hours} onChange={e => set('cancel_min_hours')(e.target.value)} placeholder="Ex: 24" className="mt-1" />
            </div>
            <YesNoField label="Haverá multa por cancelamento fora do prazo?" value={formData.cancel_has_fine} onChange={set('cancel_has_fine')} />
            {formData.cancel_has_fine === 'true' && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Qual percentual ou valor fixo da multa?</Label>
                <Input value={formData.cancel_fine_detail} onChange={e => set('cancel_fine_detail')(e.target.value)} placeholder="Ex: 50% do valor da consulta" className="mt-1" />
              </div>
            )}
            <YesNoField label="Em caso de não comparecimento (no-show), haverá cobrança integral?" value={formData.noshow_full_charge} onChange={set('noshow_full_charge')} />
            <div>
              <Label className="text-sm font-medium text-gray-700">O paciente poderá remarcar após no-show ou precisará realizar novo pagamento?</Label>
              <Textarea value={formData.noshow_reschedule_policy} onChange={e => set('noshow_reschedule_policy')(e.target.value)} placeholder="Descreva a política" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Como será tratado cancelamento por motivo médico ou emergência?</Label>
              <Textarea value={formData.cancel_medical_emergency} onChange={e => set('cancel_medical_emergency')(e.target.value)} placeholder="Ex: Consulta cancelada com reembolso" className="mt-1" />
            </div>
          </div>
        </div>

        {/* SINAL / RESERVA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6 md:p-8">
          <SectionHeader icon={DollarSign} title="Sinal / Reserva de Agenda" />
          <div className="space-y-4">
            <YesNoField label="Será cobrado sinal para confirmar a consulta?" value={formData.deposit_required} onChange={set('deposit_required')} />
            {formData.deposit_required === 'true' && (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Qual valor ou percentual do sinal?</Label>
                  <Input value={formData.deposit_amount} onChange={e => set('deposit_amount')(e.target.value)} placeholder="Ex: R$ 100 ou 30%" className="mt-1" />
                </div>
                <YesNoField label="O sinal é reembolsável?" value={formData.deposit_refundable} onChange={set('deposit_refundable')} />
                <YesNoField label="O sinal pode ser convertido em crédito para outro serviço?" value={formData.deposit_convertible} onChange={set('deposit_convertible')} />
              </>
            )}
            <div>
              <Label className="text-sm font-medium text-gray-700">Em caso de atraso do paciente, quantos minutos de tolerância?</Label>
              <Input type="number" value={formData.late_tolerance_minutes} onChange={e => set('late_tolerance_minutes')(e.target.value)} placeholder="Ex: 15" className="mt-1" />
            </div>
          </div>
        </div>

        {/* ATRASOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6 md:p-8">
          <SectionHeader icon={Clock} title="Atrasos e Pontualidade" />
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Limite de atraso permitido para manter a consulta (minutos)</Label>
              <Input type="number" value={formData.late_limit_minutes} onChange={e => set('late_limit_minutes')(e.target.value)} placeholder="Ex: 15" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Após esse prazo, a consulta será:</Label>
              <Select value={formData.late_policy} onValueChange={set('late_policy')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="reduzida">Reduzida no tempo restante</SelectItem>
                  <SelectItem value="remarcada">Remarcada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <YesNoField label="Existe possibilidade de encaixe em caso de atraso?" value={formData.late_fit_in} onChange={set('late_fit_in')} />
          </div>
        </div>

        {/* RETORNO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6 md:p-8">
          <SectionHeader icon={RotateCcw} title="Retorno e Continuidade" />
          <div className="space-y-4">
            <YesNoField label="O paciente terá direito a retorno?" value={formData.has_followup} onChange={set('has_followup')} />
            {formData.has_followup === 'true' && (
              <>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Quantos dias após a consulta o retorno será válido?</Label>
                  <Input type="number" value={formData.followup_days} onChange={e => set('followup_days')(e.target.value)} placeholder="Ex: 30" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">O retorno é:</Label>
                  <Select value={formData.followup_modality} onValueChange={set('followup_modality')}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">O retorno cobre:</Label>
                  <Select value={formData.followup_scope} onValueChange={set('followup_scope')}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avaliacao">Apenas avaliação</SelectItem>
                      <SelectItem value="ajustes">Avaliação e ajustes de tratamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Se ultrapassar o prazo do retorno, o que acontece?</Label>
                  <Textarea value={formData.followup_expired_policy} onChange={e => set('followup_expired_policy')(e.target.value)} placeholder="Ex: Será cobrada nova consulta" className="mt-1" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* CONFIRMAÇÃO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6 md:p-8">
          <SectionHeader icon={MessageSquare} title="Confirmação e Comunicação" />
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Quantas tentativas de contato para confirmação?</Label>
              <Input type="number" value={formData.confirmation_attempts} onChange={e => set('confirmation_attempts')(e.target.value)} placeholder="Ex: 3" className="mt-1" />
            </div>
            <YesNoField label="Se o paciente não responder, a consulta será automaticamente cancelada?" value={formData.no_response_auto_cancel} onChange={set('no_response_auto_cancel')} />
            <div>
              <Label className="text-sm font-medium text-gray-700">Canal oficial para comunicações:</Label>
              <Select value={formData.official_channel} onValueChange={set('official_channel')}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Ligação</SelectItem>
                  <SelectItem value="multiple">Múltiplos canais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <YesNoField label="A clínica utiliza mensagens automáticas?" value={formData.uses_auto_messages} onChange={set('uses_auto_messages')} />
          </div>
        </div>

        {/* CONSULTA ONLINE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6 md:p-8">
          <SectionHeader icon={Video} title="Consulta Online" />
          <div className="space-y-4">
            <YesNoField label="Haverá opção de teleconsulta?" value={formData.has_teleconsultation} onChange={set('has_teleconsultation')} />
            {formData.has_teleconsultation === 'true' && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Qual plataforma será utilizada?</Label>
                <Input value={formData.teleconsultation_platform} onChange={e => set('teleconsultation_platform')(e.target.value)} placeholder="Ex: Google Meet, Zoom, etc." className="mt-1" />
              </div>
            )}
          </div>
        </div>

        {/* DOCUMENTAÇÃO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6 md:p-8">
          <SectionHeader icon={FileText} title="Documentação e Preparo" />
          <div className="space-y-4">
            <YesNoField label="Existe orientação prévia antes da consulta?" value={formData.has_prior_instructions} onChange={set('has_prior_instructions')} />
            <div>
              <Label className="text-sm font-medium text-gray-700">O paciente precisa chegar com antecedência? Quantos minutos?</Label>
              <Input type="number" value={formData.arrival_advance_minutes} onChange={e => set('arrival_advance_minutes')(e.target.value)} placeholder="Ex: 15" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Tempo de duração da consulta (minutos)</Label>
              <Input type="number" value={formData.consultation_duration_minutes} onChange={e => set('consultation_duration_minutes')(e.target.value)} placeholder="Ex: 30" className="mt-1" />
            </div>
          </div>
        </div>

        {/* REGRAS FINANCEIRAS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mt-4 p-6 md:p-8">
          <SectionHeader icon={Wallet} title="Regras Financeiras" />
          <div className="space-y-4">
            <YesNoField label="Haverá reembolso de consulta em alguma hipótese?" value={formData.has_consultation_refund} onChange={set('has_consultation_refund')} />
            <YesNoField label="Haverá reembolso de valores de procedimento em alguma hipótese?" value={formData.has_procedure_refund} onChange={set('has_procedure_refund')} />
            <YesNoField label="Pagamentos antecipados podem virar crédito para outra consulta ou procedimento?" value={formData.advance_payment_credit} onChange={set('advance_payment_credit')} />
            {formData.advance_payment_credit === 'true' && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Prazo para utilização do crédito (dias)</Label>
                <Input type="number" value={formData.credit_validity_days} onChange={e => set('credit_validity_days')(e.target.value)} placeholder="Ex: 90" className="mt-1" />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#2d4a2e] hover:bg-[#3d5e3e] text-white px-12 py-6 text-lg rounded-xl shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              'Enviar Formulário'
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          CPG Advocacia Médica • Formulário de Onboarding
        </p>
      </div>
    </div>
  );
}
