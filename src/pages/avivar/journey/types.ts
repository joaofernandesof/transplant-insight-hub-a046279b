/**
 * Avivar Patient Journey Types
 * Commercial Kanban + Post-Sale Kanban with checklists and blocking rules
 */

export type ServiceType = 'capilar' | 'barba' | 'sobrancelha';

export type CommercialStage = 'lead_entrada' | 'triagem' | 'agendamento' | 'follow_up' | 'paciente';

export type PostSaleStage = 'onboarding' | 'contrato' | 'contrato_assinado' | 'pre_operatorio' | 'procedimento' | 'pos_operatorio' | 'relacionamento';

export type JourneyStage = CommercialStage | PostSaleStage;

export type JourneyType = 'comercial' | 'pos_venda';

export interface PatientJourney {
  id: string;
  user_id?: string;
  
  // Patient info
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  
  // Service info
  service_type: ServiceType;
  
  // Current stage
  current_stage: JourneyStage;
  journey_type: JourneyType;
  
  // Lead capture
  lead_source?: string;
  selected_time?: string;
  pain_point?: string;
  desired_area?: string;
  initial_expectation?: string;
  
  // Scheduling
  scheduled_date?: string;
  confirmation_sent: boolean;
  reminder_active: boolean;
  
  // Follow-up
  contact_attempts: number;
  pending_reason?: string;
  next_step?: string;
  
  // Conversion
  attended: boolean;
  converted_at?: string;
  
  // Post-sale: Onboarding
  welcome_sent: boolean;
  initial_instructions_sent: boolean;
  support_channel_informed: boolean;
  
  // Post-sale: Contract
  contract_sent: boolean;
  contract_doubts_cleared: boolean;
  signature_requested: boolean;
  contract_signed: boolean;
  payment_confirmed: boolean;
  legal_status_validated: boolean;
  
  // Post-sale: Pre-op
  exams_requested: boolean;
  exams_verified: boolean;
  pre_op_instructions_sent: boolean;
  
  // Post-sale: Procedure
  procedure_done: boolean;
  photo_record_done: boolean;
  discharge_instructions_given: boolean;
  
  // Post-sale: Post-op
  same_day_contact: boolean;
  next_day_contact: boolean;
  issues_registered: boolean;
  
  // Post-sale: Relationship
  evaluation_requested: boolean;
  testimonial_invited: boolean;
  referral_program_presented: boolean;
  
  // Metadata
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  field: keyof PatientJourney;
  required: boolean;
  serviceSpecific?: ServiceType[];
}

export interface StageConfig {
  id: JourneyStage;
  label: string;
  description: string;
  color: string;
  statusColor: string;
  checklist: ChecklistItem[];
  blockingMessage: string;
}

