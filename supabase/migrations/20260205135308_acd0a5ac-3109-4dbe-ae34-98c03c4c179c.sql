-- Add video fields to followup rules
ALTER TABLE public.avivar_followup_rules
ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_caption TEXT DEFAULT NULL;