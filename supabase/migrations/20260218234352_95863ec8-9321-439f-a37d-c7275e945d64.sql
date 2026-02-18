
-- Add rotation-related fields to surgery_schedule
ALTER TABLE public.surgery_schedule
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS medico TEXT,
ADD COLUMN IF NOT EXISTS tipo_agendamento TEXT CHECK (tipo_agendamento IN ('consulta', 'transplante', 'retorno')),
ADD COLUMN IF NOT EXISTS categoria_rodizio TEXT;
