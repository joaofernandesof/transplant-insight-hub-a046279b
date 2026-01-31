-- Remove unique constraint to allow multiple periods per day
ALTER TABLE public.avivar_schedule_hours 
DROP CONSTRAINT IF EXISTS avivar_schedule_hours_schedule_config_id_day_of_week_key;