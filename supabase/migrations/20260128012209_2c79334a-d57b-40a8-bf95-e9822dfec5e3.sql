-- =============================================
-- IPROMED - Funcionalidades Básicas Faltantes
-- =============================================

-- 1. DOCUMENTOS (GED - Gestão Eletrônica de Documentos)
CREATE TABLE public.ipromed_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.ipromed_contracts(id) ON DELETE SET NULL,
  
  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'outros', -- tcle, contrato, procuracao, peticao, parecer, laudo, outros
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER, -- bytes
  file_type TEXT, -- pdf, docx, jpg, etc
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- active, archived, deleted
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES public.ipromed_documents(id), -- para versionamento
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ANDAMENTOS PROCESSUAIS (Timeline)
CREATE TABLE public.ipromed_case_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.ipromed_legal_cases(id) ON DELETE CASCADE,
  
  -- Dados do andamento
  movement_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  movement_type TEXT NOT NULL DEFAULT 'andamento', -- andamento, decisao, sentenca, despacho, intimacao, publicacao
  
  -- Origem
  source TEXT DEFAULT 'manual', -- manual, api, diario_oficial
  external_id TEXT, -- ID externo se veio de API
  
  -- Prazos
  has_deadline BOOLEAN DEFAULT false,
  deadline_date DATE,
  deadline_completed BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. FINANCEIRO REAL (Faturas/Honorários)
CREATE TABLE public.ipromed_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.ipromed_contracts(id) ON DELETE SET NULL,
  
  -- Dados da fatura
  invoice_number TEXT,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Tipo e classificação
  invoice_type TEXT NOT NULL DEFAULT 'honorario', -- honorario, despesa, adiantamento, reembolso
  category TEXT, -- consultoria, contencioso, preventivo, etc
  
  -- Datas
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue, cancelled
  payment_method TEXT, -- boleto, pix, transferencia, cartao
  
  -- Boleto/PIX
  boleto_url TEXT,
  boleto_barcode TEXT,
  pix_code TEXT,
  pix_qrcode_url TEXT,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. AGENDA/COMPROMISSOS
CREATE TABLE public.ipromed_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE SET NULL,
  
  -- Dados do compromisso
  title TEXT NOT NULL,
  description TEXT,
  appointment_type TEXT NOT NULL DEFAULT 'reuniao', -- reuniao, audiencia, prazo, lembrete, tarefa
  
  -- Data/Hora
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  
  -- Local
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Responsável
  assigned_to UUID,
  
  -- Notificações
  reminder_minutes INTEGER DEFAULT 60, -- minutos antes para lembrar
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PUBLICAÇÕES (Diário Oficial)
CREATE TABLE public.ipromed_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE SET NULL,
  
  -- Dados da publicação
  published_date DATE NOT NULL,
  received_date DATE DEFAULT CURRENT_DATE,
  publication_type TEXT NOT NULL DEFAULT 'intimacao', -- intimacao, despacho, sentenca, acordao
  
  -- Origem
  court TEXT, -- tribunal
  division TEXT, -- vara/câmara
  case_number TEXT,
  search_term TEXT, -- termo que encontrou a publicação
  
  -- Conteúdo
  content TEXT,
  summary TEXT,
  full_text_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'untreated', -- untreated, treated, discarded
  treated_by UUID,
  treated_at TIMESTAMPTZ,
  discard_reason TEXT,
  
  -- Prazo gerado
  generated_deadline_id UUID REFERENCES public.ipromed_appointments(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ALERTAS/NOTIFICAÇÕES
CREATE TABLE public.ipromed_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.ipromed_appointments(id) ON DELETE CASCADE,
  publication_id UUID REFERENCES public.ipromed_publications(id) ON DELETE CASCADE,
  
  -- Dados do alerta
  title TEXT NOT NULL,
  message TEXT,
  alert_type TEXT NOT NULL DEFAULT 'info', -- info, warning, urgent, deadline
  category TEXT, -- prazo, publicacao, audiencia, contrato, pagamento
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  
  -- Destinatário
  user_id UUID,
  
  -- Datas
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ipromed_documents_client ON public.ipromed_documents(client_id);
CREATE INDEX idx_ipromed_documents_case ON public.ipromed_documents(case_id);
CREATE INDEX idx_ipromed_movements_case ON public.ipromed_case_movements(case_id);
CREATE INDEX idx_ipromed_invoices_client ON public.ipromed_invoices(client_id);
CREATE INDEX idx_ipromed_invoices_status ON public.ipromed_invoices(status);
CREATE INDEX idx_ipromed_appointments_date ON public.ipromed_appointments(start_datetime);
CREATE INDEX idx_ipromed_publications_status ON public.ipromed_publications(status);
CREATE INDEX idx_ipromed_alerts_user ON public.ipromed_alerts(user_id, is_read);

-- Enable RLS
ALTER TABLE public.ipromed_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_case_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (acesso restrito a admins e perfil ipromed)
CREATE POLICY "IPROMED documents access" ON public.ipromed_documents
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED movements access" ON public.ipromed_case_movements
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED invoices access" ON public.ipromed_invoices
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED appointments access" ON public.ipromed_appointments
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED publications access" ON public.ipromed_publications
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED alerts access" ON public.ipromed_alerts
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

-- Triggers para updated_at
CREATE TRIGGER update_ipromed_documents_updated_at
  BEFORE UPDATE ON public.ipromed_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_invoices_updated_at
  BEFORE UPDATE ON public.ipromed_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_appointments_updated_at
  BEFORE UPDATE ON public.ipromed_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para documentos jurídicos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ipromed-documents', 'ipromed-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS para storage
CREATE POLICY "IPROMED documents storage read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ipromed-documents' 
  AND (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  )
);

CREATE POLICY "IPROMED documents storage insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ipromed-documents' 
  AND (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  )
);

CREATE POLICY "IPROMED documents storage delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ipromed-documents' 
  AND (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  )
);