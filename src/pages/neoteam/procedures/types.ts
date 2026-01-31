/**
 * Types for Procedure Control Module
 */

export type KitItemCategory = 
  | 'material_descartavel'
  | 'medicamento'
  | 'epi'
  | 'insumo';

export type ProcedureExecutionStatus = 
  | 'em_andamento'
  | 'finalizado'
  | 'cancelado';

export type ConsumptionDivergenceStatus = 
  | 'pendente'
  | 'aprovado'
  | 'rejeitado';

export type StockMovementType = 
  | 'entrada'
  | 'saida'
  | 'ajuste'
  | 'transferencia';

export interface Procedure {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  category?: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProcedureKit {
  id: string;
  procedure_id: string;
  version: number;
  version_notes?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  procedure?: Procedure;
  kit_items?: KitItem[];
}

export interface StockItem {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  category: KitItemCategory;
  unit: string;
  min_quantity: number;
  reorder_point: number;
  cost_unit: number;
  requires_lot: boolean;
  requires_expiry: boolean;
  is_critical: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KitItem {
  id: string;
  kit_id: string;
  stock_item_id: string;
  quantity_default: number;
  requires_photo: boolean;
  allows_substitute: boolean;
  notes?: string;
  order_index: number;
  stock_item?: StockItem;
}

export interface KitItemSubstitute {
  id: string;
  kit_item_id: string;
  substitute_item_id: string;
  notes?: string;
  substitute_item?: StockItem;
}

export interface ClinicStock {
  id: string;
  clinic_id: string;
  stock_item_id: string;
  on_hand_qty: number;
  reserved_qty: number;
  updated_at: string;
  stock_item?: StockItem;
}

export interface ProcedureExecution {
  id: string;
  tenant_id?: string;
  clinic_id: string;
  patient_id?: string;
  procedure_id: string;
  kit_id?: string;
  status: ProcedureExecutionStatus;
  executed_at: string;
  completed_at?: string;
  total_cost: number;
  notes?: string;
  executed_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  procedure?: Procedure;
  kit?: ProcedureKit;
  patient?: { id: string; full_name: string };
  clinic?: { id: string; name: string };
}

export interface ConsumptionEntry {
  id: string;
  execution_id: string;
  kit_item_id?: string;
  stock_item_id: string;
  quantity_expected: number;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  lot_number?: string;
  expiry_date?: string;
  has_divergence: boolean;
  divergence_reason?: string;
  divergence_notes?: string;
  divergence_status: ConsumptionDivergenceStatus;
  divergence_approved_by?: string;
  divergence_approved_at?: string;
  created_at: string;
  created_by?: string;
  stock_item?: StockItem;
  photos?: ConsumptionPhoto[];
}

export interface ConsumptionPhoto {
  id: string;
  consumption_entry_id: string;
  photo_url: string;
  photo_type: string;
  is_legible: boolean;
  notes?: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface StockMovement {
  id: string;
  clinic_id: string;
  stock_item_id: string;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost: number;
  lot_number?: string;
  expiry_date?: string;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  stock_item?: StockItem;
}

export interface ProcedureAuditLog {
  id: string;
  tenant_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface ProcedureModuleSettings {
  id: string;
  tenant_id?: string;
  require_photo_all_items: boolean;
  require_lot_critical_items: boolean;
  max_divergence_percent: number;
  require_dual_approval_critical: boolean;
  block_expired_items: boolean;
  created_at: string;
  updated_at: string;
}

// Category labels for display
export const CATEGORY_LABELS: Record<KitItemCategory, string> = {
  material_descartavel: 'Material Descartável',
  medicamento: 'Medicamento',
  epi: 'EPI',
  insumo: 'Insumo'
};

export const STATUS_LABELS: Record<ProcedureExecutionStatus, string> = {
  em_andamento: 'Em Andamento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado'
};

export const DIVERGENCE_STATUS_LABELS: Record<ConsumptionDivergenceStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado'
};

export const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  transferencia: 'Transferência'
};

export const DIVERGENCE_REASONS = [
  'Sobra de material',
  'Falta de material',
  'Material danificado',
  'Erro de preparo',
  'Contaminação',
  'Substituição autorizada',
  'Quebra',
  'Ajuste de dosagem',
  'Outros'
];
