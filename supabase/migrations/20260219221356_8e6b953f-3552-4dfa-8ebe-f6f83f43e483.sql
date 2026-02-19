
-- Table to log all incoming webhook requests for debugging
CREATE TABLE public.avivar_webhook_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.avivar_accounts(id),
  token_id UUID REFERENCES public.avivar_api_tokens(id),
  webhook_slug TEXT,
  method TEXT NOT NULL,
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  lead_id UUID,
  lead_action TEXT, -- 'created' or 'updated' or 'error'
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.avivar_webhook_request_logs ENABLE ROW LEVEL SECURITY;

-- Members of the account can view logs
CREATE POLICY "Account members can view webhook request logs"
ON public.avivar_webhook_request_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_account_members am
    WHERE am.account_id = avivar_webhook_request_logs.account_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.avivar_accounts a
    WHERE a.id = avivar_webhook_request_logs.account_id
      AND a.owner_user_id = auth.uid()
  )
);

-- Index for fast lookups
CREATE INDEX idx_webhook_request_logs_account ON public.avivar_webhook_request_logs(account_id, created_at DESC);
