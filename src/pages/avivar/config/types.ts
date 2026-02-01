/**
 * Tipos para o Sistema de Configuração de Agente de IA
 */

// Grande Nicho
export type NichoType = 
  | 'saude' 
  | 'estetica' 
  | 'vendas' 
  | 'imobiliario' 
  | 'alimentacao' 
  | 'servicos'
  | 'outros';

// Subnichos por categoria
export type SubnichoSaude = 
  | 'clinica_medica' 
  | 'hospital' 
  | 'dentista' 
  | 'fisioterapia' 
  | 'psicologia' 
  | 'nutricao'
  | 'laboratorio'
  | 'farmacia';

export type SubnichoEstetica = 
  | 'transplante_capilar' 
  | 'clinica_estetica' 
  | 'salao_beleza' 
  | 'barbearia'
  | 'spa'
  | 'micropigmentacao'
  | 'depilacao';

export type SubnichoVendas = 
  | 'produtos_hospitalares' 
  | 'celulares_eletronicos' 
  | 'roupas_moda' 
  | 'joias_acessorios'
  | 'cosmeticos'
  | 'suplementos'
  | 'moveis_decoracao';

export type SubnichoImobiliario = 
  | 'agente_imobiliario' 
  | 'construtora' 
  | 'imobiliaria'
  | 'administradora';

export type SubnichoAlimentacao = 
  | 'restaurante' 
  | 'delivery' 
  | 'lanchonete'
  | 'pizzaria'
  | 'cafeteria'
  | 'confeitaria'
  | 'food_truck';

export type SubnichoServicos = 
  | 'advocacia' 
  | 'contabilidade' 
  | 'consultoria'
  | 'academia_personal'
  | 'oficina_mecanica'
  | 'pet_shop_veterinario'
  | 'limpeza_manutencao'
  | 'marketing_agencia'
  | 'cursos_educacao'
  | 'eventos'
  | 'fotografia'
  | 'tecnologia_ti';

export type SubnichoOutros = 'personalizado';

export type SubnichoType = 
  | SubnichoSaude 
  | SubnichoEstetica 
  | SubnichoVendas 
  | SubnichoImobiliario 
  | SubnichoAlimentacao 
  | SubnichoServicos
  | SubnichoOutros;

// Legado - manter compatibilidade
export type TemplateType = SubnichoType;

// Fluxo de Atendimento
export interface FluxoStep {
  id: string;
  ordem: number;
  titulo: string;
  descricao: string;
  exemploMensagem?: string; // Exemplo opcional de mensagem para referência de tom
}

export interface FluxoAtendimento {
  passosCronologicos: FluxoStep[];
  passosExtras: FluxoStep[];
}

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
  domicilio: boolean;
}

// Unidade/Filial do negócio
export interface BusinessUnit {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone?: string;
}

export interface SubnichoOption {
  id: SubnichoType;
  name: string;
  description: string;
  icon?: string;
}

export interface NichoCategory {
  id: NichoType;
  name: string;
  description: string;
  icon: string;
  color: string;
  subnichos: SubnichoOption[];
}

export interface AgentConfig {
  // Nicho e Subnicho
  nicho: NichoType | null;
  subnicho: SubnichoType | null;
  
  // Template (legado - mantido para compatibilidade)
  template: TemplateType | null;
  
  // API Key
  openaiApiKey: string;
  openaiApiKeyValid: boolean;
  
  // Profissional
  professionalName: string;
  crm: string;
  instagram: string;
  
  // Clínica/Empresa
  companyName: string;
  address: string;
  city: string;
  state: string;
  
  // Múltiplas Unidades/Filiais
  businessUnits: BusinessUnit[];
  
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
  
  // Identidade e Objetivo da IA
  aiIdentity: string;
  aiObjective: string;
  toneOfVoice: TomVoz;
  consultationDuration: number;
  
  // Instruções e Restrições da IA
  aiInstructions: string;
  aiRestrictions: string;
  
  // Fluxo de Atendimento
  fluxoAtendimento: FluxoAtendimento;
  
  // Base de Conhecimento
  knowledgeFiles: KnowledgeFile[];
  
  // Mensagens (legado - mantido para compatibilidade)
  welcomeMessage: string;
  transferMessage: string;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  isComplete: boolean;
}

// Arquivo de Base de Conhecimento
export interface KnowledgeFile {
  id?: string;
  name: string;
  size: number;
  content: string;
  type: string;
}

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// ============= NICHOS E SUBNICHOS =============

