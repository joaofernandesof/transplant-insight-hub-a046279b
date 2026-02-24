
-- ===================================================================
-- SURGERY TASK AUTOMATION SYSTEM
-- Protocolo automático D-X para tarefas cirúrgicas
-- ===================================================================

-- 1. Task definitions (templates)
CREATE TABLE public.surgery_task_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  d_offset INTEGER, -- null = phase 0 (sale), negative = before, positive = after
  title TEXT NOT NULL,
  responsible_name TEXT NOT NULL,
  responsible_email TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  phase_label TEXT NOT NULL, -- 'D-20', 'D-15', 'D-10', 'D-2', 'D-1', 'D0', 'D+1', 'Venda'
  phase_color TEXT NOT NULL DEFAULT '#6b7280', -- gray
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Generated tasks per surgery
CREATE TABLE public.surgery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surgery_id UUID NOT NULL REFERENCES public.surgery_schedule(id) ON DELETE CASCADE,
  definition_id UUID REFERENCES public.surgery_task_definitions(id),
  d_offset INTEGER,
  title TEXT NOT NULL,
  scheduled_date DATE, -- calculated from surgery_date - d_offset
  responsible_name TEXT NOT NULL,
  responsible_email TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'overdue')),
  phase_label TEXT NOT NULL,
  phase_color TEXT NOT NULL DEFAULT '#6b7280',
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  observation TEXT,
  has_problem BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_surgery_tasks_surgery_id ON public.surgery_tasks(surgery_id);
CREATE INDEX idx_surgery_tasks_status ON public.surgery_tasks(status);
CREATE INDEX idx_surgery_tasks_scheduled_date ON public.surgery_tasks(scheduled_date);
CREATE INDEX idx_surgery_tasks_responsible ON public.surgery_tasks(responsible_email);

-- RLS
ALTER TABLE public.surgery_task_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgery_tasks ENABLE ROW LEVEL SECURITY;

-- Definitions: readable by authenticated, manageable by admins
CREATE POLICY "Authenticated can view task definitions"
  ON public.surgery_task_definitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage task definitions"
  ON public.surgery_task_definitions FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

