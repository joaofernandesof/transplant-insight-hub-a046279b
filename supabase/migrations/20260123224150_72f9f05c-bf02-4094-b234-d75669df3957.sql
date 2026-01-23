-- Add Dr Eder evaluation fields (4th monitor)
ALTER TABLE public.day1_satisfaction_surveys 
ADD COLUMN IF NOT EXISTS q54_eder_m_technical TEXT,
ADD COLUMN IF NOT EXISTS q55_eder_m_interest TEXT,
ADD COLUMN IF NOT EXISTS q56_eder_m_engagement TEXT,
ADD COLUMN IF NOT EXISTS q57_eder_m_posture TEXT,
ADD COLUMN IF NOT EXISTS q58_eder_m_communication TEXT,
ADD COLUMN IF NOT EXISTS q59_eder_m_contribution TEXT,
ADD COLUMN IF NOT EXISTS q60_eder_m_strength TEXT,
ADD COLUMN IF NOT EXISTS q61_eder_m_improve TEXT;