-- ============================================
-- MÓDULO DE CONTROLE DE CONSUMO POR PROCEDIMENTO
-- ============================================

-- 1) ENUM para tipos e status
CREATE TYPE public.kit_item_category AS ENUM (
  'material_descartavel',
  'medicamento', 
  'epi',
  'insumo'
);

CREATE TYPE public.procedure_execution_status AS ENUM (
  'em_andamento',
  'finalizado',
  'cancelado'
);

CREATE TYPE public.consumption_divergence_status AS ENUM (
  'pendente',
  'aprovado',
  'rejeitado'
);

CREATE TYPE public.stock_movement_type AS ENUM (
  'entrada',
  'saida',
  'ajuste',
  'transferencia'
);

-- 2) TABELA: Procedimentos
CREATE TABLE public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3) TABELA: Kits (versionados)
CREATE TABLE public.procedure_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE CASCADE NOT NULL,
  version INTEGER DEFAULT 1,
  version_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4) TABELA: Itens de Estoque (catálogo)
CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category kit_item_category NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unidade',
  min_quantity INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 10,
  cost_unit DECIMAL(10,2) DEFAULT 0,
  requires_lot BOOLEAN DEFAULT false,
  requires_expiry BOOLEAN DEFAULT false,
  is_critical BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5) TABELA: Itens do Kit
CREATE TABLE public.kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES public.procedure_kits(id) ON DELETE CASCADE NOT NULL,
  stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE CASCADE NOT NULL,
  quantity_default DECIMAL(10,2) NOT NULL DEFAULT 1,
  requires_photo BOOLEAN DEFAULT false,
  allows_substitute BOOLEAN DEFAULT false,
  notes TEXT,
  order_index INTEGER DEFAULT 0
);

-- 6) TABELA: Substitutos permitidos
CREATE TABLE public.kit_item_substitutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_item_id UUID REFERENCES public.kit_items(id) ON DELETE CASCADE NOT NULL,
  substitute_item_id UUID REFERENCES public.stock_items(id) ON DELETE CASCADE NOT NULL,
  notes TEXT
);

-- 7) TABELA: Estoque por Clínica (simplificado)
CREATE TABLE public.clinic_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE CASCADE NOT NULL,
  on_hand_qty DECIMAL(10,2) DEFAULT 0,
  reserved_qty DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, stock_item_id)
);

-- 8) TABELA: Execução de Procedimento (Aplicação)
CREATE TABLE public.procedure_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.clinic_patients(id) ON DELETE SET NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL NOT NULL,
  kit_id UUID REFERENCES public.procedure_kits(id) ON DELETE SET NULL,
  status procedure_execution_status DEFAULT 'em_andamento',
  executed_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  executed_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9) TABELA: Consumo de Itens
CREATE TABLE public.consumption_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.procedure_executions(id) ON DELETE CASCADE NOT NULL,
  kit_item_id UUID REFERENCES public.kit_items(id) ON DELETE SET NULL,
  stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL NOT NULL,
  quantity_expected DECIMAL(10,2) NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  lot_number TEXT,
  expiry_date DATE,
  has_divergence BOOLEAN DEFAULT false,
  divergence_reason TEXT,
  divergence_notes TEXT,
  divergence_status consumption_divergence_status DEFAULT 'pendente',
  divergence_approved_by UUID REFERENCES auth.users(id),
  divergence_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 10) TABELA: Fotos de Evidência
CREATE TABLE public.consumption_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumption_entry_id UUID REFERENCES public.consumption_entries(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'rotulo',
  is_legible BOOLEAN DEFAULT true,
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- 11) TABELA: Movimentações de Estoque
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE CASCADE NOT NULL,
  movement_type stock_movement_type NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  lot_number TEXT,
  expiry_date DATE,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 12) TABELA: Log de Auditoria
CREATE TABLE public.procedure_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 13) Configurações do módulo
CREATE TABLE public.procedure_module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  require_photo_all_items BOOLEAN DEFAULT false,
  require_lot_critical_items BOOLEAN DEFAULT true,
  max_divergence_percent DECIMAL(5,2) DEFAULT 20,
  require_dual_approval_critical BOOLEAN DEFAULT true,
  block_expired_items BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ÍNDICES