export const NICHOS_CATEGORIES: NichoCategory[] = [
  {
    id: 'saude',
    name: 'Saúde',
    description: 'Clínicas, hospitais e serviços médicos',
    icon: 'Stethoscope',
    color: 'from-red-500 to-rose-600',
    subnichos: [
      { id: 'clinica_medica', name: 'Clínica Médica', description: 'Consultórios e clínicas de especialidades' },
      { id: 'hospital', name: 'Hospital', description: 'Hospitais e prontos-socorros' },
      { id: 'dentista', name: 'Dentista', description: 'Consultórios odontológicos' },
      { id: 'fisioterapia', name: 'Fisioterapia', description: 'Clínicas de fisioterapia e reabilitação' },
      { id: 'psicologia', name: 'Psicologia', description: 'Psicólogos e terapeutas' },
      { id: 'nutricao', name: 'Nutrição', description: 'Nutricionistas e dietistas' },
      { id: 'laboratorio', name: 'Laboratório', description: 'Laboratórios de análises clínicas' },
      { id: 'farmacia', name: 'Farmácia', description: 'Farmácias e drogarias' },
    ]
  },
  {
    id: 'estetica',
    name: 'Estética',
    description: 'Clínicas de beleza e cuidados pessoais',
    icon: 'Sparkles',
    color: 'from-pink-500 to-purple-600',
    subnichos: [
      { id: 'transplante_capilar', name: 'Transplante Capilar', description: 'Clínicas especializadas em transplante capilar, barba e sobrancelha' },
      { id: 'clinica_estetica', name: 'Clínica de Estética', description: 'Tratamentos estéticos faciais e corporais' },
      { id: 'salao_beleza', name: 'Salão de Beleza', description: 'Salões de cabeleireiro e beleza' },
      { id: 'barbearia', name: 'Barbearia', description: 'Barbearias e cuidados masculinos' },
      { id: 'spa', name: 'Spa', description: 'Spas e centros de bem-estar' },
      { id: 'micropigmentacao', name: 'Micropigmentação', description: 'Micropigmentação e design de sobrancelhas' },
      { id: 'depilacao', name: 'Depilação', description: 'Clínicas de depilação a laser' },
    ]
  },
  {
    id: 'vendas',
    name: 'Venda de Produtos',
    description: 'Lojas e e-commerce',
    icon: 'ShoppingBag',
    color: 'from-blue-500 to-cyan-600',
    subnichos: [
      { id: 'produtos_hospitalares', name: 'Produtos Hospitalares', description: 'Equipamentos e insumos médicos' },
      { id: 'celulares_eletronicos', name: 'Celulares e Eletrônicos', description: 'Smartphones, acessórios e eletrônicos' },
      { id: 'roupas_moda', name: 'Roupas e Moda', description: 'Vestuário e acessórios de moda' },
      { id: 'joias_acessorios', name: 'Joias e Acessórios', description: 'Joalherias e bijuterias' },
      { id: 'cosmeticos', name: 'Cosméticos', description: 'Produtos de beleza e skincare' },
      { id: 'suplementos', name: 'Suplementos', description: 'Suplementos alimentares e fitness' },
      { id: 'moveis_decoracao', name: 'Móveis e Decoração', description: 'Móveis e itens para casa' },
    ]
  },
  {
    id: 'imobiliario',
    name: 'Imobiliário',
    description: 'Imóveis e corretagem',
    icon: 'Building2',
    color: 'from-emerald-500 to-teal-600',
    subnichos: [
      { id: 'agente_imobiliario', name: 'Agente Imobiliário', description: 'Corretor de imóveis completo - venda, locação e avaliação' },
      { id: 'imobiliaria', name: 'Imobiliária', description: 'Imobiliária com múltiplos corretores' },
      { id: 'construtora', name: 'Construtora', description: 'Construtoras e incorporadoras' },
      { id: 'administradora', name: 'Administradora', description: 'Administração de condomínios' },
    ]
  },
  {
    id: 'alimentacao',
    name: 'Alimentação',
    description: 'Restaurantes e delivery',
    icon: 'UtensilsCrossed',
    color: 'from-orange-500 to-amber-600',
    subnichos: [
      { id: 'restaurante', name: 'Restaurante', description: 'Restaurantes e bistrôs' },
      { id: 'delivery', name: 'Delivery', description: 'Serviços de entrega de comida' },
      { id: 'lanchonete', name: 'Lanchonete', description: 'Lanchonetes e fast food' },
      { id: 'pizzaria', name: 'Pizzaria', description: 'Pizzarias e rodízios' },
      { id: 'cafeteria', name: 'Cafeteria', description: 'Cafeterias e coffee shops' },
      { id: 'confeitaria', name: 'Confeitaria', description: 'Confeitarias e docerias' },
      { id: 'food_truck', name: 'Food Truck', description: 'Food trucks e eventos' },
    ]
  },
  {
    id: 'servicos',
    name: 'Serviços',
    description: 'Prestação de serviços diversos',
    icon: 'Briefcase',
    color: 'from-violet-500 to-indigo-600',
    subnichos: [
      { id: 'advocacia', name: 'Advocacia', description: 'Escritórios de advocacia e advogados' },
      { id: 'contabilidade', name: 'Contabilidade', description: 'Escritórios contábeis' },
      { id: 'consultoria', name: 'Consultoria', description: 'Consultorias empresariais' },
      { id: 'academia_personal', name: 'Academia / Personal', description: 'Academias e personal trainers' },
      { id: 'oficina_mecanica', name: 'Oficina Mecânica', description: 'Oficinas e auto centers' },
      { id: 'pet_shop_veterinario', name: 'Pet Shop / Veterinário', description: 'Pet shops, clínicas veterinárias e banho e tosa' },
      { id: 'limpeza_manutencao', name: 'Limpeza e Manutenção', description: 'Serviços de limpeza e reparos' },
      { id: 'marketing_agencia', name: 'Marketing / Agência', description: 'Agências de marketing e publicidade' },
      { id: 'cursos_educacao', name: 'Cursos / Educação', description: 'Escolas, cursos e treinamentos' },
      { id: 'eventos', name: 'Eventos', description: 'Organização de eventos e festas' },
      { id: 'fotografia', name: 'Fotografia', description: 'Fotógrafos e estúdios' },
      { id: 'tecnologia_ti', name: 'Tecnologia / TI', description: 'Empresas de tecnologia e suporte' },
    ]
  },
  {
    id: 'outros',
    name: 'Outros',
    description: 'Segmentos personalizados',
    icon: 'MoreHorizontal',
    color: 'from-gray-500 to-slate-600',
    subnichos: [
      { id: 'personalizado', name: 'Personalizado', description: 'Configure um nicho personalizado para seu negócio' },
    ]
  }
];

