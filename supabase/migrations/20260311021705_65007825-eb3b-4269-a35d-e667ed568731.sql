
-- Enum types for sales calls
CREATE TYPE public.sales_call_status AS ENUM ('fechou', 'followup', 'perdido');
CREATE TYPE public.sales_call_fonte AS ENUM ('whatsapp', 'zoom', 'meet', 'telefone', 'presencial');
CREATE TYPE public.call_classificacao_lead AS ENUM ('frio', 'morno', 'quente');
CREATE TYPE public.call_urgencia AS ENUM ('baixa', 'media', 'alta');

-- Table: sales_calls
CREATE TABLE public.sales_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  closer_id UUID NOT NULL,
  closer_name TEXT,
  lead_nome TEXT NOT NULL,
  produto TEXT,
  data_call TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status_call public.sales_call_status NOT NULL DEFAULT 'followup',
  transcricao TEXT,
  resumo_manual TEXT,
  fonte_call public.sales_call_fonte DEFAULT 'telefone',
  has_analysis BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: call_analysis
CREATE TABLE public.call_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES public.sales_calls(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  resumo_call TEXT,
  perfil_lead TEXT,
  objecoes TEXT,
  pontos_fracos_closer TEXT,
  pontos_fortes_closer TEXT,
  bant_budget INTEGER DEFAULT 0,
  bant_authority INTEGER DEFAULT 0,
  bant_need INTEGER DEFAULT 0,
  bant_timeline INTEGER DEFAULT 0,
  bant_total INTEGER DEFAULT 0,
  classificacao_lead public.call_classificacao_lead DEFAULT 'morno',
  urgencia public.call_urgencia DEFAULT 'media',
  dor_principal TEXT,
  motivo_nao_fechamento TEXT,
  estrategia_followup TEXT,
  acoes_realizadas TEXT,
  proximos_passos TEXT,
  conclusao TEXT,
  whatsapp_report TEXT,
  probabilidade_fechamento INTEGER DEFAULT 0,
  ai_model TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_calls
CREATE POLICY "Users can view sales calls from their account"
  ON public.sales_calls FOR SELECT TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert sales calls for their account"
  ON public.sales_calls FOR INSERT TO authenticated
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update sales calls from their account"
  ON public.sales_calls FOR UPDATE TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete sales calls from their account"
  ON public.sales_calls FOR DELETE TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- RLS policies for call_analysis
CREATE POLICY "Users can view call analyses from their account"
  ON public.call_analysis FOR SELECT TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert call analyses for their account"
  ON public.call_analysis FOR INSERT TO authenticated
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update call analyses from their account"
  ON public.call_analysis FOR UPDATE TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_analysis;

-- Index for performance
CREATE INDEX idx_sales_calls_account ON public.sales_calls(account_id);
CREATE INDEX idx_sales_calls_closer ON public.sales_calls(closer_id);
CREATE INDEX idx_call_analysis_call ON public.call_analysis(call_id);
CREATE INDEX idx_call_analysis_account ON public.call_analysis(account_id);
