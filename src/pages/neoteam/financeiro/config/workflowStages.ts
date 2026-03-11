/**
 * Workflow stages for Contas a Pagar BPMN
 * Supports both urgent and non-urgent payment flows
 */

export interface WorkflowStage {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  responsible: string;
  color: string;
  gradient: string;
  order: number;
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: 'solicitacao_pendente',
    label: 'Solicitação Pendente',
    shortLabel: 'Solicitação',
    description: 'Formulário preenchido, aguardando validação',
    responsible: 'Solicitante',
    color: 'bg-slate-500',
    gradient: 'from-slate-500 to-slate-600',
    order: 1,
  },
  {
    id: 'validacao_financeira',
    label: 'Validação Financeira',
    shortLabel: 'Validação',
    description: 'Financeiro analisando dados e documentos',
    responsible: 'Financeiro',
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    order: 2,
  },
  {
    id: 'pendencia',
    label: 'Pendência / Correção',
    shortLabel: 'Pendência',
    description: 'Retornado ao solicitante para correção',
    responsible: 'Solicitante',
    color: 'bg-amber-500',
    gradient: 'from-amber-500 to-amber-600',
    order: 3,
  },
  {
    id: 'aprovacao_gestor',
    label: 'Aprovação Gestor / Diretoria',
    shortLabel: 'Aprovação',
    description: 'Aguardando aprovação do gestor ou diretoria',
    responsible: 'Gestor / Diretoria',
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    order: 4,
  },
  {
    id: 'negado',
    label: 'Negado',
    shortLabel: 'Negado',
    description: 'Pagamento negado pela diretoria',
    responsible: 'Gestor / Diretoria',
    color: 'bg-rose-500',
    gradient: 'from-rose-500 to-rose-600',
    order: 5,
  },
  {
    id: 'agendamento_bancario',
    label: 'Agendamento Bancário',
    shortLabel: 'Agendamento',
    description: 'Financeiro inserindo pagamento no banco',
    responsible: 'Financeiro',
    color: 'bg-indigo-500',
    gradient: 'from-indigo-500 to-indigo-600',
    order: 6,
  },
  {
    id: 'aprovacao_bancaria',
    label: 'Aprovação Bancária',
    shortLabel: 'Aprov. Banco',
    description: 'Diretoria aprovando pagamento no banco',
    responsible: 'Diretoria',
    color: 'bg-teal-500',
    gradient: 'from-teal-500 to-teal-600',
    order: 7,
  },
  {
    id: 'pago',
    label: 'Pagamento Executado',
    shortLabel: 'Pago',
    description: 'Pagamento realizado com sucesso',
    responsible: 'Sistema',
    color: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
    order: 8,
  },
];

export const STAGE_MAP = Object.fromEntries(
  WORKFLOW_STAGES.map(s => [s.id, s])
);

export const ACTIVE_KANBAN_STAGES = WORKFLOW_STAGES.filter(
  s => !['negado', 'pago'].includes(s.id)
);

export const getNextStages = (currentStage: string, isUrgent: boolean): string[] => {
  switch (currentStage) {
    case 'solicitacao_pendente':
      return ['validacao_financeira'];
    case 'validacao_financeira':
      return isUrgent 
        ? ['aprovacao_gestor', 'pendencia'] 
        : ['aprovacao_gestor', 'pendencia'];
    case 'pendencia':
      return ['validacao_financeira'];
    case 'aprovacao_gestor':
      return ['agendamento_bancario', 'negado'];
    case 'agendamento_bancario':
      return ['aprovacao_bancaria'];
    case 'aprovacao_bancaria':
      return ['pago'];
    default:
      return [];
  }
};