// ============= SERVIÇOS POR SUBNICHO =============

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
  nicho: null,
  subnicho: null,
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
  businessUnits: [],
  attendantName: '',
  services: [...TRANSPLANTE_SERVICES],
  paymentMethods: [...PAYMENT_METHODS],
  consultationType: { presencial: true, online: false, domicilio: false },
  beforeAfterImages: [],
  schedule: DEFAULT_WEEK_SCHEDULE,
  aiIdentity: '',
  aiObjective: '',
  toneOfVoice: 'cordial',
  consultationDuration: 60,
  aiInstructions: '',
  aiRestrictions: '',
  fluxoAtendimento: { passosCronologicos: [], passosExtras: [] },
  knowledgeFiles: [],
  welcomeMessage: '',
  transferMessage: '',
  createdAt: '',
  updatedAt: '',
  currentStep: 0,
  isComplete: false
};

export const WIZARD_STEPS = [
  { id: 'welcome', title: 'Bem-vindo', description: 'Introdução ao configurador' },
  { id: 'template', title: 'Nicho', description: 'Selecione seu segmento' },
  { id: 'apikey', title: 'API Key', description: 'Configure a OpenAI' },
  { id: 'professional', title: 'Profissional', description: 'Dados do profissional' },
  { id: 'clinic', title: 'Empresa', description: 'Informações da empresa' },
  { id: 'attendant', title: 'Atendente', description: 'Nome do assistente virtual' },
  { id: 'services', title: 'Serviços', description: 'Serviços oferecidos' },
  { id: 'consultation', title: 'Atendimento', description: 'Tipos de atendimento' },
  { id: 'payment', title: 'Pagamento', description: 'Formas de pagamento' },
  { id: 'images', title: 'Imagens', description: 'Fotos e portfólio' },
  { id: 'schedule', title: 'Horários', description: 'Horários de atendimento' },
  { id: 'personalization', title: 'Personalidade', description: 'Identidade e objetivo da IA' },
  { id: 'instructions', title: 'Instruções', description: 'O que a IA pode e não pode fazer' },
  { id: 'fluxo', title: 'Fluxo', description: 'Passos do atendimento' },
  { id: 'knowledge', title: 'Conhecimento', description: 'Base de conhecimento da IA' },
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
