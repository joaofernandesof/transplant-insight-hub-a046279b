-- Remove sensitive API token columns from sentinel_whatsapp_config table
-- These should be stored as environment variables/secrets, not in database

ALTER TABLE public.sentinel_whatsapp_config 
DROP COLUMN IF EXISTS api_token,
DROP COLUMN IF EXISTS instance_url;

-- Remove sensitive WhatsApp columns from neoteam_settings table
ALTER TABLE public.neoteam_settings 
DROP COLUMN IF EXISTS whatsapp_api_token,
DROP COLUMN IF EXISTS whatsapp_instance_url;

-- Add comments explaining the change
COMMENT ON TABLE public.sentinel_whatsapp_config IS 'WhatsApp notification preferences for System Sentinel. API credentials must be configured as environment secrets (WHATSAPP_INSTANCE_URL, WHATSAPP_API_TOKEN).';
COMMENT ON TABLE public.neoteam_settings IS 'NeoTeam settings. WhatsApp credentials must be configured as environment secrets.';