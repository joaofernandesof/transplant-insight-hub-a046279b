// ====================================
// Kommo Module - Types & Mock Data
// ====================================

export interface KommoKPI {
  label: string;
  value: string | number;
  change?: number; // percentage change
  changeLabel?: string;
  icon?: string;
}

export interface KommoPipeline {
  id: string;
  name: string;
  stages: KommoStage[];
  totalLeads: number;
  totalValue: number;
  conversionRate: number;
}

export interface KommoStage {
  id: string;
  name: string;
  leads: number;
  value: number;
  avgDays: number;
  color: string;
}

export interface KommoLead {
  id: string;
  name: string;
  pipeline: string;
  stage: string;
  responsible: string;
  source: string;
  value: number;
  createdAt: string;
  lastActivity: string;
  tags: string[];
  status: 'open' | 'won' | 'lost';
  lossReason?: string;
}

export interface KommoUser {
  id: string;
  name: string;
  role: string;
  team: string;
  leadsReceived: number;
  leadsConverted: number;
  leadsLost: number;
  conversionRate: number;
  avgResponseTime: number; // minutes
  avgCloseTime: number; // days
  revenue: number;
  tasksCompleted: number;
  tasksPending: number;
}

export interface KommoAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  metric?: string;
  value?: number;
}

export type KommoTab = 
  | 'overview' 
  | 'funnels' 
  | 'leads' 
  | 'conversion' 
  | 'performance' 
  | 'sources' 
  | 'losses' 
  | 'tasks' 
  | 'post-sales' 
  | 'time'
  | 'reports' 
  | 'settings';

// ====================================
// Mock Data
// ====================================

export const MOCK_PIPELINES: KommoPipeline[] = [
  {
    id: '1', name: 'Comercial Principal',
    stages: [
      { id: 's1', name: 'Novo Lead', leads: 142, value: 710000, avgDays: 0.5, color: '#3b82f6' },
      { id: 's2', name: 'Primeiro Contato', leads: 98, value: 490000, avgDays: 1.2, color: '#6366f1' },
      { id: 's3', name: 'Qualificação', leads: 67, value: 402000, avgDays: 2.8, color: '#8b5cf6' },
      { id: 's4', name: 'Proposta', leads: 34, value: 340000, avgDays: 4.1, color: '#a855f7' },
      { id: 's5', name: 'Negociação', leads: 21, value: 315000, avgDays: 3.5, color: '#d946ef' },
      { id: 's6', name: 'Fechamento', leads: 12, value: 180000, avgDays: 1.8, color: '#22c55e' },
    ],
    totalLeads: 374, totalValue: 2437000, conversionRate: 8.4,
  },
  {
    id: '2', name: 'Indicações',
    stages: [
      { id: 's7', name: 'Indicação Recebida', leads: 45, value: 225000, avgDays: 0.3, color: '#f59e0b' },
      { id: 's8', name: 'Contato Inicial', leads: 38, value: 190000, avgDays: 0.8, color: '#f97316' },
      { id: 's9', name: 'Agendamento', leads: 28, value: 168000, avgDays: 1.5, color: '#ef4444' },
      { id: 's10', name: 'Consulta', leads: 22, value: 154000, avgDays: 2.0, color: '#ec4899' },
      { id: 's11', name: 'Fechamento', leads: 16, value: 128000, avgDays: 1.2, color: '#22c55e' },
    ],
    totalLeads: 149, totalValue: 865000, conversionRate: 35.6,
  },
  {
    id: '3', name: 'Tráfego Pago',
    stages: [
      { id: 's12', name: 'Lead Captado', leads: 320, value: 960000, avgDays: 0.1, color: '#06b6d4' },
      { id: 's13', name: 'Respondeu', leads: 180, value: 540000, avgDays: 1.0, color: '#0ea5e9' },
      { id: 's14', name: 'Qualificado', leads: 85, value: 340000, avgDays: 2.5, color: '#2563eb' },
      { id: 's15', name: 'Agendou', leads: 42, value: 210000, avgDays: 3.2, color: '#4f46e5' },
      { id: 's16', name: 'Compareceu', leads: 30, value: 180000, avgDays: 1.0, color: '#7c3aed' },
      { id: 's17', name: 'Fechou', leads: 15, value: 112500, avgDays: 2.0, color: '#22c55e' },
    ],
    totalLeads: 672, totalValue: 2342500, conversionRate: 4.7,
  },
  {
    id: '4', name: 'Pós-Venda - Retenção',
    stages: [
      { id: 's18', name: 'Onboarding', leads: 28, value: 420000, avgDays: 7, color: '#10b981' },
      { id: 's19', name: 'Acompanhamento', leads: 45, value: 675000, avgDays: 30, color: '#14b8a6' },
      { id: 's20', name: 'Reativação', leads: 12, value: 96000, avgDays: 15, color: '#f59e0b' },
      { id: 's21', name: 'Risco de Churn', leads: 8, value: 64000, avgDays: 5, color: '#ef4444' },
    ],
    totalLeads: 93, totalValue: 1255000, conversionRate: 78.5,
  },
];

