-- Add image fields to avivar_followup_rules
ALTER TABLE public.avivar_followup_rules 
ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_caption TEXT DEFAULT NULL;

COMMENT ON COLUMN public.avivar_followup_rules.image_url IS 'URL da imagem a ser enviada junto com o follow-up';
COMMENT ON COLUMN public.avivar_followup_rules.image_caption IS 'Legenda opcional da imagem';