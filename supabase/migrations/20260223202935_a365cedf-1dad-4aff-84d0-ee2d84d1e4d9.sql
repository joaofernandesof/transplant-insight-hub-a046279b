
-- Add missing columns to clinic_surgeries to match the real spreadsheet
ALTER TABLE public.clinic_surgeries
  ADD COLUMN IF NOT EXISTS medical_record text,
  ADD COLUMN IF NOT EXISTS trichotomy_datetime text,
  ADD COLUMN IF NOT EXISTS guides_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_year text,
  ADD COLUMN IF NOT EXISTS is_juazeiro boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS d20_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS d15_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS d10_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS d7_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS d2_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS d1_contact boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS patient_name text;

-- Add medical_record to clinic_patients
ALTER TABLE public.clinic_patients
  ADD COLUMN IF NOT EXISTS medical_record text;

-- Add VGV to clinic_surgeries for tracking initial value
ALTER TABLE public.clinic_surgeries
  ADD COLUMN IF NOT EXISTS vgv numeric;
