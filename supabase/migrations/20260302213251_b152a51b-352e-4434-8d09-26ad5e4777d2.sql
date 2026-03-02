
-- Add new enum values to neohub_profile
ALTER TYPE public.neohub_profile ADD VALUE IF NOT EXISTS 'super_administrador';
ALTER TYPE public.neohub_profile ADD VALUE IF NOT EXISTS 'gerente';
ALTER TYPE public.neohub_profile ADD VALUE IF NOT EXISTS 'coordenador';
ALTER TYPE public.neohub_profile ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.neohub_profile ADD VALUE IF NOT EXISTS 'operador';
ALTER TYPE public.neohub_profile ADD VALUE IF NOT EXISTS 'visualizador';
ALTER TYPE public.neohub_profile ADD VALUE IF NOT EXISTS 'externo';
