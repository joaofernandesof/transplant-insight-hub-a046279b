
ALTER TABLE public.clinic_surgeries
  ADD COLUMN IF NOT EXISTS upgrade_category text,
  ADD COLUMN IF NOT EXISTS upsell_category text;
