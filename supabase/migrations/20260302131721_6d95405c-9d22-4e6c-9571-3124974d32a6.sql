
-- Custom user-defined variables
CREATE TABLE public.avivar_custom_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  default_value TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, key)
);

ALTER TABLE public.avivar_custom_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account variables"
  ON public.avivar_custom_variables FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM public.avivar_account_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can insert own account variables"
  ON public.avivar_custom_variables FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM public.avivar_account_members
    WHERE user_id = auth.uid() AND is_active = true
  ) AND user_id = auth.uid());

CREATE POLICY "Users can update own account variables"
  ON public.avivar_custom_variables FOR UPDATE
  USING (account_id IN (
    SELECT account_id FROM public.avivar_account_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Users can delete own account variables"
  ON public.avivar_custom_variables FOR DELETE
  USING (account_id IN (
    SELECT account_id FROM public.avivar_account_members
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE TRIGGER update_avivar_custom_variables_updated_at
  BEFORE UPDATE ON public.avivar_custom_variables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
