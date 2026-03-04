
-- ===================================================================
-- UNIFY: Generate surgery tasks from process template steps when linked
-- ===================================================================

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
  v_responsible_name TEXT;
BEGIN
  -- Check if surgery has a linked process template
  SELECT process_template_id INTO v_template_id
  FROM public.clinic_surgeries
  WHERE id = p_surgery_id;

  IF v_template_id IS NOT NULL THEN
    -- ===== PATH: Generate from neoteam_process_steps =====
    
    -- Delete existing auto-generated tasks
    IF p_include_sale THEN
      DELETE FROM public.surgery_tasks
      WHERE surgery_id = p_surgery_id AND (definition_id IS NOT NULL OR process_step_id IS NOT NULL);
    ELSE
      DELETE FROM public.surgery_tasks
      WHERE surgery_id = p_surgery_id AND (definition_id IS NOT NULL OR process_step_id IS NOT NULL) AND d_offset IS NOT NULL;
    END IF;

    -- Create or update process instance
    SELECT id INTO v_instance_id
    FROM public.neoteam_process_instances
    WHERE surgery_id = p_surgery_id AND template_id = v_template_id
    LIMIT 1;

    IF v_instance_id IS NULL THEN
      INSERT INTO public.neoteam_process_instances (
        template_id, surgery_id, created_by, status,
        patient_name
      ) VALUES (
        v_template_id, p_surgery_id, 
        COALESCE((SELECT created_by FROM public.clinic_surgeries WHERE id = p_surgery_id), ''),
        'active',
        (SELECT patient_name FROM public.clinic_surgeries WHERE id = p_surgery_id)
      )
      RETURNING id INTO v_instance_id;
    END IF;

    -- Generate tasks from process steps
    FOR v_def IN
      SELECT 
        ps.id AS step_id,
        ps.name,
        ps.relative_day,
        ps.responsible_user_id,
        ps.responsible_role,
        ps.is_required,
        ps.order_index,
        ps.step_type,
        COALESCE(nu.display_name, ps.responsible_role, 'Não atribuído') AS resolved_name,
        COALESCE(nu.email, '') AS resolved_email
      FROM public.neoteam_process_steps ps
      LEFT JOIN public.neohub_users nu ON nu.id = ps.responsible_user_id
      WHERE ps.template_id = v_template_id
      ORDER BY ps.order_index
    LOOP
      IF v_def.relative_day IS NULL THEN
        IF NOT p_include_sale THEN
          CONTINUE;
        END IF;
        v_scheduled := v_today;
      ELSE
        IF p_surgery_date IS NULL THEN
          CONTINUE;
        END IF;
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

  -- ===== FALLBACK PATH: Generate from surgery_task_definitions (legacy) =====
  IF p_include_sale THEN
    DELETE FROM public.surgery_tasks
    WHERE surgery_id = p_surgery_id AND definition_id IS NOT NULL;
  ELSE
    DELETE FROM public.surgery_tasks
    WHERE surgery_id = p_surgery_id AND definition_id IS NOT NULL AND d_offset IS NOT NULL;
  END IF;

  FOR v_def IN
    SELECT * FROM public.surgery_task_definitions
    WHERE is_active = true
    ORDER BY order_index
  LOOP
    IF v_def.d_offset IS NULL THEN
      IF NOT p_include_sale THEN
        CONTINUE;
      END IF;
      v_scheduled := v_today;
    ELSE
      IF p_surgery_date IS NULL THEN
        CONTINUE;
      END IF;
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
