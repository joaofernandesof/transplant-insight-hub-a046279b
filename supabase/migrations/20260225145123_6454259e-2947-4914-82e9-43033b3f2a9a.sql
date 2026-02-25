
-- =============================================
-- SCHEDULE WEEK LOCKS - Travas de Agenda por Semana
-- =============================================

-- Main table: one row per (week, branch, doctor)
CREATE TABLE public.schedule_week_locks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  month TEXT NOT NULL,
  branch TEXT NOT NULL,
  doctor TEXT NOT NULL,
  permitido BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(week_number, branch, doctor)
);

-- Index for fast date-range lookups
CREATE INDEX idx_schedule_week_locks_dates ON public.schedule_week_locks (week_start, week_end);
CREATE INDEX idx_schedule_week_locks_branch ON public.schedule_week_locks (branch, doctor);

-- Enable RLS
ALTER TABLE public.schedule_week_locks ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on schedule_week_locks"
  ON public.schedule_week_locks FOR ALL
  USING (public.is_neohub_admin(auth.uid()));

-- Authenticated users can read
CREATE POLICY "Authenticated users can read schedule_week_locks"
  ON public.schedule_week_locks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_schedule_week_locks_updated_at
  BEFORE UPDATE ON public.schedule_week_locks
  FOR EACH ROW EXECUTE FUNCTION public.update_cleaning_updated_at();

-- =============================================
-- Validation RPC: check if a date/branch/doctor combo is allowed
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_schedule_week_lock(
  p_date DATE,
  p_branch TEXT,
  p_doctor TEXT
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_lock RECORD;
BEGIN
  -- Find the week containing this date
  SELECT * INTO v_lock
  FROM public.schedule_week_locks
  WHERE p_date BETWEEN week_start AND week_end
    AND branch = p_branch
    AND doctor = p_doctor
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
      'mensagem', format('Procedimento não autorizado para %s na Semana %s (%s a %s). %s não disponível nesta filial.',
        p_branch, v_lock.week_number, 
        to_char(v_lock.week_start, 'DD/MM'), to_char(v_lock.week_end, 'DD/MM'),
        p_doctor)
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
$$;

-- =============================================
-- Block log table for audit
-- =============================================
CREATE TABLE IF NOT EXISTS public.schedule_week_block_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  branch TEXT NOT NULL,
  doctor TEXT NOT NULL,
  week_number INT NOT NULL,
  surgery_date DATE NOT NULL,
  procedure_type TEXT,
  category TEXT,
  blocked_reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_week_block_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read block logs"
  ON public.schedule_week_block_logs FOR SELECT
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Authenticated can insert block logs"
  ON public.schedule_week_block_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
