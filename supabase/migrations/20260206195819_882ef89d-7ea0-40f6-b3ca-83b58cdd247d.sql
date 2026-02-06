-- Add original_value and intermediate_value columns to ipromed_proposals
ALTER TABLE public.ipromed_proposals 
ADD COLUMN IF NOT EXISTS original_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS intermediate_value DECIMAL(10,2) DEFAULT 0;