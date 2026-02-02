
-- Enum para tipo de contrato
CREATE TYPE contract_review_type AS ENUM (
  'locacao',
  'prestacao_servicos',
  'parceria',
  'cessao_espaco',
  'outro'
);

-- Enum para classificação do contrato
CREATE TYPE contract_classification AS ENUM (
  'estrategico',
  'operacional'
);

-- Enum para status da solicitação
CREATE TYPE contract_review_status AS ENUM (
  'rascunho',
  'aguardando_validacao',
  'em_analise',
  'aguardando_ajustes',
  'aprovado',
  'reprovado',
  'cancelado'
);

-- Tabela principal de solicitações de conferência contratual
CREATE TABLE public.contract_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadados
  request_number VARCHAR(50) UNIQUE,
  status contract_review_status DEFAULT 'rascunho',
  created_by UUID REFERENCES public.neohub_users(id) NOT NULL,
  assigned_to UUID REFERENCES public.neohub_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- BLOCO 1: Identificação básica
  area_empresa VARCHAR(100) NOT NULL,
  tipo_contrato contract_review_type NOT NULL,
  tipo_contrato_outro VARCHAR(100),
  nome_outra_parte VARCHAR(255) NOT NULL,
  data_assinatura_prevista DATE NOT NULL,
  data_inicio_vigencia DATE NOT NULL,
  prazo_total_contrato VARCHAR(100) NOT NULL,
  
  -- BLOCO 2: Objetivo do contrato
  objetivo_pratico TEXT NOT NULL,
  beneficio_esperado TEXT NOT NULL,
  classificacao contract_classification NOT NULL,
  
  -- BLOCO 3: Contexto da negociação
  origem_negociacao TEXT NOT NULL,
  houve_negociacao BOOLEAN NOT NULL DEFAULT false,
  pedido_inicial TEXT,
  ajustes_realizados TEXT,
  acordos_informais TEXT,
  
  -- BLOCO 4: Condições comerciais
  valor_total DECIMAL(15,2),
  forma_pagamento TEXT NOT NULL,
  datas_pagamento TEXT,
  multas_previstas TEXT,
  penalidades_cancelamento TEXT,
  condicoes_credito TEXT,
  existe_acordo_fora_contrato BOOLEAN DEFAULT false,
  descricao_acordo_fora_contrato TEXT,
  
  -- BLOCO 5: Pontos sensíveis
  risco_clausula_especifica BOOLEAN DEFAULT false,
  risco_financeiro BOOLEAN DEFAULT false,
  risco_operacional BOOLEAN DEFAULT false,
  risco_juridico BOOLEAN DEFAULT false,
  risco_imagem BOOLEAN DEFAULT false,
  foco_atencao_juridico TEXT NOT NULL,
  
  -- BLOCO 6: Urgência e impacto
  prazo_maximo_retorno DATE NOT NULL,
  impacto_atraso TEXT NOT NULL,
  possui_dependencia_externa BOOLEAN DEFAULT false,
  descricao_dependencia_externa TEXT,
  
  -- SLA calculado
  sla_horas INTEGER,
  sla_deadline TIMESTAMPTZ,
  
  -- Análise jurídica
  parecer_juridico TEXT,
  nivel_risco VARCHAR(20),
  recomendacoes TEXT,
  ajustes_necessarios TEXT
);

