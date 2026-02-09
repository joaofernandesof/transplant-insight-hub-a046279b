-- Add google_event_id column to track Google Calendar events for rescheduling
ALTER TABLE public.avivar_appointments
ADD COLUMN IF NOT EXISTS google_event_id TEXT;