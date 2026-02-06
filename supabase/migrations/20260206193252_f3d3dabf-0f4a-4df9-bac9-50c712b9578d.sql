ALTER TABLE public.lead_release_daily
ADD COLUMN IF NOT EXISTS last_released_at TIMESTAMP WITH TIME ZONE;