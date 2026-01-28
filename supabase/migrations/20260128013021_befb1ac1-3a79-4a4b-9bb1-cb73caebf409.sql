-- =============================================
-- IPROMED - Sistema Completo Estilo Astrea
-- Módulos: Indicadores, Financeiro, Timesheet, IA
-- =============================================

-- 1. TIMESHEET / CONTROLE DE TEMPO
CREATE TABLE public.ipromed_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE SET NULL,
  
  -- Dados do registro
  description TEXT NOT NULL,
  activity_type TEXT DEFAULT 'atendimento', -- atendimento, reuniao, pesquisa, elaboracao, audiencia, deslocamento
  
  -- Tempo
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- calculado ou manual
  is_running BOOLEAN DEFAULT false,
  
  -- Faturamento
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  total_value DECIMAL(10,2),
  invoice_id UUID REFERENCES public.ipromed_invoices(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TEMPLATES DE DOCUMENTOS
CREATE TABLE public.ipromed_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'contrato', -- contrato, peticao, parecer, procuracao, tcle, notificacao
  
  -- Conteúdo do template
  content TEXT NOT NULL, -- HTML ou Markdown com placeholders {{variavel}}
  variables JSONB DEFAULT '[]', -- Lista de variáveis disponíveis
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PEÇAS GERADAS COM IA
CREATE TABLE public.ipromed_ai_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE SET NULL,
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.ipromed_document_templates(id) ON DELETE SET NULL,
  
  -- Dados da peça
  title TEXT NOT NULL,
  document_type TEXT NOT NULL, -- peticao_inicial, contestacao, recurso, parecer, contrato
  
  -- IA
  prompt_used TEXT,
  ai_model TEXT DEFAULT 'gemini-2.5-flash',
  generation_status TEXT DEFAULT 'pending', -- pending, generating, completed, failed
  
  -- Conteúdo
  content TEXT,
  formatted_content TEXT, -- HTML formatado
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES public.ipromed_ai_documents(id),
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RÉGUA DE COBRANÇA
CREATE TABLE public.ipromed_billing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Configuração
  days_before_due INTEGER DEFAULT 3, -- dias antes do vencimento para lembrar
  days_after_due INTEGER[], -- array de dias após vencimento para cobrar [1, 3, 7, 15, 30]
  
  -- Canais
  send_email BOOLEAN DEFAULT true,
  send_whatsapp BOOLEAN DEFAULT false,
  
  -- Templates de mensagem
  reminder_template TEXT,
  overdue_template TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ETIQUETAS / TAGS
CREATE TABLE public.ipromed_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3B82F6',
  category TEXT DEFAULT 'geral', -- geral, processo, cliente, tarefa
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. RELAÇÃO TAGS COM ENTIDADES
CREATE TABLE public.ipromed_entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES public.ipromed_tags(id) ON DELETE CASCADE,
  
  -- Polimórfico - apenas um será preenchido
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.ipromed_documents(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.ipromed_appointments(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT only_one_entity CHECK (
    (CASE WHEN case_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN client_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN document_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN appointment_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

-- 7. COMENTÁRIOS E MENÇÕES
CREATE TABLE public.ipromed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polimórfico
  case_id UUID REFERENCES public.ipromed_legal_cases(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.ipromed_documents(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.ipromed_appointments(id) ON DELETE CASCADE,
  
  -- Conteúdo
  content TEXT NOT NULL,
  mentions UUID[], -- array de user_ids mencionados
  
  -- Audit
  author_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. INDICADORES SALVOS / SNAPSHOTS
CREATE TABLE public.ipromed_indicator_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type TEXT DEFAULT 'daily', -- daily, weekly, monthly
  
  -- Métricas de Processos
  total_cases INTEGER DEFAULT 0,
  active_cases INTEGER DEFAULT 0,
  cases_won INTEGER DEFAULT 0,
  cases_lost INTEGER DEFAULT 0,
  cases_settled INTEGER DEFAULT 0,
  
  -- Métricas de Prazos
  total_deadlines INTEGER DEFAULT 0,
  deadlines_met INTEGER DEFAULT 0,
  deadlines_missed INTEGER DEFAULT 0,
  
  -- Métricas Financeiras
  total_billed DECIMAL(12,2) DEFAULT 0,
  total_received DECIMAL(12,2) DEFAULT 0,
  total_pending DECIMAL(12,2) DEFAULT 0,
  total_overdue DECIMAL(12,2) DEFAULT 0,
  
  -- Métricas de Produtividade
  total_hours_logged DECIMAL(10,2) DEFAULT 0,
  billable_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Métricas de Atendimento
  total_clients INTEGER DEFAULT 0,
  new_clients INTEGER DEFAULT 0,
  publications_treated INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. METAS E OBJETIVOS
CREATE TABLE public.ipromed_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL, -- revenue, cases_won, hours_logged, new_clients
  
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  status TEXT DEFAULT 'active', -- active, achieved, failed
  
  user_id UUID, -- se for meta individual
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_ipromed_timesheets_user ON public.ipromed_timesheets(user_id);
CREATE INDEX idx_ipromed_timesheets_client ON public.ipromed_timesheets(client_id);
CREATE INDEX idx_ipromed_timesheets_date ON public.ipromed_timesheets(start_time);
CREATE INDEX idx_ipromed_ai_documents_case ON public.ipromed_ai_documents(case_id);
CREATE INDEX idx_ipromed_comments_case ON public.ipromed_comments(case_id);
CREATE INDEX idx_ipromed_entity_tags_tag ON public.ipromed_entity_tags(tag_id);
CREATE INDEX idx_ipromed_snapshots_date ON public.ipromed_indicator_snapshots(snapshot_date);

-- Enable RLS
ALTER TABLE public.ipromed_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_billing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_entity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_indicator_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "IPROMED timesheets access" ON public.ipromed_timesheets
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED templates access" ON public.ipromed_document_templates
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED ai documents access" ON public.ipromed_ai_documents
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED billing rules access" ON public.ipromed_billing_rules
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED tags access" ON public.ipromed_tags
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED entity tags access" ON public.ipromed_entity_tags
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED comments access" ON public.ipromed_comments
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED snapshots access" ON public.ipromed_indicator_snapshots
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

CREATE POLICY "IPROMED goals access" ON public.ipromed_goals
  FOR ALL USING (
    public.is_neohub_admin(auth.uid()) 
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

-- Triggers
CREATE TRIGGER update_ipromed_timesheets_updated_at
  BEFORE UPDATE ON public.ipromed_timesheets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_templates_updated_at
  BEFORE UPDATE ON public.ipromed_document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_ai_documents_updated_at
  BEFORE UPDATE ON public.ipromed_ai_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_goals_updated_at
  BEFORE UPDATE ON public.ipromed_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ipromed_comments_updated_at
  BEFORE UPDATE ON public.ipromed_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();