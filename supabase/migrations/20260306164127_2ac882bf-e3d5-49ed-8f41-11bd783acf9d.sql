
CREATE TABLE public.neoacademy_partner_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.neoacademy_partner_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active banners" ON public.neoacademy_partner_banners
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage banners" ON public.neoacademy_partner_banners
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.neoacademy_account_members m
      WHERE m.account_id = neoacademy_partner_banners.account_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
      AND m.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_users nu
      JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id
      WHERE nu.user_id = auth.uid()
      AND nup.profile = 'administrador'
      AND nup.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.neoacademy_account_members m
      WHERE m.account_id = neoacademy_partner_banners.account_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
      AND m.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_users nu
      JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id
      WHERE nu.user_id = auth.uid()
      AND nup.profile = 'administrador'
      AND nup.is_active = true
    )
  );