// Commercial Stages Configuration
export const COMMERCIAL_STAGES: StageConfig[] = [
  {
    id: 'lead_entrada',
    label: 'Lead Entrada',
    description: 'Novos leads aguardando triagem',
    color: 'from-blue-500 to-blue-600',
    statusColor: 'bg-blue-500',
    blockingMessage: 'Complete o nome e tipo de serviço para avançar',
    checklist: [
      { id: 'name', label: 'Captura de nome pela IA', field: 'patient_name', required: true },
      { id: 'service', label: 'Tipo de serviço selecionado', field: 'service_type', required: true },
      { id: 'time', label: 'Horário escolhido', field: 'selected_time', required: false },
    ]
  },
  {
    id: 'triagem',
    label: 'Triagem',
    description: 'Qualificação do lead',
    color: 'from-amber-500 to-amber-600',
    statusColor: 'bg-amber-500',
    blockingMessage: 'Complete a triagem para agendar consulta',
    checklist: [
      { id: 'pain', label: 'Dor principal validada', field: 'pain_point', required: true },
      { id: 'area', label: 'Área desejada confirmada', field: 'desired_area', required: true },
      { id: 'expectation', label: 'Expectativa inicial alinhada', field: 'initial_expectation', required: true },
    ]
  },
  {
    id: 'agendamento',
    label: 'Agendamento',
    description: 'Consulta marcada',
    color: 'from-purple-500 to-purple-600',
    statusColor: 'bg-purple-500',
    blockingMessage: 'Confirme o agendamento para avançar',
    checklist: [
      { id: 'date', label: 'Data e hora definidas', field: 'scheduled_date', required: true },
      { id: 'confirmation', label: 'Confirmação enviada ao paciente', field: 'confirmation_sent', required: true },
      { id: 'reminder', label: 'Lembrete automático ativo', field: 'reminder_active', required: false },
    ]
  },
  {
    id: 'follow_up',
    label: 'Follow Up',
    description: 'Pendências e retornos',
    color: 'from-orange-500 to-orange-600',
    statusColor: 'bg-orange-500',
    blockingMessage: 'Registre o próximo passo para fechar',
    checklist: [
      { id: 'attempts', label: 'Tentativas de contato registradas', field: 'contact_attempts', required: true },
      { id: 'reason', label: 'Motivo da pendência identificado', field: 'pending_reason', required: true },
      { id: 'next', label: 'Próximo passo definido', field: 'next_step', required: true },
    ]
  },
  {
    id: 'paciente',
    label: 'Paciente',
    description: 'Convertido para paciente',
    color: 'from-emerald-500 to-emerald-600',
    statusColor: 'bg-emerald-500',
    blockingMessage: 'Confirme o comparecimento para transferir ao Pós-Venda',
    checklist: [
      { id: 'attended', label: 'Comparecimento confirmado', field: 'attended', required: true },
    ]
  }
];

// Post-Sale Stages Configuration
export const POST_SALE_STAGES: StageConfig[] = [
  {
    id: 'onboarding',
    label: 'Onboarding',
    description: 'Boas-vindas ao paciente',
    color: 'from-cyan-500 to-cyan-600',
    statusColor: 'bg-cyan-500',
    blockingMessage: 'Complete o onboarding para enviar contrato',
    checklist: [
      { id: 'welcome', label: 'Mensagem de boas-vindas enviada', field: 'welcome_sent', required: true },
      { id: 'instructions', label: 'Orientações iniciais entregues', field: 'initial_instructions_sent', required: true },
      { id: 'support', label: 'Canal oficial de suporte informado', field: 'support_channel_informed', required: true },
    ]
  },
  {
    id: 'contrato',
    label: 'Contrato',
    description: 'Envio e negociação',
    color: 'from-indigo-500 to-indigo-600',
    statusColor: 'bg-indigo-500',
    blockingMessage: 'Envie o contrato e solicite assinatura',
    checklist: [
      { id: 'sent', label: 'Contrato enviado', field: 'contract_sent', required: true },
      { id: 'doubts', label: 'Dúvidas esclarecidas', field: 'contract_doubts_cleared', required: true },
      { id: 'signature', label: 'Cobrança de assinatura realizada', field: 'signature_requested', required: true },
    ]
  },
  {
    id: 'contrato_assinado',
    label: 'Contrato Assinado',
    description: 'Formalização completa',
    color: 'from-green-500 to-green-600',
    statusColor: 'bg-green-500',
    blockingMessage: 'Confirme pagamento e status jurídico',
    checklist: [
      { id: 'signed', label: 'Contrato assinado', field: 'contract_signed', required: true },
      { id: 'payment', label: 'Pagamento confirmado', field: 'payment_confirmed', required: true },
      { id: 'legal', label: 'Status jurídico validado', field: 'legal_status_validated', required: true },
    ]
  },
  {
    id: 'pre_operatorio',
    label: 'Pré-Operatório',
    description: 'Preparação para procedimento',
    color: 'from-violet-500 to-violet-600',
    statusColor: 'bg-violet-500',
    blockingMessage: 'Complete checklist pré-operatório',
    checklist: [
      { id: 'exams_req', label: 'Exames solicitados', field: 'exams_requested', required: true },
      { id: 'exams_ver', label: 'Exames conferidos', field: 'exams_verified', required: true },
      { id: 'pre_op', label: 'Orientações pré-operatórias enviadas', field: 'pre_op_instructions_sent', required: true },
    ]
  },
  {
    id: 'procedimento',
    label: 'Procedimento',
    description: 'Realização do transplante',
    color: 'from-rose-500 to-rose-600',
    statusColor: 'bg-rose-500',
    blockingMessage: 'Registre procedimento e alta',
    checklist: [
      { id: 'done', label: 'Procedimento realizado', field: 'procedure_done', required: true },
      { id: 'photo', label: 'Registro fotográfico feito', field: 'photo_record_done', required: true },
      { id: 'discharge', label: 'Orientações de alta entregues', field: 'discharge_instructions_given', required: true },
    ]
  },
  {
    id: 'pos_operatorio',
    label: 'Pós-Operatório',
    description: 'Acompanhamento pós-procedimento',
    color: 'from-teal-500 to-teal-600',
    statusColor: 'bg-teal-500',
    blockingMessage: 'Complete contatos de acompanhamento',
    checklist: [
      { id: 'same_day', label: 'Contato no mesmo dia', field: 'same_day_contact', required: true },
      { id: 'next_day', label: 'Contato no dia seguinte', field: 'next_day_contact', required: true },
      { id: 'issues', label: 'Dúvidas e intercorrências registradas', field: 'issues_registered', required: false },
    ]
  },
  {
    id: 'relacionamento',
    label: 'Relacionamento',
    description: 'Fidelização e indicações',
    color: 'from-pink-500 to-pink-600',
    statusColor: 'bg-pink-500',
    blockingMessage: 'Solicite avaliação e depoimento',
    checklist: [
      { id: 'evaluation', label: 'Avaliação solicitada', field: 'evaluation_requested', required: true },
      { id: 'testimonial', label: 'Depoimento convidado', field: 'testimonial_invited', required: false },
      { id: 'referral', label: 'Programa de indicação apresentado', field: 'referral_program_presented', required: false },
    ]
  }
];

