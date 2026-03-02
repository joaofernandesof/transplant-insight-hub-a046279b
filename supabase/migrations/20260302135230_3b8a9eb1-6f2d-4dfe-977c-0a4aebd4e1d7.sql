
-- Tabela de logs de leads duplicados mesclados
CREATE TABLE public.avivar_duplicate_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  existing_lead_id UUID NOT NULL,
  existing_lead_name TEXT NOT NULL,
  incoming_lead_name TEXT,
  incoming_phone TEXT,
  incoming_email TEXT,
  match_field TEXT NOT NULL, -- 'phone', 'email'
  action TEXT NOT NULL DEFAULT 'merge', -- 'merge', 'block', 'allow_tagged'
  merged_fields JSONB, -- quais campos foram atualizados
  task_id UUID REFERENCES public.lead_tasks(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avivar_duplicate_logs ENABLE ROW LEVEL SECURITY;

-- Policies: apenas membros da mesma conta podem ver/inserir
CREATE POLICY "Account members can view duplicate logs"
  ON public.avivar_duplicate_logs FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Account members can insert duplicate logs"
  ON public.avivar_duplicate_logs FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Index for fast lookups
CREATE INDEX idx_avivar_duplicate_logs_account ON public.avivar_duplicate_logs(account_id, created_at DESC);
CREATE INDEX idx_avivar_duplicate_logs_lead ON public.avivar_duplicate_logs(existing_lead_id);
