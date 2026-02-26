
-- =============================================
-- Orquestra Cirúrgica - Schema
-- =============================================

-- 1. Templates de processos (fluxos BPMN)
CREATE TABLE public.neoteam_process_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  category TEXT, -- ex: 'pre_operatorio', 'pos_operatorio', 'documentacao', 'alta'
  icon TEXT DEFAULT 'workflow',
  color TEXT DEFAULT '#3B82F6',
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Etapas dentro de um template
CREATE TABLE public.neoteam_process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.neoteam_process_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  step_type TEXT NOT NULL DEFAULT 'manual' CHECK (step_type IN ('manual', 'automatic', 'approval')),
  responsible_role TEXT, -- papel genérico (ex: 'coordenador', 'enfermeiro')
  responsible_user_id UUID, -- colaborador específico (opcional)
  relative_day INTEGER, -- D-20 = -20, D+1 = 1, D0 = 0
  duration_hours INTEGER DEFAULT 24, -- duração estimada em horas
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Dependências entre etapas
CREATE TABLE public.neoteam_process_step_deps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.neoteam_process_steps(id) ON DELETE CASCADE,
  depends_on_step_id UUID NOT NULL REFERENCES public.neoteam_process_steps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(step_id, depends_on_step_id)
);

-- 4. Instâncias de processo (vinculadas a cirurgias)
CREATE TABLE public.neoteam_process_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.neoteam_process_templates(id),
  surgery_id UUID REFERENCES public.clinic_surgeries(id) ON DELETE SET NULL,
  patient_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Etapas da instância (execução real)
CREATE TABLE public.neoteam_process_instance_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.neoteam_process_instances(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.neoteam_process_steps(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'skipped')),
  assigned_to UUID, -- colaborador designado
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_process_steps_template ON public.neoteam_process_steps(template_id);
CREATE INDEX idx_process_instances_surgery ON public.neoteam_process_instances(surgery_id);
CREATE INDEX idx_process_instances_template ON public.neoteam_process_instances(template_id);
CREATE INDEX idx_process_instance_steps_instance ON public.neoteam_process_instance_steps(instance_id);
CREATE INDEX idx_process_instance_steps_status ON public.neoteam_process_instance_steps(status);

-- RLS
ALTER TABLE public.neoteam_process_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoteam_process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoteam_process_step_deps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoteam_process_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoteam_process_instance_steps ENABLE ROW LEVEL SECURITY;

-- Policies: Admin-only write, authenticated read
CREATE POLICY "Authenticated users can read process templates"
  ON public.neoteam_process_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage process templates"
  ON public.neoteam_process_templates FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Authenticated users can read process steps"
  ON public.neoteam_process_steps FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage process steps"
  ON public.neoteam_process_steps FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Authenticated users can read step deps"
  ON public.neoteam_process_step_deps FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage step deps"
  ON public.neoteam_process_step_deps FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Authenticated users can read process instances"
  ON public.neoteam_process_instances FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage process instances"
  ON public.neoteam_process_instances FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Authenticated users can read instance steps"
  ON public.neoteam_process_instance_steps FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update instance steps"
  ON public.neoteam_process_instance_steps FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Admins can manage instance steps"
  ON public.neoteam_process_instance_steps FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_neoteam_process_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_process_templates_updated BEFORE UPDATE ON public.neoteam_process_templates
FOR EACH ROW EXECUTE FUNCTION public.update_neoteam_process_updated_at();

CREATE TRIGGER trg_process_steps_updated BEFORE UPDATE ON public.neoteam_process_steps
FOR EACH ROW EXECUTE FUNCTION public.update_neoteam_process_updated_at();

CREATE TRIGGER trg_process_instances_updated BEFORE UPDATE ON public.neoteam_process_instances
FOR EACH ROW EXECUTE FUNCTION public.update_neoteam_process_updated_at();

CREATE TRIGGER trg_process_instance_steps_updated BEFORE UPDATE ON public.neoteam_process_instance_steps
FOR EACH ROW EXECUTE FUNCTION public.update_neoteam_process_updated_at();
