
-- Table for weekly schedule rotation rules
CREATE TABLE public.weekly_schedule_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cidade TEXT NOT NULL,
  semana_do_mes INTEGER NOT NULL CHECK (semana_do_mes BETWEEN 1 AND 4),
  tipo TEXT NOT NULL CHECK (tipo IN ('consulta', 'transplante', 'retorno')),
  categoria TEXT, -- nullable for consulta type (which uses medico instead)
  medico TEXT, -- nullable for transplante/retorno (which uses categoria instead)
  permitido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cidade, semana_do_mes, tipo, categoria, medico)
);

ALTER TABLE public.weekly_schedule_rules ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage weekly_schedule_rules"
ON public.weekly_schedule_rules
FOR ALL
USING (public.is_neohub_admin(auth.uid()));

-- Authenticated users can read
CREATE POLICY "Authenticated users can read weekly_schedule_rules"
ON public.weekly_schedule_rules
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Log table for blocked attempts
CREATE TABLE public.schedule_block_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cidade TEXT NOT NULL,
  semana_do_mes INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  categoria TEXT,
  medico TEXT,
  surgery_date TEXT NOT NULL,
  blocked_reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_block_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own block logs"
ON public.schedule_block_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read block logs"
ON public.schedule_block_logs
FOR SELECT
USING (public.is_neohub_admin(auth.uid()));

-- Function to calculate week of month
CREATE OR REPLACE FUNCTION public.get_semana_do_mes(p_date DATE)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN EXTRACT(DAY FROM p_date) BETWEEN 1 AND 7 THEN 1
    WHEN EXTRACT(DAY FROM p_date) BETWEEN 8 AND 14 THEN 2
    WHEN EXTRACT(DAY FROM p_date) BETWEEN 15 AND 21 THEN 3
    ELSE 4
  END
$$;

-- Function to validate scheduling against rotation rules
CREATE OR REPLACE FUNCTION public.validate_schedule_rotation(
  p_cidade TEXT,
  p_date DATE,
  p_tipo TEXT,
  p_categoria TEXT DEFAULT NULL,
  p_medico TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_semana INTEGER;
  v_rule RECORD;
  v_result JSONB;
BEGIN
  v_semana := public.get_semana_do_mes(p_date);
  
  -- Find matching rule
  SELECT * INTO v_rule
  FROM public.weekly_schedule_rules
  WHERE cidade = p_cidade
    AND semana_do_mes = v_semana
    AND tipo = p_tipo
    AND (
      (p_tipo = 'consulta' AND medico = p_medico)
      OR (p_tipo IN ('transplante', 'retorno') AND categoria = p_categoria)
    )
  LIMIT 1;
  
  IF v_rule IS NULL THEN
    -- No rule found, allow by default
    RETURN jsonb_build_object(
      'permitido', true,
      'semana_do_mes', v_semana,
      'mensagem', 'Nenhuma regra encontrada para esta combinação.'
    );
  END IF;
  
  IF NOT v_rule.permitido THEN
    RETURN jsonb_build_object(
      'permitido', false,
      'semana_do_mes', v_semana,
      'mensagem', 'Agendamento bloqueado para esta semana nesta unidade conforme matriz de rodízio médico.',
      'cidade', p_cidade,
      'tipo', p_tipo,
      'categoria', p_categoria,
      'medico', p_medico
    );
  END IF;
  
  RETURN jsonb_build_object(
    'permitido', true,
    'semana_do_mes', v_semana,
    'mensagem', 'Agendamento permitido.'
  );
END;
$$;
