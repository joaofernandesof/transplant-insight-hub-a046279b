// Permissões do módulo Pós-Venda
export const POSTVENDA_PERMISSIONS = {
  admin: {
    canViewAll: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canConfigSla: true,
    canEscalar: true,
    canReabrir: true,
    canVerNps: true,
  },
  triagem: {
    canViewAll: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canConfigSla: false,
    canEscalar: false,
    canReabrir: true,
    canVerNps: true,
  },
  atendimento: {
    canViewAll: false, // só vê os atribuídos
    canCreate: false,
    canEdit: true,
    canDelete: false,
    canConfigSla: false,
    canEscalar: false,
    canReabrir: false,
    canVerNps: false,
  },
  paciente: {
    canViewAll: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canConfigSla: false,
    canEscalar: false,
    canReabrir: false,
    canVerNps: false,
    canResponderValidacao: true,
    canResponderNps: true,
  },
} as const;

export type PostVendaRole = keyof typeof POSTVENDA_PERMISSIONS;

export const POSTVENDA_MODULES = [
  { code: 'postvenda_dashboard', name: 'Dashboard Pós-Venda', route: '/postvenda', icon: 'LayoutDashboard' },
  { code: 'postvenda_chamados', name: 'Chamados', route: '/postvenda/chamados', icon: 'Ticket' },
  { code: 'postvenda_sla', name: 'Configuração SLA', route: '/postvenda/sla', icon: 'Clock' },
  { code: 'postvenda_nps', name: 'Relatórios NPS', route: '/postvenda/nps', icon: 'Star' },
];

export const ETAPA_LABELS: Record<string, string> = {
  triagem: 'Triagem',
  atendimento: 'Atendimento',
  resolucao: 'Resolução',
  validacao_paciente: 'Validação do Paciente',
  nps: 'NPS',
  encerrado: 'Encerrado',
};

export const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em Andamento',
  aguardando_paciente: 'Aguardando Paciente',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
  reaberto: 'Reaberto',
  cancelado: 'Cancelado',
};

export const PRIORIDADE_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const TIPO_DEMANDA_OPTIONS = [
  { value: 'distrato', label: 'Distrato' },
  { value: 'duvida_pre_operatorio', label: 'Dúvida Pré-Operatório' },
  { value: 'duvida_pos_operatorio', label: 'Dúvida Pós-Operatório' },
  { value: 'reclamacao_atendimento', label: 'Reclamação - Atendimento' },
  { value: 'reclamacao_resultado', label: 'Reclamação - Resultado' },
  { value: 'reagendamento', label: 'Reagendamento' },
  { value: 'cancelamento', label: 'Cancelamento' },
  { value: 'retorno_medico', label: 'Retorno Médico' },
  { value: 'urgencia_medica', label: 'Urgência Médica' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'documentos', label: 'Documentos e Laudos' },
];

export const CANAL_ORIGEM_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'portal', label: 'Portal do Paciente' },
];

export const BRANCH_OPTIONS = [
  { value: 'fortaleza', label: 'Fortaleza' },
  { value: 'sao_paulo', label: 'São Paulo' },
  { value: 'belo_horizonte', label: 'Belo Horizonte' },
  { value: 'rio_de_janeiro', label: 'Rio de Janeiro' },
  { value: 'brasilia', label: 'Brasília' },
  { value: 'curitiba', label: 'Curitiba' },
  { value: 'recife', label: 'Recife' },
  { value: 'salvador', label: 'Salvador' },
];
