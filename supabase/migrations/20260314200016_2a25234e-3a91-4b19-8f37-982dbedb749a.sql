ALTER TABLE public.ads_integration_config DROP CONSTRAINT IF EXISTS ads_integration_config_platform_check;
ALTER TABLE public.ads_integration_config ADD CONSTRAINT ads_integration_config_platform_check CHECK (platform IN ('meta', 'google', 'google_sheets'));

ALTER TABLE public.campaign_costs DROP CONSTRAINT IF EXISTS campaign_costs_platform_campaign_id_adset_name_ad_name_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_costs_unique 
ON public.campaign_costs (platform, campaign_id, COALESCE(adset_name, ''), COALESCE(ad_name, ''), date);