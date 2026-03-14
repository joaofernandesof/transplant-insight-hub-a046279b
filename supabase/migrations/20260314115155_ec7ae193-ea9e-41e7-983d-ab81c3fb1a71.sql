
-- Add unique constraint on subdomain for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS idx_kommo_sync_config_subdomain ON public.kommo_sync_config(subdomain);