-- Tabela de anexos
CREATE TABLE public.contract_review_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.contract_review_requests(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- contrato_pdf, contrato_editavel, registro_negociacao, documento_complementar
  nome_arquivo VARCHAR(255) NOT NULL,
  url_arquivo TEXT NOT NULL,
  tamanho_bytes BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES public.neohub_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de histórico/timeline
CREATE TABLE public.contract_review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.contract_review_requests(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(100) NOT NULL,
  from_status contract_review_status,
  to_status contract_review_status,
  comment TEXT,
  created_by UUID REFERENCES public.neohub_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sequence para número da solicitação
CREATE SEQUENCE contract_review_request_seq START 1;

-- Função para gerar número da solicitação
CREATE OR REPLACE FUNCTION generate_contract_review_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.request_number := 'CCJ-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('contract_review_request_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Trigger para número automático
CREATE TRIGGER tr_generate_contract_review_number
  BEFORE INSERT ON public.contract_review_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION generate_contract_review_number();

-- Função para calcular SLA
CREATE OR REPLACE FUNCTION calculate_contract_review_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SLA baseado em classificação e urgência
  IF NEW.classificacao = 'estrategico' AND NEW.prazo_maximo_retorno <= CURRENT_DATE + INTERVAL '2 days' THEN
    NEW.sla_horas := 24;
  ELSIF NEW.classificacao = 'estrategico' THEN
    NEW.sla_horas := 48;
  ELSIF NEW.possui_dependencia_externa = true THEN
    NEW.sla_horas := 48;
  ELSE
    NEW.sla_horas := 72;
  END IF;
  
  -- Calcula deadline
  IF NEW.submitted_at IS NOT NULL THEN
    NEW.sla_deadline := NEW.submitted_at + (NEW.sla_horas || ' hours')::INTERVAL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para SLA
CREATE TRIGGER tr_calculate_contract_review_sla
  BEFORE INSERT OR UPDATE ON public.contract_review_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_contract_review_sla();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_contract_review_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_update_contract_review_updated_at
  BEFORE UPDATE ON public.contract_review_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_review_updated_at();

-- RLS
ALTER TABLE public.contract_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_review_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_review_history ENABLE ROW LEVEL SECURITY;

-- Políticas para requests
CREATE POLICY "Admins e jurídico veem todas solicitações"
  ON public.contract_review_requests FOR SELECT
  TO authenticated
  USING (
    public.is_neohub_admin(auth.uid())
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
    OR public.has_neohub_profile(auth.uid(), 'colaborador')
  );

CREATE POLICY "Colaboradores criam solicitações"
  ON public.contract_review_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = public.get_neohub_user_id(auth.uid())
  );

CREATE POLICY "Colaboradores editam próprias solicitações em rascunho"
  ON public.contract_review_requests FOR UPDATE
  TO authenticated
  USING (
    (created_by = public.get_neohub_user_id(auth.uid()) AND status = 'rascunho')
    OR public.is_neohub_admin(auth.uid())
    OR public.has_neohub_profile(auth.uid(), 'ipromed')
  );

-- Políticas para attachments
CREATE POLICY "Usuários veem anexos de solicitações acessíveis"
  ON public.contract_review_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contract_review_requests r
      WHERE r.id = request_id
    )
  );

CREATE POLICY "Usuários criam anexos em solicitações próprias"
  ON public.contract_review_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = public.get_neohub_user_id(auth.uid())
  );

-- Políticas para history
CREATE POLICY "Usuários veem histórico de solicitações acessíveis"
  ON public.contract_review_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contract_review_requests r
      WHERE r.id = request_id
    )
  );

CREATE POLICY "Sistema e jurídico criam histórico"
  ON public.contract_review_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Índices
CREATE INDEX idx_contract_review_requests_status ON public.contract_review_requests(status);
CREATE INDEX idx_contract_review_requests_created_by ON public.contract_review_requests(created_by);
CREATE INDEX idx_contract_review_requests_assigned_to ON public.contract_review_requests(assigned_to);
CREATE INDEX idx_contract_review_requests_sla_deadline ON public.contract_review_requests(sla_deadline);
CREATE INDEX idx_contract_review_attachments_request ON public.contract_review_attachments(request_id);
CREATE INDEX idx_contract_review_history_request ON public.contract_review_history(request_id);

-- Storage bucket para anexos
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-review-files', 'contract-review-files', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Usuários autenticados fazem upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contract-review-files');

CREATE POLICY "Usuários autenticados visualizam arquivos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contract-review-files');