export const MOCK_USERS: KommoUser[] = [
  { id: '1', name: 'Ana Silva', role: 'Closer', team: 'Vendas A', leadsReceived: 85, leadsConverted: 18, leadsLost: 22, conversionRate: 21.2, avgResponseTime: 12, avgCloseTime: 8.5, revenue: 270000, tasksCompleted: 142, tasksPending: 8 },
  { id: '2', name: 'Carlos Mendes', role: 'SDR', team: 'Vendas A', leadsReceived: 210, leadsConverted: 0, leadsLost: 45, conversionRate: 0, avgResponseTime: 5, avgCloseTime: 0, revenue: 0, tasksCompleted: 312, tasksPending: 15 },
  { id: '3', name: 'Beatriz Rocha', role: 'Closer', team: 'Vendas B', leadsReceived: 72, leadsConverted: 22, leadsLost: 18, conversionRate: 30.6, avgResponseTime: 8, avgCloseTime: 6.2, revenue: 385000, tasksCompleted: 128, tasksPending: 5 },
  { id: '4', name: 'Diego Ferreira', role: 'SDR', team: 'Vendas B', leadsReceived: 195, leadsConverted: 0, leadsLost: 38, conversionRate: 0, avgResponseTime: 7, avgCloseTime: 0, revenue: 0, tasksCompleted: 285, tasksPending: 22 },
  { id: '5', name: 'Fernanda Lima', role: 'Pós-Venda', team: 'Sucesso', leadsReceived: 93, leadsConverted: 73, leadsLost: 8, conversionRate: 78.5, avgResponseTime: 15, avgCloseTime: 12, revenue: 0, tasksCompleted: 198, tasksPending: 11 },
  { id: '6', name: 'Gustavo Almeida', role: 'Closer', team: 'Vendas A', leadsReceived: 68, leadsConverted: 12, leadsLost: 25, conversionRate: 17.6, avgResponseTime: 18, avgCloseTime: 11.3, revenue: 192000, tasksCompleted: 95, tasksPending: 18 },
];

export const MOCK_ALERTS: KommoAlert[] = [
  { id: '1', type: 'danger', title: '23 leads sem atividade há mais de 7 dias', description: 'Leads parados no funil Comercial Principal, etapas Qualificação e Proposta.' },
  { id: '2', type: 'danger', title: 'Aumento de 34% nas perdas esta semana', description: 'Funil Tráfego Pago com taxa de perda acima da média na etapa Qualificado.' },
  { id: '3', type: 'warning', title: '15 tarefas vencidas', description: 'Gustavo Almeida e Diego Ferreira com mais tarefas atrasadas.' },
  { id: '4', type: 'warning', title: 'Etapa "Proposta" com acúmulo anormal', description: '34 leads com tempo médio de 4.1 dias — 65% acima do SLA.' },
  { id: '5', type: 'info', title: 'Indicações com melhor conversão do mês', description: 'Taxa de 35.6% — 4x superior ao Tráfego Pago.' },
  { id: '6', type: 'warning', title: '8 leads sem responsável atribuído', description: 'Leads do Tráfego Pago nas etapas iniciais sem atribuição.' },
];

export const MOCK_SOURCES = [
  { name: 'Instagram Ads', leads: 180, converted: 12, revenue: 96000, conversionRate: 6.7 },
  { name: 'Google Ads', leads: 140, converted: 8, revenue: 72000, conversionRate: 5.7 },
  { name: 'Indicação', leads: 149, converted: 53, revenue: 477000, conversionRate: 35.6 },
  { name: 'WhatsApp Orgânico', leads: 95, converted: 15, revenue: 127500, conversionRate: 15.8 },
  { name: 'Site / Landing Page', leads: 120, converted: 9, revenue: 67500, conversionRate: 7.5 },
  { name: 'Facebook Ads', leads: 85, converted: 4, revenue: 28000, conversionRate: 4.7 },
  { name: 'Evento Presencial', leads: 32, converted: 8, revenue: 80000, conversionRate: 25.0 },
  { name: 'YouTube', leads: 45, converted: 3, revenue: 22500, conversionRate: 6.7 },
];

export const MOCK_LOSS_REASONS = [
  { reason: 'Preço alto', count: 45, percentage: 28.1 },
  { reason: 'Não respondeu', count: 38, percentage: 23.8 },
  { reason: 'Escolheu concorrente', count: 22, percentage: 13.8 },
  { reason: 'Sem urgência', count: 19, percentage: 11.9 },
  { reason: 'Sem condições financeiras', count: 15, percentage: 9.4 },
  { reason: 'Desistiu do procedimento', count: 12, percentage: 7.5 },
  { reason: 'Fora da área de atendimento', count: 5, percentage: 3.1 },
  { reason: 'Outro', count: 4, percentage: 2.5 },
];
