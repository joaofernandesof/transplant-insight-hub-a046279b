-- Add new profile fields for personal and clinic social media/services
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instagram_personal text,
ADD COLUMN IF NOT EXISTS whatsapp_personal text,
ADD COLUMN IF NOT EXISTS instagram_clinic text,
ADD COLUMN IF NOT EXISTS whatsapp_clinic text,
ADD COLUMN IF NOT EXISTS clinic_logo_url text,
ADD COLUMN IF NOT EXISTS services text[] DEFAULT '{}'::text[];