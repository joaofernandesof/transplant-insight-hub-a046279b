
-- Table for voice call tracking
CREATE TABLE public.avivar_voice_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id),
  user_id UUID NOT NULL,
  lead_id UUID REFERENCES public.avivar_kanban_leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.crm_conversations(id) ON DELETE SET NULL,
  
  -- Vapi fields
  vapi_call_id TEXT,
  vapi_assistant_id TEXT,
  phone_number TEXT NOT NULL,
  lead_name TEXT,
  
  -- Call status
  status TEXT NOT NULL DEFAULT 'queued', -- queued, ringing, in_progress, completed, failed, no_answer, busy
  direction TEXT NOT NULL DEFAULT 'outbound', -- outbound, inbound
  trigger_type TEXT NOT NULL DEFAULT 'manual', -- manual, bulk, automatic
  
  -- Results
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  transcript TEXT,
  transcript_json JSONB,
  summary TEXT,
  sentiment TEXT, -- positive, neutral, negative
  
  -- Qualification
  qualification_answers JSONB, -- { q1: { question, answer, score }, q2: ..., q3: ... }
  qualification_score INTEGER, -- 0-100
  qualification_result TEXT, -- qualified, not_qualified, needs_followup
  
  -- Scheduling
  meeting_scheduled BOOLEAN DEFAULT false,
  meeting_date TIMESTAMPTZ,
  meeting_notes TEXT,
  
  -- Kanban automation
  moved_to_column_id UUID,
  
  -- Cost
  cost_cents INTEGER,
  
  -- Error
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Voice agent configuration per account
CREATE TABLE public.avivar_voice_agent_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id),
  user_id UUID NOT NULL,
  
  -- Assistant config
  name TEXT NOT NULL DEFAULT 'Agente de Vendas',
  vapi_assistant_id TEXT,
  vapi_phone_number_id TEXT,
  
  -- Voice settings
  voice_provider TEXT NOT NULL DEFAULT 'elevenlabs',
  voice_id TEXT NOT NULL DEFAULT 'pFZP5JQG7iQjIQuC4Bku', -- Lily (Brazilian Portuguese)
  language TEXT NOT NULL DEFAULT 'pt-BR',
  
  -- Script
  greeting_template TEXT NOT NULL DEFAULT 'Olá, {{lead_name}}! Aqui é {{agent_name}} da {{company_name}}. Tudo bem?',
  company_name TEXT,
  agent_name TEXT,
  
  -- Qualification questions (configurable)
  qualification_questions JSONB NOT NULL DEFAULT '[
    {"id": "q1", "question": "Você está buscando esse tipo de serviço para você mesmo(a)?", "type": "open"},
    {"id": "q2", "question": "Qual é o seu principal objetivo ou preocupação?", "type": "open"},
    {"id": "q3", "question": "Você tem disponibilidade para uma consulta essa semana?", "type": "open"}
  ]'::jsonb,
  
  -- Automation
  auto_trigger_enabled BOOLEAN DEFAULT false,
  auto_trigger_column_ids TEXT[],
  auto_schedule_on_qualified BOOLEAN DEFAULT true,
  move_to_column_on_qualified TEXT,
  move_to_column_on_not_qualified TEXT,
  
  -- Limits
  max_concurrent_calls INTEGER DEFAULT 1,
  max_daily_calls INTEGER DEFAULT 50,
  calls_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  
  -- Business hours
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '18:00',
  excluded_days INTEGER[] DEFAULT '{0,6}', -- Sunday, Saturday
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(account_id)
);

-- Indexes
CREATE INDEX idx_voice_calls_account ON public.avivar_voice_calls(account_id);
CREATE INDEX idx_voice_calls_status ON public.avivar_voice_calls(status);
CREATE INDEX idx_voice_calls_lead ON public.avivar_voice_calls(lead_id);
CREATE INDEX idx_voice_calls_vapi ON public.avivar_voice_calls(vapi_call_id);

-- RLS
ALTER TABLE public.avivar_voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_voice_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voice calls accessible by account members"
ON public.avivar_voice_calls FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.avivar_account_members am
    WHERE am.account_id = avivar_voice_calls.account_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
  )
);

CREATE POLICY "Voice config accessible by account members"
ON public.avivar_voice_agent_config FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.avivar_account_members am
    WHERE am.account_id = avivar_voice_agent_config.account_id
      AND am.user_id = auth.uid()
      AND am.is_active = true
  )
);

-- Realtime for call status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_voice_calls;

-- Updated_at trigger
CREATE TRIGGER update_voice_calls_updated_at
  BEFORE UPDATE ON public.avivar_voice_calls
  FOR EACH ROW EXECUTE FUNCTION public.update_followup_updated_at();

CREATE TRIGGER update_voice_config_updated_at
  BEFORE UPDATE ON public.avivar_voice_agent_config
  FOR EACH ROW EXECUTE FUNCTION public.update_followup_updated_at();
