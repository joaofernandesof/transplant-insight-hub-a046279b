
CREATE TABLE public.task_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id TEXT NOT NULL,
  task_id UUID,
  task_title TEXT NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'completed', 'restored', 'deleted'
  changes JSONB,
  performed_by TEXT,
  performed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account's task logs"
  ON public.task_activity_log FOR SELECT
  USING (
    account_id IN (
      SELECT account_id::text FROM public.avivar_account_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert task logs for their account"
  ON public.task_activity_log FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id::text FROM public.avivar_account_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_task_activity_log_account ON public.task_activity_log(account_id);
CREATE INDEX idx_task_activity_log_created ON public.task_activity_log(created_at DESC);
