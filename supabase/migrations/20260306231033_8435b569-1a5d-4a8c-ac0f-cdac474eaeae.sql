
-- Financial orders table for NeoAcademy
CREATE TABLE public.neoacademy_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  order_type TEXT NOT NULL DEFAULT 'one_time', -- 'one_time', 'subscription'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded', 'canceled', 'overdue'
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'brl',
  description TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.neoacademy_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON public.neoacademy_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage orders"
  ON public.neoacademy_orders FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE INDEX idx_neoacademy_orders_user ON public.neoacademy_orders(user_id);
CREATE INDEX idx_neoacademy_orders_account ON public.neoacademy_orders(account_id);
CREATE INDEX idx_neoacademy_orders_status ON public.neoacademy_orders(status);

-- Payment links table
CREATE TABLE public.neoacademy_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  stripe_payment_link_id TEXT,
  stripe_price_id TEXT NOT NULL,
  stripe_product_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'brl',
  payment_type TEXT NOT NULL DEFAULT 'one_time', -- 'one_time', 'subscription'
  url TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  course_ids UUID[] DEFAULT '{}',
  profile_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.neoacademy_payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment links"
  ON public.neoacademy_payment_links FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE INDEX idx_neoacademy_payment_links_account ON public.neoacademy_payment_links(account_id);
