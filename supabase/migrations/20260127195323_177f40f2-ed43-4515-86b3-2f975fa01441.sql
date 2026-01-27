-- =============================================
-- IPROMED LEGAL HUB - Complete Schema
-- =============================================

-- Enum for legal case status
CREATE TYPE public.legal_case_status AS ENUM (
  'active', 'pending', 'closed', 'archived', 'suspended'
);

-- Enum for contract status
CREATE TYPE public.contract_status_type AS ENUM (
  'draft', 'pending_review', 'pending_approval', 'pending_signature', 
  'signed', 'active', 'expired', 'cancelled', 'terminated'
);

-- Enum for legal request type
CREATE TYPE public.legal_request_type AS ENUM (
  'contract', 'opinion', 'question', 'follow_up', 'complaint', 'consultation'
);

-- Enum for customer journey stage
CREATE TYPE public.customer_journey_stage AS ENUM (
  'prospect', 'onboarding', 'retention', 'expansion', 'advocacy'
);

-- Enum for risk level
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- =============================================
-- 1. LEGAL CLIENTS (Clientes Jurídicos)
-- =============================================
CREATE TABLE public.ipromed_legal_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  cpf_cnpj VARCHAR(20),
  client_type VARCHAR(50) DEFAULT 'individual', -- individual, company
  status VARCHAR(50) DEFAULT 'active', -- active, prospect, churned
  risk_level risk_level DEFAULT 'low',
  journey_stage customer_journey_stage DEFAULT 'prospect',
  health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  responsible_lawyer_id UUID,
  notes TEXT,
  address JSONB,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 2. LEGAL CASES (Processos Contenciosos)
-- =============================================
CREATE TABLE public.ipromed_legal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(100) UNIQUE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE SET NULL,
  status legal_case_status DEFAULT 'active',
  case_type VARCHAR(100), -- civil, trabalhista, médico, etc.
  court VARCHAR(255),
  judge VARCHAR(255),
  risk_level risk_level DEFAULT 'medium',
  estimated_value DECIMAL(15, 2),
  financial_provision DECIMAL(15, 2),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  responsible_lawyer_id UUID,
  next_deadline TIMESTAMP WITH TIME ZONE,
  filing_date DATE,
  closing_date DATE,
  outcome VARCHAR(255),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 3. CASE EVENTS (Andamentos Processuais)
-- =============================================
CREATE TABLE public.ipromed_case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE CASCADE NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  is_deadline BOOLEAN DEFAULT false,
  deadline_date TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 4. CONTRACTS (Contratos)
-- =============================================
CREATE TABLE public.ipromed_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(100) UNIQUE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE SET NULL,
  contract_type VARCHAR(100), -- prestacao_servico, parceria, locacao, etc.
  status contract_status_type DEFAULT 'draft',
  value DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'BRL',
  start_date DATE,
  end_date DATE,
  renewal_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  notice_period_days INTEGER DEFAULT 30,
  department VARCHAR(100),
  area VARCHAR(100),
  responsible_id UUID,
  signers JSONB DEFAULT '[]', -- Array of signer objects
  clicksign_document_key VARCHAR(255),
  clicksign_status VARCHAR(50),
  signed_at TIMESTAMP WITH TIME ZONE,
  document_url TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 5. LEGAL REQUESTS (Solicitações Internas)
-- =============================================
CREATE TABLE public.ipromed_legal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE,
  request_type legal_request_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  requester_id UUID REFERENCES auth.users(id),
  requester_name VARCHAR(255),
  requester_department VARCHAR(100),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  assigned_to UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  response TEXT,
  sla_hours INTEGER DEFAULT 48,
  is_within_sla BOOLEAN DEFAULT true,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 6. LEGAL TASKS (Tarefas)
-- =============================================
CREATE TABLE public.ipromed_legal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  task_type VARCHAR(100),
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.ipromed_contracts(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.ipromed_legal_requests(id) ON DELETE SET NULL,
  assigned_to UUID,
  assigned_to_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, review, done
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(5, 2),
  actual_hours DECIMAL(5, 2),
  tags TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 7. LEGAL DOCUMENTS
-- =============================================
CREATE TABLE public.ipromed_legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.ipromed_contracts(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.ipromed_legal_requests(id) ON DELETE SET NULL,
  document_type VARCHAR(100), -- peticao, contrato, parecer, etc.
  version INTEGER DEFAULT 1,
  is_template BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 8. LEGAL ACTIVITY LOG
-- =============================================
CREATE TABLE public.ipromed_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- case, contract, request, task
  entity_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- 9. LEGAL TEAM MEMBERS
-- =============================================
CREATE TABLE public.ipromed_legal_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(100), -- advogado, estagiario, paralegal, gestor
  specialization VARCHAR(255),
  oab_number VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_legal_clients_status ON public.ipromed_legal_clients(status);
CREATE INDEX idx_legal_clients_journey ON public.ipromed_legal_clients(journey_stage);
CREATE INDEX idx_legal_cases_status ON public.ipromed_legal_cases(status);
CREATE INDEX idx_legal_cases_client ON public.ipromed_legal_cases(client_id);
CREATE INDEX idx_legal_cases_deadline ON public.ipromed_legal_cases(next_deadline);
CREATE INDEX idx_contracts_status ON public.ipromed_contracts(status);
CREATE INDEX idx_contracts_client ON public.ipromed_contracts(client_id);
CREATE INDEX idx_contracts_end_date ON public.ipromed_contracts(end_date);
CREATE INDEX idx_legal_requests_status ON public.ipromed_legal_requests(status);
CREATE INDEX idx_legal_tasks_status ON public.ipromed_legal_tasks(status);
CREATE INDEX idx_legal_tasks_due ON public.ipromed_legal_tasks(due_date);
CREATE INDEX idx_activity_log_entity ON public.ipromed_activity_log(entity_type, entity_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.ipromed_legal_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_legal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_legal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_legal_team ENABLE ROW LEVEL SECURITY;

-- Admin-only access for all IPROMED tables
CREATE POLICY "Admins can manage legal clients"
  ON public.ipromed_legal_clients FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage legal cases"
  ON public.ipromed_legal_cases FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage case events"
  ON public.ipromed_case_events FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage contracts"
  ON public.ipromed_contracts FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage legal requests"
  ON public.ipromed_legal_requests FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage legal tasks"
  ON public.ipromed_legal_tasks FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage legal documents"
  ON public.ipromed_legal_documents FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage activity log"
  ON public.ipromed_activity_log FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can manage legal team"
  ON public.ipromed_legal_team FOR ALL
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_ipromed_legal_clients_updated_at
  BEFORE UPDATE ON public.ipromed_legal_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_legal_cases_updated_at
  BEFORE UPDATE ON public.ipromed_legal_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_contracts_updated_at
  BEFORE UPDATE ON public.ipromed_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_legal_requests_updated_at
  BEFORE UPDATE ON public.ipromed_legal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_legal_tasks_updated_at
  BEFORE UPDATE ON public.ipromed_legal_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_legal_team_updated_at
  BEFORE UPDATE ON public.ipromed_legal_team
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- GENERATE REQUEST NUMBER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_legal_request_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.request_number := 'REQ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ipromed_request_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS public.ipromed_request_seq START 1;

CREATE TRIGGER set_legal_request_number
  BEFORE INSERT ON public.ipromed_legal_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION public.generate_legal_request_number();