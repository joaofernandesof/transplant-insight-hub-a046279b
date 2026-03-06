CREATE TABLE public.neoacademy_partner_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  partner_logo_url TEXT,
  description TEXT,
  coupon_code TEXT NOT NULL,
  discount_label TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  valid_until TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.neoacademy_partner_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active coupons"
  ON public.neoacademy_partner_coupons FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all coupons"
  ON public.neoacademy_partner_coupons FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );