
-- Add latitude/longitude to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add latitude/longitude to neohub_users
ALTER TABLE public.neohub_users 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add admin setting for hotleads radius (default 100km)
INSERT INTO public.admin_settings (key, value, description)
VALUES ('hotleads_radius_km', '100', 'Raio em km para visibilidade de leads no HotLeads')
ON CONFLICT (key) DO NOTHING;

-- Create index for geographic queries on leads
CREATE INDEX IF NOT EXISTS idx_leads_coordinates ON public.leads (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for geographic queries on neohub_users
CREATE INDEX IF NOT EXISTS idx_neohub_users_coordinates ON public.neohub_users (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
