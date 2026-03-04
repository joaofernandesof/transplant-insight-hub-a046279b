
-- Fix: use full_name instead of display_name for neohub_users

CREATE OR REPLACE FUNCTION public.generate_surgery_tasks(
  p_surgery_id UUID,
  p_surgery_date DATE DEFAULT NULL,
  p_include_sale BOOLEAN DEFAULT false
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_def RECORD;
  v_count INTEGER := 0;
  v_scheduled DATE;
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_template_id UUID;
  v_instance_id UUID;
  v_branch TEXT;
  v_created_by UUID;
BEGIN
  SELECT process_template_id, branch, 
         CASE WHEN created_by IS NOT NULL AND created_by != '' THEN created_by::uuid ELSE NULL END
  INTO v_template_id, v_branch, v_created_by
  FROM public.clinic_surgeries
  WHERE id = p_surgery_id;

  IF v_template_id IS NULL AND v_branch IS NOT NULL THEN
    v_template_id := public.resolve_surgery_process_template(v_branch);
    IF v_template_id IS NOT NULL THEN
      UPDATE public.clinic_surgeries SET process_template_id = v_template_id WHERE id = p_surgery_id;
    END IF;
  END IF;

  IF v_template_id IS NOT NULL THEN
    IF p_include_sale THEN
      DELETE FROM public.surgery_tasks
      WHERE surgery_id = p_surgery_id AND (definition_id IS NOT NULL OR process_step_id IS NOT NULL);
    ELSE
      DELETE FROM public.surgery_tasks
      WHERE surgery_id = p_surgery_id AND (definition_id IS NOT NULL OR process_step_id IS NOT NULL) AND d_offset IS NOT NULL;
    END IF;

    SELECT id INTO v_instance_id
    FROM public.neoteam_process_instances
    WHERE surgery_id = p_surgery_id AND template_id = v_template_id
    LIMIT 1;

    IF v_instance_id IS NULL THEN
      IF v_created_by IS NULL THEN
        v_created_by := '00000000-0000-0000-0000-000000000000'::uuid;
      END IF;
      
      INSERT INTO public.neoteam_process_instances (
        template_id, surgery_id, created_by, status, patient_name
      ) VALUES (
        v_template_id, p_surgery_id, v_created_by, 'active',
        (SELECT patient_name FROM public.clinic_surgeries WHERE id = p_surgery_id)
      )
      RETURNING id INTO v_instance_id;
    END IF;

    FOR v_def IN
      SELECT 
        ps.id AS step_id, ps.name, ps.relative_day, ps.responsible_user_id,
        ps.responsible_role, ps.is_required, ps.order_index,
        COALESCE(nu.full_name, ps.responsible_role, 'Não atribuído') AS resolved_name,
        COALESCE(nu.email, '') AS resolved_email
      FROM public.neoteam_process_steps ps
      LEFT JOIN public.neohub_users nu ON nu.id = ps.responsible_user_id
      WHERE ps.template_id = v_template_id
      ORDER BY ps.order_index
    LOOP
      IF v_def.relative_day IS NULL THEN
        IF NOT p_include_sale THEN CONTINUE; END IF;
        v_scheduled := v_today;
      ELSE
        IF p_surgery_date IS NULL THEN CONTINUE; END IF;
        v_scheduled := p_surgery_date + v_def.relative_day;
      END IF;

      INSERT INTO public.surgery_tasks (
        surgery_id, definition_id, process_step_id, process_instance_id,
        d_offset, title, scheduled_date,
        responsible_name, responsible_email, responsible_user_id, is_required,
        status, phase_label, phase_color
      ) VALUES (
        p_surgery_id, NULL, v_def.step_id, v_instance_id,
        v_def.relative_day, v_def.name, v_scheduled,
        v_def.resolved_name, v_def.resolved_email, v_def.responsible_user_id, v_def.is_required,
        CASE
          WHEN v_scheduled < v_today THEN 'overdue'
          WHEN v_scheduled = v_today THEN 'active'
          ELSE 'pending'
        END,
        CASE
          WHEN v_def.relative_day IS NULL THEN 'Venda'
          ELSE 'D' || CASE WHEN v_def.relative_day >= 0 THEN '+' ELSE '' END || v_def.relative_day::TEXT
        END,
        CASE 
          WHEN v_def.relative_day IS NULL THEN '#6366f1'
          WHEN v_def.relative_day <= -15 THEN '#f59e0b'
          WHEN v_def.relative_day <= -7 THEN '#3b82f6'
          WHEN v_def.relative_day <= -2 THEN '#8b5cf6'
          WHEN v_def.relative_day <= 0 THEN '#ef4444'
          ELSE '#22c55e'
        END
      );
      v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
  END IF;

  -- ===== FALLBACK: Legacy =====
  IF p_include_sale THEN
    DELETE FROM public.surgery_tasks WHERE surgery_id = p_surgery_id AND definition_id IS NOT NULL;
  ELSE
    DELETE FROM public.surgery_tasks WHERE surgery_id = p_surgery_id AND definition_id IS NOT NULL AND d_offset IS NOT NULL;
  END IF;

  FOR v_def IN
    SELECT * FROM public.surgery_task_definitions WHERE is_active = true ORDER BY order_index
  LOOP
    IF v_def.d_offset IS NULL THEN
      IF NOT p_include_sale THEN CONTINUE; END IF;
      v_scheduled := v_today;
    ELSE
      IF p_surgery_date IS NULL THEN CONTINUE; END IF;
      v_scheduled := p_surgery_date + v_def.d_offset;
    END IF;

    INSERT INTO public.surgery_tasks (
      surgery_id, definition_id, d_offset, title, scheduled_date,
      responsible_name, responsible_email, is_required,
      status, phase_label, phase_color
    ) VALUES (
      p_surgery_id, v_def.id, v_def.d_offset, v_def.title, v_scheduled,
      v_def.responsible_name, v_def.responsible_email, v_def.is_required,
      CASE
        WHEN v_scheduled < v_today THEN 'overdue'
        WHEN v_scheduled = v_today THEN 'active'
        ELSE 'pending'
      END,
      v_def.phase_label, v_def.phase_color
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Also fix the propagation trigger to use full_name
CREATE OR REPLACE FUNCTION public.propagate_process_step_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_surgery RECORD;
  v_scheduled DATE;
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_resolved_name TEXT;
  v_resolved_email TEXT;
  v_instance_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(nu.full_name, NEW.responsible_role, 'Não atribuído'),
           COALESCE(nu.email, '')
    INTO v_resolved_name, v_resolved_email
    FROM (SELECT 1) dummy
    LEFT JOIN public.neohub_users nu ON nu.id = NEW.responsible_user_id;

    UPDATE public.surgery_tasks st
    SET 
      title = NEW.name,
      responsible_user_id = NEW.responsible_user_id,
      responsible_name = v_resolved_name,
      responsible_email = v_resolved_email,
      is_required = NEW.is_required,
      d_offset = NEW.relative_day,
      scheduled_date = CASE
        WHEN NEW.relative_day IS NULL THEN st.scheduled_date
        ELSE (SELECT cs.surgery_date::date + NEW.relative_day
              FROM public.clinic_surgeries cs WHERE cs.id = st.surgery_id)
      END,
      phase_label = CASE
        WHEN NEW.relative_day IS NULL THEN 'Venda'
        ELSE 'D' || CASE WHEN NEW.relative_day >= 0 THEN '+' ELSE '' END || NEW.relative_day::TEXT
      END,
      updated_at = now()
    WHERE st.process_step_id = NEW.id
      AND st.status IN ('pending', 'active');

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.surgery_tasks
    WHERE process_step_id = OLD.id AND status IN ('pending');
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(nu.full_name, NEW.responsible_role, 'Não atribuído'),
           COALESCE(nu.email, '')
    INTO v_resolved_name, v_resolved_email
    FROM (SELECT 1) dummy
    LEFT JOIN public.neohub_users nu ON nu.id = NEW.responsible_user_id;

    FOR v_surgery IN
      SELECT cs.id AS surgery_id, cs.surgery_date
      FROM public.clinic_surgeries cs
      WHERE cs.process_template_id = NEW.template_id
        AND cs.surgery_date IS NOT NULL
        AND cs.surgery_date >= v_today
    LOOP
      SELECT id INTO v_instance_id
      FROM public.neoteam_process_instances
      WHERE surgery_id = v_surgery.surgery_id AND template_id = NEW.template_id
      LIMIT 1;

      IF NEW.relative_day IS NOT NULL THEN
        v_scheduled := v_surgery.surgery_date + NEW.relative_day;
      ELSE
        v_scheduled := v_today;
      END IF;

      INSERT INTO public.surgery_tasks (
        surgery_id, process_step_id, process_instance_id,
        d_offset, title, scheduled_date,
        responsible_name, responsible_email, responsible_user_id, is_required,
        status, phase_label, phase_color
      ) VALUES (
        v_surgery.surgery_id, NEW.id, v_instance_id,
        NEW.relative_day, NEW.name, v_scheduled,
        v_resolved_name, v_resolved_email, NEW.responsible_user_id, NEW.is_required,
        CASE
          WHEN v_scheduled < v_today THEN 'overdue'
          WHEN v_scheduled = v_today THEN 'active'
          ELSE 'pending'
        END,
        CASE
          WHEN NEW.relative_day IS NULL THEN 'Venda'
          ELSE 'D' || CASE WHEN NEW.relative_day >= 0 THEN '+' ELSE '' END || NEW.relative_day::TEXT
        END,
        CASE 
          WHEN NEW.relative_day IS NULL THEN '#6366f1'
          WHEN NEW.relative_day <= -15 THEN '#f59e0b'
          WHEN NEW.relative_day <= -7 THEN '#3b82f6'
          WHEN NEW.relative_day <= -2 THEN '#8b5cf6'
          WHEN NEW.relative_day <= 0 THEN '#ef4444'
          ELSE '#22c55e'
        END
      );
    END LOOP;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;
