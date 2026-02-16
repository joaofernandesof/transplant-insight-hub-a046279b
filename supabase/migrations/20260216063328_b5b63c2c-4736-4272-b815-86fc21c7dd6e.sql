
-- Table for AI call analyses (SPIN Selling methodology)
CREATE TABLE public.avivar_call_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  call_id UUID NOT NULL REFERENCES public.avivar_voice_calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- SPIN Analysis
  spin_situation JSONB DEFAULT '[]'::jsonb,
  spin_problem JSONB DEFAULT '[]'::jsonb,
  spin_implication JSONB DEFAULT '[]'::jsonb,
  spin_need JSONB DEFAULT '[]'::jsonb,
  spin_score INTEGER DEFAULT 0,
  spin_missing TEXT[] DEFAULT '{}',
  spin_suggested_questions TEXT[] DEFAULT '{}',
  
  -- Commercial Analysis
  objections JSONB DEFAULT '[]'::jsonb,
  dominant_pain TEXT,
  emotional_trigger TEXT,
  urgency_level TEXT DEFAULT 'medium',
  close_probability INTEGER DEFAULT 0,
  temperature TEXT DEFAULT 'cold',
  
  -- Key Info Extracted
  interest_area TEXT,
  discussed_value TEXT,
  barriers TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  
  -- Follow-up Strategy
  followup_script TEXT,
  followup_whatsapp_message TEXT,
  followup_timing TEXT,
  followup_arguments TEXT[] DEFAULT '{}',
  next_action TEXT,
  
  -- Summary
  executive_summary TEXT,
  meeting_notes TEXT,
  
  -- CRM Actions
  suggested_stage TEXT,
  crm_fields_updated JSONB DEFAULT '{}'::jsonb,
  auto_applied BOOLEAN DEFAULT false,
  
  -- Meta
  ai_model TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_call_analyses_account ON public.avivar_call_analyses(account_id);
CREATE INDEX idx_call_analyses_call ON public.avivar_call_analyses(call_id);
CREATE UNIQUE INDEX idx_call_analyses_call_unique ON public.avivar_call_analyses(call_id);

-- Enable RLS
ALTER TABLE public.avivar_call_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view analyses for their account"
  ON public.avivar_call_analyses FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert analyses for their account"
  ON public.avivar_call_analyses FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update analyses for their account"
  ON public.avivar_call_analyses FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Allow edge functions with service role
CREATE POLICY "Service role full access on call analyses"
  ON public.avivar_call_analyses FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_call_analyses;

-- Update trigger
CREATE TRIGGER update_call_analyses_updated_at
  BEFORE UPDATE ON public.avivar_call_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
