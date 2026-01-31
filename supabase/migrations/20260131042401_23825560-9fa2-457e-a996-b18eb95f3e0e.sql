-- Tabela de agendas (cada profissional/unidade pode ter sua própria agenda)
CREATE TABLE public.avivar_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  professional_name VARCHAR(255),
  city VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  color VARCHAR(20) DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_avivar_agendas_user_id ON public.avivar_agendas(user_id);

-- RLS
ALTER TABLE public.avivar_agendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agendas"
ON public.avivar_agendas FOR SELECT
USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can insert own agendas"
ON public.avivar_agendas FOR INSERT
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own agendas"
ON public.avivar_agendas FOR UPDATE
USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own agendas"
ON public.avivar_agendas FOR DELETE
USING (user_id::text = auth.uid()::text);

-- Adicionar referência de agenda às configurações de horário
ALTER TABLE public.avivar_schedule_config 
ADD COLUMN agenda_id UUID REFERENCES public.avivar_agendas(id) ON DELETE CASCADE;

-- Adicionar campos de localização aos agendamentos
ALTER TABLE public.avivar_appointments 
ADD COLUMN agenda_id UUID REFERENCES public.avivar_agendas(id),
ADD COLUMN location VARCHAR(255),
ADD COLUMN professional_name VARCHAR(255);

-- Função atualizada para buscar slots com suporte a multi-agendas
CREATE OR REPLACE FUNCTION public.get_available_slots_by_agenda(
  p_agenda_id UUID, 
  p_date DATE, 
  p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE(slot_start TIME, slot_end TIME, is_available BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_config avivar_schedule_config%ROWTYPE;
  v_hours avivar_schedule_hours%ROWTYPE;
  v_current_time TIME;
  v_slot_end TIME;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;
  
  SELECT * INTO v_config FROM avivar_schedule_config WHERE agenda_id = p_agenda_id;
  IF v_config IS NULL THEN
    RETURN;
  END IF;
  
  SELECT * INTO v_hours FROM avivar_schedule_hours 
  WHERE schedule_config_id = v_config.id AND day_of_week = v_day_of_week AND is_enabled = true;
  IF v_hours IS NULL THEN
    RETURN;
  END IF;
  
  v_current_time := v_hours.start_time;
  WHILE v_current_time + (p_duration_minutes || ' minutes')::INTERVAL <= v_hours.end_time LOOP
    v_slot_end := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
    
    RETURN QUERY
    SELECT 
      v_current_time,
      v_slot_end,
      NOT EXISTS (
        SELECT 1 FROM avivar_appointments a
        WHERE a.agenda_id = p_agenda_id
          AND a.appointment_date = p_date
          AND a.status NOT IN ('cancelled')
          AND (
            (a.start_time <= v_current_time AND a.end_time > v_current_time)
            OR (a.start_time < v_slot_end AND a.end_time >= v_slot_end)
            OR (a.start_time >= v_current_time AND a.end_time <= v_slot_end)
          )
      )
      AND NOT EXISTS (
        SELECT 1 FROM avivar_schedule_blocks b
        WHERE b.schedule_config_id = v_config.id
          AND b.block_date = p_date
          AND (
            b.start_time IS NULL
            OR (b.start_time <= v_current_time AND b.end_time > v_current_time)
            OR (b.start_time < v_slot_end AND b.end_time >= v_slot_end)
          )
      );
    
    v_current_time := v_current_time + (p_duration_minutes + v_config.buffer_between || ' minutes')::INTERVAL;
  END LOOP;
END;
$$;

-- Função para listar agendas disponíveis para IA
CREATE OR REPLACE FUNCTION public.get_avivar_agendas_for_ai(p_user_id UUID)
RETURNS TABLE(
  agenda_id UUID,
  agenda_name VARCHAR,
  professional_name VARCHAR,
  city VARCHAR,
  address TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, name, professional_name, city, address
  FROM avivar_agendas
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY name;
$$;

-- Trigger para updated_at
CREATE TRIGGER update_avivar_agendas_updated_at
BEFORE UPDATE ON public.avivar_agendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();