-- Tasks: accessible by staff (clinic staff + admins)
CREATE POLICY "Staff can view surgery tasks"
  ON public.surgery_tasks FOR SELECT TO authenticated
  USING (
    public.is_neohub_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Staff can insert surgery tasks"
  ON public.surgery_tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.is_neohub_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Staff can update surgery tasks"
  ON public.surgery_tasks FOR UPDATE TO authenticated
  USING (
    public.is_neohub_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins can delete surgery tasks"
  ON public.surgery_tasks FOR DELETE TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- 3. Seed task definitions
INSERT INTO public.surgery_task_definitions (d_offset, title, responsible_name, responsible_email, is_required, phase_label, phase_color, order_index) VALUES
  -- Phase 0 - Sale
  (NULL, 'Atualizar status do contrato', 'Julia', 'julia.coelho@neofolic.com.br', true, 'Venda', '#8b5cf6', 0),
  -- D-20 - Bruna
  (-20, 'Enviar guia de exames', 'Bruna', 'bruna.correa@neofolic.com.br', true, 'D-20', '#22c55e', 1),
  (-20, 'Enviar pré-operatório', 'Bruna', 'bruna.correa@neofolic.com.br', true, 'D-20', '#22c55e', 2),
  -- D-15 - Brenna
  (-15, 'Lembrete de data da cirurgia', 'Brenna', 'brenna.miranda@neofolic.com.br', true, 'D-15', '#3b82f6', 3),
  -- D-10 - Brenna
  (-10, 'Confirmação da cirurgia', 'Brenna', 'brenna.miranda@neofolic.com.br', true, 'D-10', '#f59e0b', 4),
  (-10, 'Entrega de exames', 'Brenna', 'brenna.miranda@neofolic.com.br', true, 'D-10', '#f59e0b', 5),
  (-10, 'Médico plantonista definido', 'Brenna', 'brenna.miranda@neofolic.com.br', true, 'D-10', '#f59e0b', 6),
  -- D-2 - Brenna
  (-2, 'Confirmar data', 'Brenna', 'brenna.miranda@neofolic.com.br', true, 'D-2', '#ef4444', 7),
  (-2, 'Confirmar tricotomia', 'Brenna', 'brenna.miranda@neofolic.com.br', true, 'D-2', '#ef4444', 8),
  (-2, 'Confirmar horário', 'Brenna', 'brenna.miranda@neofolic.com.br', true, 'D-2', '#ef4444', 9),
  -- D-1 - Brenna
  (-1, 'Enviar pós-cirurgia', 'Brenna', 'brenna.miranda@neofolic.com.br', true, 'D-1', '#a855f7', 10),
  (-1, 'Almoço escolhido pelo paciente', 'Brenna', 'brenna.miranda@neofolic.com.br', false, 'D-1', '#a855f7', 11),
  -- D-1 - Bruna (parallel)
  (-1, 'Enviar termo de marcação', 'Bruna', 'bruna.correa@neofolic.com.br', true, 'D-1', '#a855f7', 12),
  -- D0 - Bruna
  (0, 'Enviar termo de alta', 'Bruna', 'bruna.correa@neofolic.com.br', true, 'D0', '#ec4899', 13),
  -- D+1 - Bruna
  (1, 'Enviar GPI', 'Bruna', 'bruna.correa@neofolic.com.br', true, 'D+1', '#eab308', 14);

-- 4. Function to generate tasks for a surgery
CREATE OR REPLACE FUNCTION public.generate_surgery_tasks(p_surgery_id UUID, p_surgery_date DATE, p_include_sale BOOLEAN DEFAULT false)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_def RECORD;
  v_count INTEGER := 0;
  v_scheduled DATE;
BEGIN
  -- Delete existing auto-generated tasks for this surgery (to regenerate on date change)
  DELETE FROM public.surgery_tasks WHERE surgery_id = p_surgery_id AND definition_id IS NOT NULL;

  FOR v_def IN
    SELECT * FROM public.surgery_task_definitions
    WHERE is_active = true
    ORDER BY order_index
  LOOP
    -- Skip sale tasks unless explicitly requested
    IF v_def.d_offset IS NULL AND NOT p_include_sale THEN
      CONTINUE;
    END IF;

    -- Calculate scheduled date
    IF v_def.d_offset IS NULL THEN
      v_scheduled := CURRENT_DATE; -- Sale tasks are for today
    ELSE
      v_scheduled := p_surgery_date + v_def.d_offset;
    END IF;

    -- Determine initial status
    INSERT INTO public.surgery_tasks (
      surgery_id, definition_id, d_offset, title, scheduled_date,
      responsible_name, responsible_email, is_required,
      status, phase_label, phase_color
    ) VALUES (
      p_surgery_id, v_def.id, v_def.d_offset, v_def.title, v_scheduled,
      v_def.responsible_name, v_def.responsible_email, v_def.is_required,
      CASE
        WHEN v_scheduled < CURRENT_DATE THEN 'overdue'
        WHEN v_scheduled = CURRENT_DATE THEN 'active'
        ELSE 'pending'
      END,
      v_def.phase_label, v_def.phase_color
    );
    
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 5. Trigger: auto-generate tasks when surgery_date is set/changed
CREATE OR REPLACE FUNCTION public.trigger_surgery_tasks_on_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only for Transplante procedures and when surgery_date is set
  IF NEW.surgery_date IS NOT NULL AND (
    TG_OP = 'INSERT' OR 
    (TG_OP = 'UPDATE' AND (OLD.surgery_date IS NULL OR OLD.surgery_date != NEW.surgery_date))
  ) THEN
    -- Generate tasks (include sale task on first creation)
    PERFORM public.generate_surgery_tasks(
      NEW.id, 
      NEW.surgery_date, 
      TG_OP = 'INSERT' OR OLD.surgery_date IS NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_surgery_tasks_auto
  AFTER INSERT OR UPDATE OF surgery_date
  ON public.surgery_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_surgery_tasks_on_date();

-- 6. Daily status update function (to be called by cron)
CREATE OR REPLACE FUNCTION public.update_surgery_task_statuses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  -- Mark overdue: scheduled_date < today AND not completed
  UPDATE public.surgery_tasks
  SET status = 'overdue', updated_at = now()
  WHERE status IN ('pending', 'active')
    AND scheduled_date < CURRENT_DATE;
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Mark active: scheduled_date = today AND still pending
  UPDATE public.surgery_tasks
  SET status = 'active', updated_at = now()
  WHERE status = 'pending'
    AND scheduled_date = CURRENT_DATE;

  RETURN v_updated;
END;
$$;

-- 7. Updated_at trigger
CREATE TRIGGER trg_surgery_tasks_updated_at
  BEFORE UPDATE ON public.surgery_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cleaning_updated_at();
