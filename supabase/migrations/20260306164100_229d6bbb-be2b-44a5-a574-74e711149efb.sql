
ALTER TABLE public.neoacademy_partner_coupons
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banner_url TEXT;
