-- Add validity period columns to proposals
ALTER TABLE public.ipromed_proposals 
ADD COLUMN IF NOT EXISTS validity_days integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;