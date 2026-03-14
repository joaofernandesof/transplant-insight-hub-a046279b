ALTER TABLE public.kommo_sync_logs 
ADD COLUMN IF NOT EXISTS progress jsonb DEFAULT '{}'::jsonb;