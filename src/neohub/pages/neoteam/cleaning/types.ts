// ============================================
// TIPOS DO MÓDULO DE LIMPEZA
// ============================================

export type SanitaryRiskLevel = 'critico' | 'semicritico' | 'nao_critico';

export type CleaningExecutionStatus = 
  | 'pendente'
  | 'em_execucao'
  | 'finalizado_limpeza'
  | 'aguardando_fiscalizacao'
  | 'reprovado'
  | 'corrigido'
  | 'aprovado';

export type CleaningItemCategory = 'limpeza_geral' | 'desinfeccao' | 'organizacao';

export type SupplyCategory = 'desinfetante' | 'detergente' | 'pano' | 'epi' | 'outros';

export type MovementType = 'entrada' | 'saida' | 'ajuste';

// ============================================
// AMBIENTE
// ============================================

export interface CleaningEnvironment {
  id: string;
  tenant_id: string | null;
  branch_id: string | null;
  name: string;
  description: string | null;
  environment_type: string | null;
  sanitary_risk_level: SanitaryRiskLevel;
  priority_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CleaningEnvironmentWithChecklist extends CleaningEnvironment {
  active_checklist?: CleaningChecklist | null;
  items_count?: number;
}

// ============================================
// CHECKLIST
// ============================================

export interface CleaningChecklist {
  id: string;
  environment_id: string;
  version: number;
  version_notes: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  items?: CleaningChecklistItem[];
}

export interface CleaningChecklistItem {
  id: string;
  checklist_id: string;
  description: string;
  category: CleaningItemCategory;
  order_index: number;
  is_critical: boolean;
  created_at: string;
}

// ============================================
// ROTINA DIÁRIA
// ============================================

export interface CleaningDailyRoutine {
  id: string;
  tenant_id: string | null;
  branch_id: string | null;
  routine_date: string;
  status: 'em_andamento' | 'finalizada';
  total_environments: number;
  completed_environments: number;
  created_at: string;
  updated_at: string;
}

export interface CleaningDailyRoutineWithExecutions extends CleaningDailyRoutine {
  executions?: CleaningEnvironmentExecutionWithDetails[];
}

// ============================================
// EXECUÇÃO DE AMBIENTE
// ============================================

export interface CleaningEnvironmentExecution {
  id: string;
  routine_id: string;
  environment_id: string;
  checklist_id: string | null;
  status: CleaningExecutionStatus;
  started_at: string | null;
  finished_at: string | null;
  executed_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  rejection_notes: string | null;
  correction_count: number;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CleaningEnvironmentExecutionWithDetails extends CleaningEnvironmentExecution {
  environment?: CleaningEnvironment;
  checklist?: CleaningChecklist;
  items?: CleaningExecutionItem[];
  executor_name?: string;
  approver_name?: string;
}

// ============================================
// ITENS DA EXECUÇÃO
// ============================================

export interface CleaningExecutionItem {
  id: string;
  execution_id: string;
  checklist_item_id: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  is_rejected: boolean;
  rejection_note: string | null;
  created_at: string;
  checklist_item?: CleaningChecklistItem;
}

// ============================================
// ESTOQUE DE INSUMOS
// ============================================

export interface CleaningSupply {
  id: string;
  tenant_id: string | null;
  branch_id: string | null;
  name: string;
  category: SupplyCategory;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_unit: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CleaningSupplyMovement {
  id: string;
  supply_id: string;
  movement_type: MovementType;
  quantity: number;
  execution_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  supply?: CleaningSupply;
}

// ============================================
// AUDITORIA
// ============================================

export interface CleaningAuditLog {
  id: string;
  tenant_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
  creator_name?: string;
}

// ============================================
// ESTATÍSTICAS
// ============================================

export interface CleaningRoutineStats {
  total: number;
  pendente: number;
  em_execucao: number;
  finalizado_limpeza: number;
  aguardando_fiscalizacao: number;
  reprovado: number;
  corrigido: number;
  aprovado: number;
  percentComplete: number;
}

// ============================================
// FORMULÁRIOS
// ============================================

export interface CreateEnvironmentForm {
  name: string;
  description?: string;
  environment_type?: string;
  sanitary_risk_level: SanitaryRiskLevel;
  priority_order: number;
  branch_id: string;
}

export interface CreateChecklistItemForm {
  description: string;
  category: CleaningItemCategory;
  is_critical: boolean;
}

export interface RejectionForm {
  rejected_items: string[];
  rejection_notes: string;
}

// ============================================
// CONSTANTES
// ============================================

export const RISK_LEVEL_LABELS: Record<SanitaryRiskLevel, string> = {
  critico: 'Crítico',
  semicritico: 'Semicrítico',
  nao_critico: 'Não Crítico',
};

export const RISK_LEVEL_COLORS: Record<SanitaryRiskLevel, string> = {
  critico: 'bg-red-500',
  semicritico: 'bg-yellow-500',
  nao_critico: 'bg-green-500',
};

export const RISK_LEVEL_BADGES: Record<SanitaryRiskLevel, { variant: 'destructive' | 'secondary' | 'default'; label: string }> = {
  critico: { variant: 'destructive', label: 'Crítico' },
  semicritico: { variant: 'secondary', label: 'Semicrítico' },
  nao_critico: { variant: 'default', label: 'Não Crítico' },
};

export const STATUS_LABELS: Record<CleaningExecutionStatus, string> = {
  pendente: 'Pendente',
  em_execucao: 'Em Execução',
  finalizado_limpeza: 'Finalizado',
  aguardando_fiscalizacao: 'Aguardando Fiscalização',
  reprovado: 'Reprovado',
  corrigido: 'Corrigido',
  aprovado: 'Aprovado',
};

export const STATUS_COLORS: Record<CleaningExecutionStatus, string> = {
  pendente: 'bg-gray-500',
  em_execucao: 'bg-blue-500',
  finalizado_limpeza: 'bg-cyan-500',
  aguardando_fiscalizacao: 'bg-yellow-500',
  reprovado: 'bg-red-500',
  corrigido: 'bg-orange-500',
  aprovado: 'bg-green-500',
};

export const ITEM_CATEGORY_LABELS: Record<CleaningItemCategory, string> = {
  limpeza_geral: 'Limpeza Geral',
  desinfeccao: 'Desinfecção',
  organizacao: 'Organização',
};

export const SUPPLY_CATEGORY_LABELS: Record<SupplyCategory, string> = {
  desinfetante: 'Desinfetante',
  detergente: 'Detergente',
  pano: 'Pano/Tecido',
  epi: 'EPI',
  outros: 'Outros',
};
