-- ====================================
-- IPROMED Journey Tracking System - Tabelas Complementares
-- ====================================

-- Tabela de entregáveis da jornada (se não existir)
CREATE TABLE IF NOT EXISTS public.ipromed_journey_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  phase VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de progresso do cliente na jornada (se não existir)
CREATE TABLE IF NOT EXISTS public.ipromed_client_journey (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  deliverable_id UUID NOT NULL REFERENCES public.ipromed_journey_deliverables(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, deliverable_id)
);

-- Tabela de scoring de risco do cliente (se não existir)
CREATE TABLE IF NOT EXISTS public.ipromed_client_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE UNIQUE,
  crm_score INTEGER DEFAULT 0 CHECK (crm_score >= 0 AND crm_score <= 100),
  civel_score INTEGER DEFAULT 0 CHECK (civel_score >= 0 AND civel_score <= 100),
  criminal_score INTEGER DEFAULT 0 CHECK (criminal_score >= 0 AND criminal_score <= 100),
  total_score INTEGER GENERATED ALWAYS AS (
    (crm_score * 40 + civel_score * 35 + criminal_score * 25) / 100
  ) STORED,
  risk_level VARCHAR(10) GENERATED ALWAYS AS (
    CASE 
      WHEN (crm_score * 40 + civel_score * 35 + criminal_score * 25) / 100 >= 70 THEN 'high'
      WHEN (crm_score * 40 + civel_score * 35 + criminal_score * 25) / 100 >= 40 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  crm_factors JSONB DEFAULT '[]'::jsonb,
  civel_factors JSONB DEFAULT '[]'::jsonb,
  criminal_factors JSONB DEFAULT '[]'::jsonb,
  last_assessed_at TIMESTAMPTZ,
  assessed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de documentos gerados (se não existir)
CREATE TABLE IF NOT EXISTS public.ipromed_generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.ipromed_document_templates(id),
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.ipromed_contracts(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  variables_used JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'draft',
  generated_by UUID REFERENCES auth.users(id),
  storage_path VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ipromed_journey_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_client_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_client_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_generated_documents ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins and ipromed users can read journey deliverables" ON public.ipromed_journey_deliverables;
CREATE POLICY "Admins and ipromed users can read journey deliverables"
  ON public.ipromed_journey_deliverables FOR SELECT TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Admins can manage journey deliverables" ON public.ipromed_journey_deliverables;
CREATE POLICY "Admins can manage journey deliverables"
  ON public.ipromed_journey_deliverables FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins and ipromed users can read client journey" ON public.ipromed_client_journey;
CREATE POLICY "Admins and ipromed users can read client journey"
  ON public.ipromed_client_journey FOR SELECT TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Admins and ipromed users can manage client journey" ON public.ipromed_client_journey;
CREATE POLICY "Admins and ipromed users can manage client journey"
  ON public.ipromed_client_journey FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'))
  WITH CHECK (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Admins and ipromed users can read risk scores" ON public.ipromed_client_risk_scores;
CREATE POLICY "Admins and ipromed users can read risk scores"
  ON public.ipromed_client_risk_scores FOR SELECT TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Admins and ipromed users can manage risk scores" ON public.ipromed_client_risk_scores;
CREATE POLICY "Admins and ipromed users can manage risk scores"
  ON public.ipromed_client_risk_scores FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'))
  WITH CHECK (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Admins and ipromed users can read generated documents" ON public.ipromed_generated_documents;
CREATE POLICY "Admins and ipromed users can read generated documents"
  ON public.ipromed_generated_documents FOR SELECT TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

DROP POLICY IF EXISTS "Admins and ipromed users can manage generated documents" ON public.ipromed_generated_documents;
CREATE POLICY "Admins and ipromed users can manage generated documents"
  ON public.ipromed_generated_documents FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'))
  WITH CHECK (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'ipromed'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_ipromed_client_journey_client ON public.ipromed_client_journey(client_id);
CREATE INDEX IF NOT EXISTS idx_ipromed_client_journey_status ON public.ipromed_client_journey(status);
CREATE INDEX IF NOT EXISTS idx_ipromed_risk_scores_client ON public.ipromed_client_risk_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_ipromed_generated_docs_client ON public.ipromed_generated_documents(client_id);