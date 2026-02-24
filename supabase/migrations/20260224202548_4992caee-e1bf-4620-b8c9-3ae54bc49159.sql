
-- ===================================================================
-- ALIGN SURGERY TASKS WITH clinic_surgeries (Agenda Cirúrgica)
-- ===================================================================

-- 1) Point surgery_tasks.surgery_id to clinic_surgeries
ALTER TABLE public.surgery_tasks
  DROP CONSTRAINT IF EXISTS surgery_tasks_surgery_id_fkey;

ALTER TABLE public.surgery_tasks
  ADD CONSTRAINT surgery_tasks_surgery_id_fkey
  FOREIGN KEY (surgery_id)
  REFERENCES public.clinic_surgeries(id)
  ON DELETE CASCADE;

-- 2) Replace trigger from surgery_schedule to clinic_surgeries
DROP TRIGGER IF EXISTS trg_surgery_tasks_auto ON public.surgery_schedule;
DROP FUNCTION IF EXISTS public.trigger_surgery_tasks_on_date();

CREATE OR REPLACE FUNCTION public.trigger_clinic_surgery_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_is_transplant BOOLEAN;
  v_old_is_transplant BOOLEAN;
  v_include_sale BOOLEAN;
BEGIN
  v_is_transplant := (NEW.procedure IS NOT NULL AND lower(NEW.procedure) LIKE '%transplante%');
  v_old_is_transplant := (OLD.procedure IS NOT NULL AND lower(OLD.procedure) LIKE '%transplante%');

  -- If procedure was transplant and now isn't, remove auto tasks
  IF TG_OP = 'UPDATE' AND v_old_is_transplant AND NOT v_is_transplant THEN
    DELETE FROM public.surgery_tasks WHERE surgery_id = NEW.id AND definition_id IS NOT NULL;
    RETURN NEW;
  END IF;

  IF NOT v_is_transplant THEN
    RETURN NEW;
  END IF;

  v_include_sale := (
    (TG_OP = 'INSERT' AND NEW.sale_id IS NOT NULL)
    OR (TG_OP = 'UPDATE' AND OLD.sale_id IS NULL AND NEW.sale_id IS NOT NULL)
  );

  IF TG_OP = 'INSERT' THEN
    IF NEW.surgery_date IS NOT NULL OR NEW.sale_id IS NOT NULL THEN
      PERFORM public.generate_surgery_tasks(NEW.id, NEW.surgery_date, v_include_sale);
    END IF;
  ELSE
    IF (OLD.surgery_date IS DISTINCT FROM NEW.surgery_date)
      OR (OLD.sale_id IS NULL AND NEW.sale_id IS NOT NULL)
      OR (NOT v_old_is_transplant AND v_is_transplant)
    THEN
      PERFORM public.generate_surgery_tasks(NEW.id, NEW.surgery_date, v_include_sale);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinic_surgery_tasks_auto ON public.clinic_surgeries;
CREATE TRIGGER trg_clinic_surgery_tasks_auto
  AFTER INSERT OR UPDATE OF surgery_date, sale_id, procedure
  ON public.clinic_surgeries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_clinic_surgery_tasks();

-- 3) Make task generation accept null date (sale-only) + use BRT date comparisons
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
BEGIN
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

-- 4) Daily status updater uses BRT date
CREATE OR REPLACE FUNCTION public.update_surgery_task_statuses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated INTEGER := 0;
  v_today DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  UPDATE public.surgery_tasks
  SET status = 'overdue', updated_at = now()
  WHERE status IN ('pending', 'active')
    AND scheduled_date < v_today;
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  UPDATE public.surgery_tasks
  SET status = 'active', updated_at = now()
  WHERE status = 'pending'
    AND scheduled_date = v_today;

  RETURN v_updated;
END;
$$;

-- 5) Tighten definition SELECT policy
DROP POLICY IF EXISTS "Authenticated can view task definitions" ON public.surgery_task_definitions;

CREATE POLICY "Staff can view task definitions"
  ON public.surgery_task_definitions
  FOR SELECT
  TO authenticated
  USING (
    public.is_neohub_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND is_active = true)
  );
