/**
 * Tipos para o Sistema de Configuração de Agente de IA
 */

export type TemplateType = 'transplante_capilar' | 'imobiliaria' | 'estetica';
export type TomVoz = 'formal' | 'cordial' | 'casual';

export interface TimeInterval {
  start: string; // "08:00"
  end: string;   // "12:00"
}

export interface DaySchedule {
  enabled: boolean;
  intervals: TimeInterval[];
}

export interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface ConsultationType {
  presencial: boolean;
  online: boolean;
}

export interface AgentConfig {
  // Template
  template: TemplateType | null;
  
  // API Key
  openaiApiKey: string;
  openaiApiKeyValid: boolean;
  
  // Profissional
  professionalName: string;
  crm: string;
  instagram: string;
  
  // Clínica
  companyName: string;
  address: string;
  city: string;
  state: string;
  
  // Atendente
  attendantName: string;
  
  // Serviços e Pagamentos
  services: Service[];
  paymentMethods: PaymentMethod[];
  consultationType: ConsultationType;
  
  // Imagens
  beforeAfterImages: string[];
  
  // Horários
  schedule: WeekSchedule;
  
  // Google Calendar
  calendarEmail: string;
  calendarConnected: boolean;
  
  // Personalização
  welcomeMessage: string;
  transferMessage: string;
  toneOfVoice: TomVoz;
  consultationDuration: number;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  isComplete: boolean;
}

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const TRANSPLANTE_SERVICES: Service[] = [
  { 
    id: 'cabelo', 
    name: 'Transplante Capilar (Cabelo)', 
    description: 'Técnicas: FUE, FUT, DHI | Resultado natural e permanente',
    enabled: false 
  },
  { 
    id: 'barba', 
    name: 'Transplante de Barba', 
    description: 'Preenche falhas e aumenta densidade',
    enabled: false 
  },
  { 
    id: 'sobrancelha', 
    name: 'Transplante de Sobrancelha', 
    description: 'Correção de falhas e redesenho',
    enabled: false 
  },
  { 
    id: 'tratamento', 
    name: 'Tratamento Capilar sem Transplante', 
    description: 'PRP, Laser, Microagulhamento',
    enabled: false 
  }
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pix', name: 'PIX', description: 'Instantâneo', enabled: false },
  { id: 'credito', name: 'Cartão de Crédito', description: 'Parcelamento', enabled: false },
  { id: 'boleto', name: 'Boleto', description: 'Até 3 dias', enabled: false },
  { id: 'credito_parcelado', name: 'Crédito', description: 'Em até 12x', enabled: false },
  { id: 'recorrente', name: 'Recorrente', description: 'Mensalidades', enabled: false },
  { id: 'convenio', name: 'Convênio', description: 'Consulte convênios', enabled: false },
  { id: 'financiamento', name: 'Financiamento Bancário', description: 'Parcerias com instituições', enabled: false }
];

export const DEFAULT_WEEK_SCHEDULE: WeekSchedule = {
  monday: { enabled: true, intervals: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  tuesday: { enabled: true, intervals: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  wednesday: { enabled: true, intervals: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  thursday: { enabled: true, intervals: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  friday: { enabled: true, intervals: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
  saturday: { enabled: false, intervals: [] },
  sunday: { enabled: false, intervals: [] }
};

export const INITIAL_CONFIG: AgentConfig = {
  template: null,
  openaiApiKey: '',
  openaiApiKeyValid: false,
  professionalName: '',
  crm: '',
  instagram: '',
  companyName: '',
  address: '',
  city: '',
  state: '',
  attendantName: '',
  services: [...TRANSPLANTE_SERVICES],
  paymentMethods: [...PAYMENT_METHODS],
  consultationType: { presencial: true, online: false },
  beforeAfterImages: [],
  schedule: DEFAULT_WEEK_SCHEDULE,
  calendarEmail: '',
  calendarConnected: false,
  welcomeMessage: '',
  transferMessage: '',
  toneOfVoice: 'cordial',
  consultationDuration: 60,
  createdAt: '',
  updatedAt: '',
  currentStep: 0,
  isComplete: false
};

export const WIZARD_STEPS = [
  { id: 'welcome', title: 'Bem-vindo', description: 'Introdução ao configurador' },
  { id: 'template', title: 'Nicho', description: 'Selecione seu segmento' },
  { id: 'apikey', title: 'API Key', description: 'Configure a OpenAI' },
  { id: 'professional', title: 'Profissional', description: 'Dados do médico' },
  { id: 'clinic', title: 'Clínica', description: 'Informações da clínica' },
  { id: 'attendant', title: 'Atendente', description: 'Nome do assistente virtual' },
  { id: 'services', title: 'Serviços', description: 'Procedimentos oferecidos' },
  { id: 'consultation', title: 'Consultas', description: 'Tipos de atendimento' },
  { id: 'payment', title: 'Pagamento', description: 'Formas de pagamento' },
  { id: 'images', title: 'Imagens', description: 'Fotos antes/depois' },
  { id: 'schedule', title: 'Horários', description: 'Horários de atendimento' },
  { id: 'calendar', title: 'Calendário', description: 'Google Calendar' },
  { id: 'personalization', title: 'Mensagens', description: 'Personalize mensagens' },
  { id: 'review', title: 'Revisão', description: 'Confirme as configurações' }
];

export const DAY_NAMES: Record<keyof WeekSchedule, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo'
};
