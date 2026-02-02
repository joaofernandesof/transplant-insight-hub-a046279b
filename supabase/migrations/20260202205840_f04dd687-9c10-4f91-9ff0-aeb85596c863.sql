-- Drop the existing unique constraint on user_id only
ALTER TABLE public.avivar_schedule_config 
DROP CONSTRAINT IF EXISTS avivar_schedule_config_user_id_key;

-- Add a new unique constraint on (user_id, agenda_id) to allow multiple configs per user
-- We need to handle NULL agenda_id values properly, so we use a unique index instead
CREATE UNIQUE INDEX IF NOT EXISTS avivar_schedule_config_user_agenda_unique 
ON public.avivar_schedule_config (user_id, COALESCE(agenda_id, '00000000-0000-0000-0000-000000000000'));