-- Drop the functional index and create a proper unique constraint
DROP INDEX IF EXISTS idx_campaign_costs_unique;

-- Add proper unique constraint (using empty strings instead of NULLs)
ALTER TABLE public.campaign_costs 
  ALTER COLUMN adset_name SET DEFAULT '',
  ALTER COLUMN ad_name SET DEFAULT '',
  ALTER COLUMN campaign_id SET DEFAULT '';

-- Update existing NULLs
UPDATE public.campaign_costs SET adset_name = '' WHERE adset_name IS NULL;
UPDATE public.campaign_costs SET ad_name = '' WHERE ad_name IS NULL;
UPDATE public.campaign_costs SET campaign_id = '' WHERE campaign_id IS NULL;

-- Now create the unique constraint
ALTER TABLE public.campaign_costs 
  ADD CONSTRAINT campaign_costs_unique_record UNIQUE (platform, campaign_id, adset_name, ad_name, date);