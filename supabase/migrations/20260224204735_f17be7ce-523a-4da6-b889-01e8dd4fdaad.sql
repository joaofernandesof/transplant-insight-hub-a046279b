
-- ===================================================================
-- Trigger: generate protocol tasks for ALL clinic_surgeries
-- ===================================================================

CREATE OR REPLACE FUNCTION public.trigger_clinic_surgery_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Sale phase task is created on insertion (protocol starts immediately)
    PERFORM public.generate_surgery_tasks(NEW.id, NEW.surgery_date, true);
    RETURN NEW;
  END IF;

  -- UPDATE: regenerate D-offset tasks when surgery_date changes (keep sale task)
  IF (OLD.surgery_date IS DISTINCT FROM NEW.surgery_date) THEN
    PERFORM public.generate_surgery_tasks(NEW.id, NEW.surgery_date, false);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinic_surgery_tasks_auto ON public.clinic_surgeries;
CREATE TRIGGER trg_clinic_surgery_tasks_auto
  AFTER INSERT OR UPDATE OF surgery_date
  ON public.clinic_surgeries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_clinic_surgery_tasks();
