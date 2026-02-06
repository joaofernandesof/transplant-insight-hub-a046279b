
-- Add tags column to leads table (text array for multiple tags)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
