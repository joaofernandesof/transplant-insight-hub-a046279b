
-- Add Google Calendar integration fields to avivar_agendas
ALTER TABLE public.avivar_agendas
  ADD COLUMN google_calendar_id text,
  ADD COLUMN google_refresh_token text,
  ADD COLUMN google_access_token text,
  ADD COLUMN google_token_expires_at timestamp with time zone,
  ADD COLUMN google_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN google_connected_at timestamp with time zone,
  ADD COLUMN google_calendar_name text;
