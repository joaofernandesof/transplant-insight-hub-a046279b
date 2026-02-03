-- Add image_gallery column to avivar_agents table
ALTER TABLE public.avivar_agents
ADD COLUMN IF NOT EXISTS image_gallery JSONB DEFAULT '{"before_after":[],"catalog":[],"location":[],"general":[]}';

COMMENT ON COLUMN public.avivar_agents.image_gallery IS 'Galeria de imagens do agente organizada por categoria: before_after (resultados), catalog (serviços), location (localização), general (outras)';