-- Add surgery_date column to neohub_users for patient surgery tracking
ALTER TABLE public.neohub_users 
ADD COLUMN IF NOT EXISTS surgery_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.neohub_users.surgery_date IS 'Data da cirurgia do paciente para cálculo de dias pré e pós-operatório';