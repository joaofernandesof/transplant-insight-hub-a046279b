-- Add triage and mood columns to waiting room
ALTER TABLE public.neoteam_waiting_room 
ADD COLUMN IF NOT EXISTS triage TEXT DEFAULT 'em_espera' CHECK (triage IN ('em_espera', 'nao_precisa', 'triado', 'urgente')),
ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT 'calmo' CHECK (mood IN ('calmo', 'ansioso', 'irritado', 'tranquilo')),
ADD COLUMN IF NOT EXISTS observations TEXT,
ADD COLUMN IF NOT EXISTS scheduled_time TIME;