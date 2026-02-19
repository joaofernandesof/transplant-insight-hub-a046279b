
-- =============================================
-- AVIVAR DIGITAL FUNNEL AUTOMATIONS ENGINE
-- =============================================

-- Core automations table (rules)
CREATE TABLE public.avivar_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id),
  kanban_id UUID REFERENCES public.avivar_kanbans(id),
  column_id UUID REFERENCES public.avivar_kanban_columns(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Trigger configuration
  trigger_type TEXT NOT NULL,
  -- Examples: lead.created, lead.moved_from, lead.moved_to, lead.won, lead.lost,
  -- lead.field_changed, lead.tag_added, lead.tag_removed, lead.responsible_changed,
  -- message.received, message.sent, conversation.started,
  -- task.created, task.completed, task.overdue,
  -- contact.created, contact.field_changed,
  -- webhook.received, appointment.created, appointment.updated,
  -- lead.value_changed, lead.pipeline_changed
  trigger_config JSONB DEFAULT '{}',
  -- e.g. { "from_column_id": "...", "to_column_id": "...", "field_name": "...", "field_value": "..." }
  
  -- Conditions (nested logic with AND/OR/NOT)
  -- Format: { "logic": "AND", "groups": [ { "field": "...", "operator": "...", "value": "..." }, ... ] }
  conditions JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false,
  execution_order INTEGER DEFAULT 0,
  delay_seconds INTEGER DEFAULT 0,
  
  -- Execution control
  max_executions_per_lead INTEGER, -- null = unlimited
  cooldown_seconds INTEGER DEFAULT 0, -- min time between executions for same lead
  execute_once_per_lead BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Actions for each automation (ordered, support delays between actions)
CREATE TABLE public.avivar_automation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.avivar_automations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  -- Examples: change_stage, change_responsible, create_task, send_message,
  -- trigger_chatbot, add_tag, remove_tag, change_field, create_lead,
  -- create_contact, create_note, dispatch_webhook, execute_integration
  action_config JSONB NOT NULL DEFAULT '{}',
  -- e.g. { "column_id": "...", "message": "...", "tag": "...", "field_name": "...", "field_value": "..." }
  order_index INTEGER DEFAULT 0,
  delay_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Execution history / audit log
CREATE TABLE public.avivar_automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.avivar_automations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL,
  lead_id UUID,
  conversation_id UUID,
  
  trigger_event TEXT NOT NULL,
  trigger_data JSONB,
  
  status TEXT DEFAULT 'pending',
  -- pending, queued, running, completed, failed, cancelled, skipped
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Array of individual action results
  actions_log JSONB DEFAULT '[]',
  -- [ { "action_id": "...", "action_type": "...", "status": "success", "result": {...}, "executed_at": "..." } ]
  
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_avivar_automations_account ON public.avivar_automations(account_id);
CREATE INDEX idx_avivar_automations_kanban ON public.avivar_automations(kanban_id);
CREATE INDEX idx_avivar_automations_column ON public.avivar_automations(column_id);
CREATE INDEX idx_avivar_automations_trigger ON public.avivar_automations(trigger_type);
CREATE INDEX idx_avivar_automations_active ON public.avivar_automations(account_id, is_active) WHERE is_active = true;

CREATE INDEX idx_avivar_automation_actions_automation ON public.avivar_automation_actions(automation_id);

CREATE INDEX idx_avivar_automation_executions_automation ON public.avivar_automation_executions(automation_id);
CREATE INDEX idx_avivar_automation_executions_account ON public.avivar_automation_executions(account_id);
CREATE INDEX idx_avivar_automation_executions_lead ON public.avivar_automation_executions(lead_id);
CREATE INDEX idx_avivar_automation_executions_status ON public.avivar_automation_executions(status) WHERE status IN ('pending', 'queued', 'running');
CREATE INDEX idx_avivar_automation_executions_created ON public.avivar_automation_executions(created_at DESC);

-- Enable RLS
ALTER TABLE public.avivar_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_automation_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: avivar_automations
CREATE POLICY "Avivar automations: select by account"
  ON public.avivar_automations FOR SELECT
  USING (
    account_id IN (
      SELECT am.account_id FROM public.avivar_account_members am
      WHERE am.user_id = auth.uid() AND am.is_active = true
    )
    OR EXISTS (SELECT 1 FROM public.avivar_accounts a WHERE a.id = account_id AND a.owner_user_id = auth.uid())
  );

CREATE POLICY "Avivar automations: insert by account"
  ON public.avivar_automations FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT am.account_id FROM public.avivar_account_members am
      WHERE am.user_id = auth.uid() AND am.is_active = true
    )
    OR EXISTS (SELECT 1 FROM public.avivar_accounts a WHERE a.id = account_id AND a.owner_user_id = auth.uid())
  );

