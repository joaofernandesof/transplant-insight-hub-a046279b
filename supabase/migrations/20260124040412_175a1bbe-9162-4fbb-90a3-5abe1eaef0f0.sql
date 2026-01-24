-- Add fields for Dra. Gleyldes monitor evaluation (q62-q69)
ALTER TABLE public.day1_satisfaction_surveys 
ADD COLUMN IF NOT EXISTS q62_gleyldes_technical text,
ADD COLUMN IF NOT EXISTS q63_gleyldes_interest text,
ADD COLUMN IF NOT EXISTS q64_gleyldes_engagement text,
ADD COLUMN IF NOT EXISTS q65_gleyldes_posture text,
ADD COLUMN IF NOT EXISTS q66_gleyldes_communication text,
ADD COLUMN IF NOT EXISTS q67_gleyldes_contribution text,
ADD COLUMN IF NOT EXISTS q68_gleyldes_strength text,
ADD COLUMN IF NOT EXISTS q69_gleyldes_improve text;

-- Add fields for Dr. Elenilton monitor evaluation (q70-q77)
ALTER TABLE public.day1_satisfaction_surveys 
ADD COLUMN IF NOT EXISTS q70_elenilton_technical text,
ADD COLUMN IF NOT EXISTS q71_elenilton_interest text,
ADD COLUMN IF NOT EXISTS q72_elenilton_engagement text,
ADD COLUMN IF NOT EXISTS q73_elenilton_posture text,
ADD COLUMN IF NOT EXISTS q74_elenilton_communication text,
ADD COLUMN IF NOT EXISTS q75_elenilton_contribution text,
ADD COLUMN IF NOT EXISTS q76_elenilton_strength text,
ADD COLUMN IF NOT EXISTS q77_elenilton_improve text;