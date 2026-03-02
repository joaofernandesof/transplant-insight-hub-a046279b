
-- Table to store account-level settings like duplicate handling
CREATE TABLE IF NOT EXISTS public.avivar_account_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, setting_key)
);

ALTER TABLE public.avivar_account_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view account settings"
  ON public.avivar_account_settings FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Members can upsert account settings"
  ON public.avivar_account_settings FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Members can update account settings"
  ON public.avivar_account_settings FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE TRIGGER update_avivar_account_settings_updated_at
  BEFORE UPDATE ON public.avivar_account_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
