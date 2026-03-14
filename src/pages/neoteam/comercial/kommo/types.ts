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