CREATE INDEX idx_procedures_tenant ON public.procedures(tenant_id);
CREATE INDEX idx_procedure_kits_procedure ON public.procedure_kits(procedure_id);
CREATE INDEX idx_kit_items_kit ON public.kit_items(kit_id);
CREATE INDEX idx_clinic_stock_clinic ON public.clinic_stock(clinic_id);
CREATE INDEX idx_clinic_stock_item ON public.clinic_stock(stock_item_id);
CREATE INDEX idx_procedure_executions_clinic ON public.procedure_executions(clinic_id);
CREATE INDEX idx_procedure_executions_patient ON public.procedure_executions(patient_id);
CREATE INDEX idx_procedure_executions_status ON public.procedure_executions(status);
CREATE INDEX idx_consumption_entries_execution ON public.consumption_entries(execution_id);
CREATE INDEX idx_stock_movements_clinic ON public.stock_movements(clinic_id);
CREATE INDEX idx_stock_movements_item ON public.stock_movements(stock_item_id);
CREATE INDEX idx_audit_logs_entity ON public.procedure_audit_logs(entity_type, entity_id);

-- TRIGGERS para updated_at
CREATE TRIGGER update_procedures_updated_at
  BEFORE UPDATE ON public.procedures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinic_stock_updated_at
  BEFORE UPDATE ON public.clinic_stock
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procedure_executions_updated_at
  BEFORE UPDATE ON public.procedure_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procedure_module_settings_updated_at
  BEFORE UPDATE ON public.procedure_module_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_item_substitutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_module_settings ENABLE ROW LEVEL SECURITY;

-- Policies para leitura (autenticados)
CREATE POLICY "Authenticated users can read procedures"
  ON public.procedures FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read kits"
  ON public.procedure_kits FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read stock_items"
  ON public.stock_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read kit_items"
  ON public.kit_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read kit_item_substitutes"
  ON public.kit_item_substitutes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read clinic_stock"
  ON public.clinic_stock FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read executions"
  ON public.procedure_executions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read consumption_entries"
  ON public.consumption_entries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read consumption_photos"
  ON public.consumption_photos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read stock_movements"
  ON public.stock_movements FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read audit_logs"
  ON public.procedure_audit_logs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read settings"
  ON public.procedure_module_settings FOR SELECT TO authenticated
  USING (true);

-- Policies para escrita (autenticados podem inserir/atualizar)
CREATE POLICY "Authenticated users can insert executions"
  ON public.procedure_executions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update executions"
  ON public.procedure_executions FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert consumption_entries"
  ON public.consumption_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update consumption_entries"
  ON public.consumption_entries FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert consumption_photos"
  ON public.consumption_photos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert stock_movements"
  ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clinic_stock"
  ON public.clinic_stock FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert clinic_stock"
  ON public.clinic_stock FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert audit_logs"
  ON public.procedure_audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins podem tudo
CREATE POLICY "Admins can manage procedures"
  ON public.procedures FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage kits"
  ON public.procedure_kits FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage stock_items"
  ON public.stock_items FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage kit_items"
  ON public.kit_items FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage kit_item_substitutes"
  ON public.kit_item_substitutes FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage settings"
  ON public.procedure_module_settings FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- ============================================
-- FUNÇÃO: Baixa automática de estoque
-- ============================================
CREATE OR REPLACE FUNCTION public.process_consumption_stock_deduction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_execution RECORD;
BEGIN
  -- Get execution details
  SELECT * INTO v_execution FROM public.procedure_executions WHERE id = NEW.execution_id;
  v_clinic_id := v_execution.clinic_id;
  
  -- Update stock
  UPDATE public.clinic_stock
  SET on_hand_qty = on_hand_qty - NEW.quantity_used,
      updated_at = now()
  WHERE clinic_id = v_clinic_id
    AND stock_item_id = NEW.stock_item_id;
  
  -- If no row updated, insert with negative (shouldn't happen normally)
  IF NOT FOUND THEN
    INSERT INTO public.clinic_stock (clinic_id, stock_item_id, on_hand_qty)
    VALUES (v_clinic_id, NEW.stock_item_id, -NEW.quantity_used);
  END IF;
  
  -- Create stock movement record
  INSERT INTO public.stock_movements (
    clinic_id, stock_item_id, movement_type, quantity, unit_cost,
    lot_number, expiry_date, reference_type, reference_id, created_by
  ) VALUES (
    v_clinic_id, NEW.stock_item_id, 'saida', NEW.quantity_used, NEW.unit_cost,
    NEW.lot_number, NEW.expiry_date, 'consumption', NEW.id, NEW.created_by
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_consumption_stock_deduction
  AFTER INSERT ON public.consumption_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.process_consumption_stock_deduction();

-- ============================================
-- FUNÇÃO: Calcular custo total da execução
-- ============================================
CREATE OR REPLACE FUNCTION public.update_execution_total_cost()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.procedure_executions
  SET total_cost = (
    SELECT COALESCE(SUM(total_cost), 0)
    FROM public.consumption_entries
    WHERE execution_id = NEW.execution_id
  )
  WHERE id = NEW.execution_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_execution_cost
  AFTER INSERT OR UPDATE ON public.consumption_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_execution_total_cost();