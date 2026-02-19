
-- 1. Tabela de API Tokens
CREATE TABLE public.avivar_api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  token_prefix VARCHAR(10) NOT NULL,
  token_hash TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{"receive_lead"}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.avivar_api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tokens for their account"
ON public.avivar_api_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_account_members am
    WHERE am.account_id = avivar_api_tokens.account_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
      AND am.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.avivar_account_members am
    WHERE am.account_id = avivar_api_tokens.account_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
      AND am.role IN ('owner', 'admin')
  )
);

-- 2. Tabela de Webhooks
CREATE TABLE public.avivar_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.avivar_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage webhooks for their account"
ON public.avivar_webhooks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_account_members am
    WHERE am.account_id = avivar_webhooks.account_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
      AND am.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.avivar_account_members am
    WHERE am.account_id = avivar_webhooks.account_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
      AND am.role IN ('owner', 'admin')
  )
);

-- 3. Tabela de Logs de Webhooks
CREATE TABLE public.avivar_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES public.avivar_webhooks(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.avivar_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook logs for their account"
ON public.avivar_webhook_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_account_members am
    WHERE am.account_id = avivar_webhook_logs.account_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
      AND am.role IN ('owner', 'admin')
  )
);

-- Indexes
CREATE INDEX idx_avivar_api_tokens_account ON public.avivar_api_tokens(account_id);
CREATE INDEX idx_avivar_api_tokens_hash ON public.avivar_api_tokens(token_hash);
CREATE INDEX idx_avivar_webhooks_account ON public.avivar_webhooks(account_id);
CREATE INDEX idx_avivar_webhook_logs_webhook ON public.avivar_webhook_logs(webhook_id);
CREATE INDEX idx_avivar_webhook_logs_created ON public.avivar_webhook_logs(created_at DESC);

-- Function to validate API token (used in edge functions via RPC)
CREATE OR REPLACE FUNCTION public.validate_api_token(p_token_hash TEXT)
RETURNS TABLE(account_id UUID, permissions TEXT[], token_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT t.account_id, t.permissions, t.id as token_id
  FROM public.avivar_api_tokens t
  WHERE t.token_hash = p_token_hash
    AND t.is_active = true
    AND (t.expires_at IS NULL OR t.expires_at > now())
  LIMIT 1;
$$;