// Dynamic checklists by service type
export const SERVICE_SPECIFIC_CHECKLISTS: Record<ServiceType, { stage: JourneyStage; items: ChecklistItem[] }[]> = {
  capilar: [
    {
      stage: 'pre_operatorio',
      items: [
        { id: 'scalp_exams', label: 'Exames específicos de couro cabeludo', field: 'exams_requested', required: true },
      ]
    },
    {
      stage: 'pos_operatorio',
      items: [
        { id: 'wash_meds', label: 'Orientações de lavagem e medicação capilar', field: 'same_day_contact', required: true },
      ]
    }
  ],
  barba: [
    {
      stage: 'pre_operatorio',
      items: [
        { id: 'donor_area', label: 'Orientações de área doadora alternativa', field: 'exams_requested', required: true },
      ]
    },
    {
      stage: 'pos_operatorio',
      items: [
        { id: 'face_care', label: 'Cuidados específicos com face', field: 'same_day_contact', required: true },
      ]
    }
  ],
  sobrancelha: [
    {
      stage: 'pre_operatorio',
      items: [
        { id: 'aesthetic', label: 'Orientações estéticas específicas', field: 'exams_requested', required: true },
      ]
    },
    {
      stage: 'pos_operatorio',
      items: [
        { id: 'symmetry', label: 'Cuidados de simetria e crescimento', field: 'same_day_contact', required: true },
      ]
    }
  ]
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  capilar: 'Transplante Capilar',
  barba: 'Transplante de Barba',
  sobrancelha: 'Transplante de Sobrancelha'
};

export const STAGE_LABELS: Record<JourneyStage, string> = {
  lead_entrada: 'Lead Entrada',
  triagem: 'Triagem',
  agendamento: 'Agendamento',
  follow_up: 'Follow Up',
  paciente: 'Paciente',
  onboarding: 'Onboarding',
  contrato: 'Contrato',
  contrato_assinado: 'Contrato Assinado',
  pre_operatorio: 'Pré-Operatório',
  procedimento: 'Procedimento',
  pos_operatorio: 'Pós-Operatório',
  relacionamento: 'Relacionamento'
};
