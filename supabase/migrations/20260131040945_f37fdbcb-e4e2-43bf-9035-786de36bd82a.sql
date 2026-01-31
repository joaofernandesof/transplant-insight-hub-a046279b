-- ===========================================
-- AGENDA INTERNA DO AVIVAR
-- Sistema de agendamento para IA
-- ===========================================

-- 1. Tabela de configuração de agenda por usuário
CREATE TABLE public.avivar_schedule_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_name TEXT NOT NULL,
  consultation_duration INTEGER NOT NULL DEFAULT 30, -- minutos
  buffer_between INTEGER NOT NULL DEFAULT 0, -- minutos entre consultas
  advance_booking_days INTEGER NOT NULL DEFAULT 30, -- quantos dias no futuro pode agendar
  min_advance_hours INTEGER NOT NULL DEFAULT 2, -- mínimo de horas de antecedência
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Horários de funcionamento por dia da semana
CREATE TABLE public.avivar_schedule_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_config_id UUID NOT NULL REFERENCES public.avivar_schedule_config(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Dom, 1=Seg...
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(schedule_config_id, day_of_week)
);

-- 3. Bloqueios de agenda (férias, feriados, etc)
CREATE TABLE public.avivar_schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_config_id UUID NOT NULL REFERENCES public.avivar_schedule_config(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME, -- NULL = dia todo
  end_time TIME,   -- NULL = dia todo
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Agendamentos criados pela IA
CREATE TABLE public.avivar_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.crm_conversations(id) ON DELETE SET NULL,
  
  -- Dados do agendamento
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  
  -- Data e hora
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  -- Metadados
  service_type TEXT,
  notes TEXT,
  created_by TEXT NOT NULL DEFAULT 'ai', -- 'ai' ou 'human'
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_appointments_user_date ON public.avivar_appointments(user_id, appointment_date);
CREATE INDEX idx_appointments_status ON public.avivar_appointments(status);
CREATE INDEX idx_appointments_lead ON public.avivar_appointments(lead_id);
CREATE INDEX idx_schedule_hours_config ON public.avivar_schedule_hours(schedule_config_id);

-- RLS Policies
ALTER TABLE public.avivar_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_schedule_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_appointments ENABLE ROW LEVEL SECURITY;

-- Schedule Config: usuário vê/edita apenas seu próprio
CREATE POLICY "Users manage own schedule config"
  ON public.avivar_schedule_config FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Schedule Hours: segue o config
CREATE POLICY "Users manage own schedule hours"
  ON public.avivar_schedule_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.avivar_schedule_config sc
      WHERE sc.id = schedule_config_id AND sc.user_id = auth.uid()
    )
  );

-- Schedule Blocks: segue o config
CREATE POLICY "Users manage own schedule blocks"
  ON public.avivar_schedule_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.avivar_schedule_config sc
      WHERE sc.id = schedule_config_id AND sc.user_id = auth.uid()
    )
  );

-- Appointments: usuário vê/edita apenas seus agendamentos
CREATE POLICY "Users manage own appointments"
  ON public.avivar_appointments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_avivar_schedule_config_updated_at
  BEFORE UPDATE ON public.avivar_schedule_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avivar_appointments_updated_at
  BEFORE UPDATE ON public.avivar_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para buscar slots disponíveis (usada pela IA)
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_user_id UUID,
  p_date DATE,
  p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
  slot_start TIME,
  slot_end TIME,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_config avivar_schedule_config%ROWTYPE;
  v_hours avivar_schedule_hours%ROWTYPE;
  v_current_time TIME;
  v_slot_end TIME;
BEGIN
  -- Get day of week (0=Sunday)
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;
  
  -- Get schedule config
  SELECT * INTO v_config FROM avivar_schedule_config WHERE user_id = p_user_id;
  IF v_config IS NULL THEN
    RETURN;
  END IF;
  
  -- Get hours for this day
  SELECT * INTO v_hours FROM avivar_schedule_hours 
  WHERE schedule_config_id = v_config.id AND day_of_week = v_day_of_week AND is_enabled = true;
  IF v_hours IS NULL THEN
    RETURN;
  END IF;
  
  -- Generate slots
  v_current_time := v_hours.start_time;
  WHILE v_current_time + (p_duration_minutes || ' minutes')::INTERVAL <= v_hours.end_time LOOP
    v_slot_end := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
    
    -- Check if slot is available (no existing appointment or block)
    RETURN QUERY
    SELECT 
      v_current_time,
      v_slot_end,
      NOT EXISTS (
        -- Check appointments
        SELECT 1 FROM avivar_appointments a
        WHERE a.user_id = p_user_id
          AND a.appointment_date = p_date
          AND a.status NOT IN ('cancelled')
          AND (
            (a.start_time <= v_current_time AND a.end_time > v_current_time)
            OR (a.start_time < v_slot_end AND a.end_time >= v_slot_end)
            OR (a.start_time >= v_current_time AND a.end_time <= v_slot_end)
          )
      )
      AND NOT EXISTS (
        -- Check blocks
        SELECT 1 FROM avivar_schedule_blocks b
        JOIN avivar_schedule_config sc ON sc.id = b.schedule_config_id
        WHERE sc.user_id = p_user_id
          AND b.block_date = p_date
          AND (
            b.start_time IS NULL -- Dia todo bloqueado
            OR (b.start_time <= v_current_time AND b.end_time > v_current_time)
            OR (b.start_time < v_slot_end AND b.end_time >= v_slot_end)
          )
      );
    
    v_current_time := v_current_time + (p_duration_minutes + v_config.buffer_between || ' minutes')::INTERVAL;
  END LOOP;
END;
$$;