CREATE POLICY "Avivar automations: update by account"
  ON public.avivar_automations FOR UPDATE
  USING (
    account_id IN (
      SELECT am.account_id FROM public.avivar_account_members am
      WHERE am.user_id = auth.uid() AND am.is_active = true
    )
    OR EXISTS (SELECT 1 FROM public.avivar_accounts a WHERE a.id = account_id AND a.owner_user_id = auth.uid())
  );

CREATE POLICY "Avivar automations: delete by account"
  ON public.avivar_automations FOR DELETE
  USING (
    account_id IN (
      SELECT am.account_id FROM public.avivar_account_members am
      WHERE am.user_id = auth.uid() AND am.is_active = true
    )
    OR EXISTS (SELECT 1 FROM public.avivar_accounts a WHERE a.id = account_id AND a.owner_user_id = auth.uid())
  );

-- RLS Policies: avivar_automation_actions (via automation's account)
CREATE POLICY "Avivar automation actions: select via automation"
  ON public.avivar_automation_actions FOR SELECT
  USING (
    automation_id IN (
      SELECT a.id FROM public.avivar_automations a
      WHERE a.account_id IN (
        SELECT am.account_id FROM public.avivar_account_members am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
      OR EXISTS (SELECT 1 FROM public.avivar_accounts acc WHERE acc.id = a.account_id AND acc.owner_user_id = auth.uid())
    )
  );

CREATE POLICY "Avivar automation actions: insert via automation"
  ON public.avivar_automation_actions FOR INSERT
  WITH CHECK (
    automation_id IN (
      SELECT a.id FROM public.avivar_automations a
      WHERE a.account_id IN (
        SELECT am.account_id FROM public.avivar_account_members am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
      OR EXISTS (SELECT 1 FROM public.avivar_accounts acc WHERE acc.id = a.account_id AND acc.owner_user_id = auth.uid())
    )
  );

CREATE POLICY "Avivar automation actions: update via automation"
  ON public.avivar_automation_actions FOR UPDATE
  USING (
    automation_id IN (
      SELECT a.id FROM public.avivar_automations a
      WHERE a.account_id IN (
        SELECT am.account_id FROM public.avivar_account_members am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
      OR EXISTS (SELECT 1 FROM public.avivar_accounts acc WHERE acc.id = a.account_id AND acc.owner_user_id = auth.uid())
    )
  );

CREATE POLICY "Avivar automation actions: delete via automation"
  ON public.avivar_automation_actions FOR DELETE
  USING (
    automation_id IN (
      SELECT a.id FROM public.avivar_automations a
      WHERE a.account_id IN (
        SELECT am.account_id FROM public.avivar_account_members am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
      OR EXISTS (SELECT 1 FROM public.avivar_accounts acc WHERE acc.id = a.account_id AND acc.owner_user_id = auth.uid())
    )
  );

-- RLS Policies: avivar_automation_executions
CREATE POLICY "Avivar automation executions: select by account"
  ON public.avivar_automation_executions FOR SELECT
  USING (
    account_id IN (
      SELECT am.account_id FROM public.avivar_account_members am
      WHERE am.user_id = auth.uid() AND am.is_active = true
    )
    OR EXISTS (SELECT 1 FROM public.avivar_accounts a WHERE a.id = account_id AND a.owner_user_id = auth.uid())
  );

CREATE POLICY "Avivar automation executions: insert by account"
  ON public.avivar_automation_executions FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT am.account_id FROM public.avivar_account_members am
      WHERE am.user_id = auth.uid() AND am.is_active = true
    )
    OR EXISTS (SELECT 1 FROM public.avivar_accounts a WHERE a.id = account_id AND a.owner_user_id = auth.uid())
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_avivar_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_avivar_automations_updated_at
  BEFORE UPDATE ON public.avivar_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_avivar_automations_updated_at();
