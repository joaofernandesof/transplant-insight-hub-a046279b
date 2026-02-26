
-- Add allowed_nichos column to avivar_accounts
ALTER TABLE public.avivar_accounts 
ADD COLUMN allowed_nichos text[] NOT NULL DEFAULT ARRAY['saude'];

-- Set Karine's account to only allow imobiliario
UPDATE public.avivar_accounts 
SET allowed_nichos = ARRAY['imobiliario']
WHERE slug = 'karine-mendes';
