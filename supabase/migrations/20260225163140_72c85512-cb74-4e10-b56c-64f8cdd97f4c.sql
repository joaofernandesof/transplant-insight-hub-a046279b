
-- First drop the old unique constraint
ALTER TABLE public.schedule_week_locks DROP CONSTRAINT IF EXISTS schedule_week_locks_week_number_branch_doctor_key;

-- Add agenda column
ALTER TABLE public.schedule_week_locks 
ADD COLUMN IF NOT EXISTS agenda text NOT NULL DEFAULT 'Agenda Cirúrgica';

-- Duplicate existing rows for "Agenda de Consultas"
INSERT INTO public.schedule_week_locks (week_number, week_start, week_end, month, branch, doctor, permitido, agenda)
SELECT week_number, week_start, week_end, month, branch, doctor, true, 'Agenda de Consultas'
FROM public.schedule_week_locks
WHERE agenda = 'Agenda Cirúrgica';

-- Add new unique constraint including agenda
ALTER TABLE public.schedule_week_locks 
ADD CONSTRAINT unique_week_branch_doctor_agenda UNIQUE (week_number, branch, doctor, agenda);

-- Update the RPC to accept agenda parameter
CREATE OR REPLACE FUNCTION public.validate_schedule_week_lock(p_date text, p_branch text, p_doctor text, p_agenda text DEFAULT 'Agenda Cirúrgica')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lock RECORD;
BEGIN
  SELECT * INTO v_lock
  FROM public.schedule_week_locks
  WHERE p_date BETWEEN week_start AND week_end
    AND branch = p_branch
    AND doctor = p_doctor
    AND agenda = p_agenda
  LIMIT 1;

  IF v_lock IS NULL THEN
    RETURN jsonb_build_object(
      'permitido', true,
      'week_number', 0,
      'mensagem', 'Sem configuração de trava para esta semana.'
    );
  END IF;

  IF NOT v_lock.permitido THEN
    RETURN jsonb_build_object(
      'permitido', false,
      'week_number', v_lock.week_number,
      'week_start', v_lock.week_start,
      'week_end', v_lock.week_end,
      'mensagem', format('Procedimento não autorizado para %s na Semana %s (%s a %s). %s não disponível nesta filial para %s.',
        p_branch, v_lock.week_number, 
        to_char(v_lock.week_start::date, 'DD/MM'), to_char(v_lock.week_end::date, 'DD/MM'),
        p_doctor, p_agenda)
    );
  END IF;

  RETURN jsonb_build_object(
    'permitido', true,
    'week_number', v_lock.week_number,
    'week_start', v_lock.week_start,
    'week_end', v_lock.week_end,
    'mensagem', 'Permitido.'
  );
END;
$function$;
