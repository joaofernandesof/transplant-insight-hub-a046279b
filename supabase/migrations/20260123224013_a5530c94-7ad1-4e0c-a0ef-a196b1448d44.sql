-- Add new fields for individual monitor evaluations
-- Monitor 1: Dra Gleyldes (q30-q37 - reusing existing)
-- Monitor 2: Dr Elenilton (q38-q45 - NEW)
-- Monitor 3: Dr Patrick as monitor (q46-q53 - NEW)

-- Dr Elenilton evaluation fields
ALTER TABLE public.day1_satisfaction_surveys 
ADD COLUMN IF NOT EXISTS q38_eder_technical TEXT,
ADD COLUMN IF NOT EXISTS q39_eder_interest TEXT,
ADD COLUMN IF NOT EXISTS q40_eder_engagement TEXT,
ADD COLUMN IF NOT EXISTS q41_eder_posture TEXT,
ADD COLUMN IF NOT EXISTS q42_eder_communication TEXT,
ADD COLUMN IF NOT EXISTS q43_eder_contribution TEXT,
ADD COLUMN IF NOT EXISTS q44_eder_strength TEXT,
ADD COLUMN IF NOT EXISTS q45_eder_improve TEXT;

-- Dr Patrick as monitor evaluation fields
ALTER TABLE public.day1_satisfaction_surveys 
ADD COLUMN IF NOT EXISTS q46_patrick_m_technical TEXT,
ADD COLUMN IF NOT EXISTS q47_patrick_m_interest TEXT,
ADD COLUMN IF NOT EXISTS q48_patrick_m_engagement TEXT,
ADD COLUMN IF NOT EXISTS q49_patrick_m_posture TEXT,
ADD COLUMN IF NOT EXISTS q50_patrick_m_communication TEXT,
ADD COLUMN IF NOT EXISTS q51_patrick_m_contribution TEXT,
ADD COLUMN IF NOT EXISTS q52_patrick_m_strength TEXT,
ADD COLUMN IF NOT EXISTS q53_patrick_m_improve TEXT;