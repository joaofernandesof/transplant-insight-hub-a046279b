
-- ============================================
-- MODULO DE ROTINA DE LIMPEZA - INFRAESTRUTURA
-- ============================================

-- 1. ENUMS
-- ============================================

-- Nivel de risco sanitario
CREATE TYPE sanitary_risk_level AS ENUM (
  'critico',      -- Centro cirurgico, salas de procedimento
  'semicritico',  -- Consultorios, areas de recuperacao
  'nao_critico'   -- Recepcao, administrativo, copa
);

-- Status de execucao do ambiente
CREATE TYPE cleaning_execution_status AS ENUM (
  'pendente',
  'em_execucao',
  'finalizado_limpeza',
  'aguardando_fiscalizacao',
  'reprovado',
  'corrigido',
  'aprovado'
);

-- 2. TABELAS
-- ============================================

-- Ambientes fisicos da clinica
CREATE TABLE public.cleaning_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.neoteam_branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  environment_type VARCHAR(100),
  sanitary_risk_level sanitary_risk_level NOT NULL DEFAULT 'nao_critico',
  priority_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Versoes de checklist por ambiente
CREATE TABLE public.cleaning_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_id UUID NOT NULL REFERENCES public.cleaning_environments(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  version_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Itens individuais do checklist
CREATE TABLE public.cleaning_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.cleaning_checklists(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'limpeza_geral',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rotina agregada por dia
CREATE TABLE public.cleaning_daily_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.neoteam_branches(id) ON DELETE CASCADE,
  routine_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'em_andamento',
  total_environments INTEGER NOT NULL DEFAULT 0,
  completed_environments INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(branch_id, routine_date)
);

-- Execucao individual de cada ambiente por dia
CREATE TABLE public.cleaning_environment_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES public.cleaning_daily_routines(id) ON DELETE CASCADE,
  environment_id UUID NOT NULL REFERENCES public.cleaning_environments(id) ON DELETE RESTRICT,
  checklist_id UUID REFERENCES public.cleaning_checklists(id) ON DELETE RESTRICT,
  status cleaning_execution_status NOT NULL DEFAULT 'pendente',
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  rejection_notes TEXT,
  correction_count INTEGER NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Marcacao de cada item do checklist
CREATE TABLE public.cleaning_execution_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.cleaning_environment_executions(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES public.cleaning_checklist_items(id) ON DELETE RESTRICT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  is_rejected BOOLEAN NOT NULL DEFAULT false,
  rejection_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insumos de limpeza
CREATE TABLE public.cleaning_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.neoteam_branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'outros',
  unit VARCHAR(20) NOT NULL DEFAULT 'un',
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_unit DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Movimentacoes de estoque de insumos
CREATE TABLE public.cleaning_supply_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID NOT NULL REFERENCES public.cleaning_supplies(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  execution_id UUID REFERENCES public.cleaning_environment_executions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Auditoria completa de acoes
CREATE TABLE public.cleaning_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. INDEXES
-- ============================================

CREATE INDEX idx_cleaning_environments_branch ON public.cleaning_environments(branch_id);
CREATE INDEX idx_cleaning_environments_risk ON public.cleaning_environments(sanitary_risk_level);
CREATE INDEX idx_cleaning_environments_priority ON public.cleaning_environments(priority_order);

CREATE INDEX idx_cleaning_checklists_environment ON public.cleaning_checklists(environment_id);
CREATE INDEX idx_cleaning_checklists_active ON public.cleaning_checklists(is_active) WHERE is_active = true;

CREATE INDEX idx_cleaning_checklist_items_checklist ON public.cleaning_checklist_items(checklist_id);

CREATE INDEX idx_cleaning_daily_routines_branch_date ON public.cleaning_daily_routines(branch_id, routine_date);
CREATE INDEX idx_cleaning_daily_routines_status ON public.cleaning_daily_routines(status);

CREATE INDEX idx_cleaning_executions_routine ON public.cleaning_environment_executions(routine_id);
CREATE INDEX idx_cleaning_executions_status ON public.cleaning_environment_executions(status);
CREATE INDEX idx_cleaning_executions_executed_by ON public.cleaning_environment_executions(executed_by);

CREATE INDEX idx_cleaning_execution_items_execution ON public.cleaning_execution_items(execution_id);

CREATE INDEX idx_cleaning_supplies_branch ON public.cleaning_supplies(branch_id);
CREATE INDEX idx_cleaning_supplies_low_stock ON public.cleaning_supplies(current_stock, min_stock) 
  WHERE current_stock <= min_stock AND is_active = true;

CREATE INDEX idx_cleaning_supply_movements_supply ON public.cleaning_supply_movements(supply_id);

CREATE INDEX idx_cleaning_audit_logs_entity ON public.cleaning_audit_logs(entity_type, entity_id);
CREATE INDEX idx_cleaning_audit_logs_created ON public.cleaning_audit_logs(created_at DESC);

-- 4. TRIGGERS
-- ============================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_cleaning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_cleaning_environments_updated_at
  BEFORE UPDATE ON public.cleaning_environments
  FOR EACH ROW EXECUTE FUNCTION public.update_cleaning_updated_at();

CREATE TRIGGER trigger_cleaning_daily_routines_updated_at
  BEFORE UPDATE ON public.cleaning_daily_routines
  FOR EACH ROW EXECUTE FUNCTION public.update_cleaning_updated_at();

CREATE TRIGGER trigger_cleaning_executions_updated_at
  BEFORE UPDATE ON public.cleaning_environment_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_cleaning_updated_at();

CREATE TRIGGER trigger_cleaning_supplies_updated_at
  BEFORE UPDATE ON public.cleaning_supplies
  FOR EACH ROW EXECUTE FUNCTION public.update_cleaning_updated_at();

-- Trigger para auditoria de aprovacao
CREATE OR REPLACE FUNCTION public.log_cleaning_approval_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    -- Registrar auditoria
    INSERT INTO public.cleaning_audit_logs (
      tenant_id, action, entity_type, entity_id,
      old_values, new_values, created_by
    )
    SELECT 
      dr.tenant_id,
      'aprovacao',
      'cleaning_environment_executions',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NEW.approved_by
    FROM public.cleaning_daily_routines dr
    WHERE dr.id = NEW.routine_id;
    
    -- Travar o registro
    NEW.is_locked := true;
    
    -- Atualizar contador de ambientes aprovados na rotina
    UPDATE public.cleaning_daily_routines
    SET completed_environments = completed_environments + 1
    WHERE id = NEW.routine_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_cleaning_approval_audit
  BEFORE UPDATE ON public.cleaning_environment_executions
  FOR EACH ROW EXECUTE FUNCTION public.log_cleaning_approval_audit();

-- Trigger para atualizar estoque em movimentacoes
CREATE OR REPLACE FUNCTION public.update_cleaning_supply_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'entrada' THEN
    UPDATE public.cleaning_supplies
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.supply_id;
  ELSIF NEW.movement_type = 'saida' THEN
    UPDATE public.cleaning_supplies
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.supply_id;
  ELSIF NEW.movement_type = 'ajuste' THEN
    UPDATE public.cleaning_supplies
    SET current_stock = NEW.quantity
    WHERE id = NEW.supply_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_cleaning_supply_movement
  AFTER INSERT ON public.cleaning_supply_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_cleaning_supply_stock();

-- 5. SECURITY DEFINER FUNCTIONS
-- ============================================

-- Funcao para verificar se usuario tem cargo de limpeza
CREATE OR REPLACE FUNCTION public.has_cleaning_role(_user_id uuid, _role_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_user_roles sur
    JOIN public.staff_roles sr ON sr.id = sur.role_id
    JOIN public.neohub_users nu ON nu.id = sur.neohub_user_id
    WHERE nu.user_id = _user_id
      AND sr.code = _role_code
      AND sur.is_active = true
      AND sr.is_active = true
  )
$$;

-- Funcao para verificar branch do usuario
CREATE OR REPLACE FUNCTION public.get_user_cleaning_branches(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT sur.branch_id
  FROM public.staff_user_roles sur
  JOIN public.neohub_users nu ON nu.id = sur.neohub_user_id
  WHERE nu.user_id = _user_id
    AND sur.is_active = true
    AND sur.branch_id IS NOT NULL
$$;

-- 6. RLS POLICIES
-- ============================================

ALTER TABLE public.cleaning_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_daily_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_environment_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_execution_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_supply_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleaning_audit_logs ENABLE ROW LEVEL SECURITY;

-- cleaning_environments
CREATE POLICY "cleaning_environments_select" ON public.cleaning_environments
FOR SELECT TO authenticated
USING (
  branch_id IN (SELECT public.get_user_cleaning_branches(auth.uid()))
  OR public.is_neohub_admin(auth.uid())
);

CREATE POLICY "cleaning_environments_insert" ON public.cleaning_environments
FOR INSERT TO authenticated
WITH CHECK (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

CREATE POLICY "cleaning_environments_update" ON public.cleaning_environments
FOR UPDATE TO authenticated
USING (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

CREATE POLICY "cleaning_environments_delete" ON public.cleaning_environments
FOR DELETE TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
);

-- cleaning_checklists
CREATE POLICY "cleaning_checklists_select" ON public.cleaning_checklists
FOR SELECT TO authenticated
USING (
  environment_id IN (SELECT id FROM public.cleaning_environments)
);

CREATE POLICY "cleaning_checklists_insert" ON public.cleaning_checklists
FOR INSERT TO authenticated
WITH CHECK (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

CREATE POLICY "cleaning_checklists_update" ON public.cleaning_checklists
FOR UPDATE TO authenticated
USING (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

-- cleaning_checklist_items
CREATE POLICY "cleaning_checklist_items_select" ON public.cleaning_checklist_items
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "cleaning_checklist_items_insert" ON public.cleaning_checklist_items
FOR INSERT TO authenticated
WITH CHECK (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

CREATE POLICY "cleaning_checklist_items_update" ON public.cleaning_checklist_items
FOR UPDATE TO authenticated
USING (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

-- cleaning_daily_routines
CREATE POLICY "cleaning_daily_routines_select" ON public.cleaning_daily_routines
FOR SELECT TO authenticated
USING (
  branch_id IN (SELECT public.get_user_cleaning_branches(auth.uid()))
  OR public.is_neohub_admin(auth.uid())
);

CREATE POLICY "cleaning_daily_routines_insert" ON public.cleaning_daily_routines
FOR INSERT TO authenticated
WITH CHECK (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.has_cleaning_role(auth.uid(), 'limpeza')
  OR public.is_neohub_admin(auth.uid())
);

CREATE POLICY "cleaning_daily_routines_update" ON public.cleaning_daily_routines
FOR UPDATE TO authenticated
USING (
  branch_id IN (SELECT public.get_user_cleaning_branches(auth.uid()))
  OR public.is_neohub_admin(auth.uid())
);

-- cleaning_environment_executions
CREATE POLICY "cleaning_executions_select" ON public.cleaning_environment_executions
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "cleaning_executions_insert" ON public.cleaning_environment_executions
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "cleaning_executions_update_limpeza" ON public.cleaning_environment_executions
FOR UPDATE TO authenticated
USING (
  is_locked = false
  AND (
    -- Limpeza pode atualizar em_execucao ou corrigido
    (
      status IN ('em_execucao', 'corrigido')
      AND (public.has_cleaning_role(auth.uid(), 'limpeza') OR executed_by = auth.uid())
    )
    -- Fiscal pode atualizar aguardando_fiscalizacao
    OR (
      status = 'aguardando_fiscalizacao'
      AND (public.has_cleaning_role(auth.uid(), 'fiscal_limpeza') OR public.has_cleaning_role(auth.uid(), 'gestor_limpeza'))
    )
    -- Gestor pode atualizar qualquer status nao travado
    OR public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
    -- Admin bypass
    OR public.is_neohub_admin(auth.uid())
  )
);

-- cleaning_execution_items
CREATE POLICY "cleaning_execution_items_select" ON public.cleaning_execution_items
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "cleaning_execution_items_insert" ON public.cleaning_execution_items
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "cleaning_execution_items_update" ON public.cleaning_execution_items
FOR UPDATE TO authenticated
USING (
  public.has_cleaning_role(auth.uid(), 'limpeza')
  OR public.has_cleaning_role(auth.uid(), 'fiscal_limpeza')
  OR public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

-- cleaning_supplies
CREATE POLICY "cleaning_supplies_select" ON public.cleaning_supplies
FOR SELECT TO authenticated
USING (
  branch_id IN (SELECT public.get_user_cleaning_branches(auth.uid()))
  OR public.is_neohub_admin(auth.uid())
);

CREATE POLICY "cleaning_supplies_insert" ON public.cleaning_supplies
FOR INSERT TO authenticated
WITH CHECK (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

CREATE POLICY "cleaning_supplies_update" ON public.cleaning_supplies
FOR UPDATE TO authenticated
USING (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

-- cleaning_supply_movements
CREATE POLICY "cleaning_supply_movements_select" ON public.cleaning_supply_movements
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "cleaning_supply_movements_insert" ON public.cleaning_supply_movements
FOR INSERT TO authenticated
WITH CHECK (
  public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.has_cleaning_role(auth.uid(), 'limpeza')
  OR public.is_neohub_admin(auth.uid())
);

-- cleaning_audit_logs
CREATE POLICY "cleaning_audit_logs_select" ON public.cleaning_audit_logs
FOR SELECT TO authenticated
USING (
  public.has_cleaning_role(auth.uid(), 'fiscal_limpeza')
  OR public.has_cleaning_role(auth.uid(), 'gestor_limpeza')
  OR public.is_neohub_admin(auth.uid())
);

-- 7. NOVOS CARGOS EM STAFF_ROLES
-- ============================================

INSERT INTO public.staff_roles (code, name, department, description, default_route, icon, color, is_active)
VALUES 
  ('limpeza', 'Auxiliar de Limpeza', 'operacoes', 'Responsável pela execução da limpeza diária dos ambientes', '/neoteam/cleaning', 'Sparkles', 'bg-cyan-500', true),
  ('fiscal_limpeza', 'Fiscal de Limpeza', 'operacoes', 'Responsável pela fiscalização e aprovação da limpeza executada', '/neoteam/cleaning?tab=inspection', 'ClipboardCheck', 'bg-purple-500', true),
  ('gestor_limpeza', 'Gestor de Higienização', 'gestao', 'Gerencia ambientes, checklists, estoque e monitora a rotina de limpeza', '/neoteam/cleaning?tab=monitoring', 'Shield', 'bg-indigo-500', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  description = EXCLUDED.description,
  default_route = EXCLUDED.default_route,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- 8. FUNCAO PARA CRIAR ROTINA DIARIA
-- ============================================

CREATE OR REPLACE FUNCTION public.create_or_get_daily_cleaning_routine(
  p_branch_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_routine_id uuid;
  v_tenant_id uuid;
  v_env_count integer;
BEGIN
  -- Verificar se ja existe rotina para o dia
  SELECT id INTO v_routine_id
  FROM public.cleaning_daily_routines
  WHERE branch_id = p_branch_id AND routine_date = p_date;
  
  IF v_routine_id IS NOT NULL THEN
    RETURN v_routine_id;
  END IF;
  
  -- Buscar tenant_id da branch
  SELECT tenant_id INTO v_tenant_id
  FROM public.neoteam_branches
  WHERE id = p_branch_id;
  
  -- Contar ambientes ativos
  SELECT COUNT(*) INTO v_env_count
  FROM public.cleaning_environments
  WHERE branch_id = p_branch_id AND is_active = true;
  
  -- Criar nova rotina
  INSERT INTO public.cleaning_daily_routines (tenant_id, branch_id, routine_date, total_environments)
  VALUES (v_tenant_id, p_branch_id, p_date, v_env_count)
  RETURNING id INTO v_routine_id;
  
  -- Criar execucoes para cada ambiente
  INSERT INTO public.cleaning_environment_executions (routine_id, environment_id, checklist_id)
  SELECT 
    v_routine_id,
    e.id,
    (SELECT c.id FROM public.cleaning_checklists c WHERE c.environment_id = e.id AND c.is_active = true ORDER BY c.version DESC LIMIT 1)
  FROM public.cleaning_environments e
  WHERE e.branch_id = p_branch_id AND e.is_active = true
  ORDER BY 
    CASE e.sanitary_risk_level 
      WHEN 'critico' THEN 1 
      WHEN 'semicritico' THEN 2 
      ELSE 3 
    END,
    e.priority_order;
  
  RETURN v_routine_id;
END;
$$;
