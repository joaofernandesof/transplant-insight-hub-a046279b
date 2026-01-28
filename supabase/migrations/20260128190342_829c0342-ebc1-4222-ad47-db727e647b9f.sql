-- =============================================
-- MÓDULO DE GESTÃO DE SOLICITAÇÕES DE DESTRATO
-- =============================================

-- Enum para etapas do Kanban de Destrato
CREATE TYPE destrato_etapa AS ENUM (
  'solicitacao_recebida',
  'checklist_preenchido',
  'aguardando_parecer_gerente',
  'em_negociacao',
  'devolver',
  'nao_devolver',
  'aguardando_pagamento_financeiro',
  'caso_concluido'
);

-- Enum para status final do destrato
CREATE TYPE destrato_status_final AS ENUM (
  'em_andamento',
  'devolvido',
  'nao_devolvido',
  'cancelado'
);

-- Enum para status da subtarefa
CREATE TYPE destrato_subtarefa_status AS ENUM (
  'pendente',
  'em_andamento',
  'concluida',
  'atrasada',
  'cancelada'
);

-- Tabela principal de solicitações de destrato
CREATE TABLE public.destrato_solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_solicitacao SERIAL UNIQUE,
  
  -- Dados do paciente/titular
  paciente_id UUID REFERENCES public.neohub_users(id),
  paciente_nome TEXT NOT NULL,
  paciente_email TEXT,
  paciente_telefone TEXT,
  
  -- Controle do fluxo
  etapa_atual destrato_etapa NOT NULL DEFAULT 'solicitacao_recebida',
  status_final destrato_status_final NOT NULL DEFAULT 'em_andamento',
  
  -- Responsáveis
  responsavel_id UUID REFERENCES public.neohub_users(id),
  responsavel_nome TEXT DEFAULT 'Júlia',
  
  -- Dados do email original
  email_remetente TEXT,
  email_assunto TEXT,
  email_corpo TEXT,
  email_recebido_em TIMESTAMPTZ,
  remetente_e_titular BOOLEAN,
  
  -- Checklist de informações do contrato
  checklist_preenchido BOOLEAN DEFAULT false,
  checklist_nome_completo TEXT,
  checklist_email TEXT,
  checklist_assinou_termo_sinal BOOLEAN,
  checklist_assinou_contrato BOOLEAN,
  checklist_procedimento_contratado TEXT,
  checklist_valor_total_contrato DECIMAL(12,2),
  checklist_valor_pago DECIMAL(12,2),
  checklist_data_contratacao DATE,
  checklist_status_procedimento TEXT,
  checklist_observacoes TEXT,
  
  -- Parecer da gerente
  parecer_gerente TEXT,
  parecer_gerente_data TIMESTAMPTZ,
  parecer_gerente_por TEXT,
  
  -- Financeiro
  valor_devolver DECIMAL(12,2),
  data_pagamento_prevista DATE,
  data_pagamento_realizado DATE,
  comprovante_pagamento_url TEXT,
  
  -- Documentos
  termo_destrato_url TEXT,
  termo_destrato_assinado BOOLEAN DEFAULT false,
  termo_destrato_assinado_em TIMESTAMPTZ,
  
  -- SLA e prazos
  prazo_resposta_inicial TIMESTAMPTZ,
  prazo_atual TIMESTAMPTZ,
  sla_estourado BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_by UUID REFERENCES public.neohub_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_em TIMESTAMPTZ,
  
  -- Branch/Filial
  branch TEXT
);

-- Tabela de subtarefas automáticas
CREATE TABLE public.destrato_subtarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.destrato_solicitacoes(id) ON DELETE CASCADE,
  
  -- Dados da subtarefa
  titulo TEXT NOT NULL,
  descricao TEXT,
  script_padrao TEXT,
  
  -- Controle
  status destrato_subtarefa_status NOT NULL DEFAULT 'pendente',
  ordem INTEGER NOT NULL DEFAULT 0,
  etapa_relacionada destrato_etapa NOT NULL,
  
  -- Responsável
  responsavel_id UUID REFERENCES public.neohub_users(id),
  responsavel_nome TEXT,
  
  -- Prazos
  prazo TIMESTAMPTZ,
  prazo_horas INTEGER DEFAULT 24,
  
  -- Recorrência (para tarefas de cobrança)
  e_recorrente BOOLEAN DEFAULT false,
  intervalo_recorrencia_horas INTEGER,
  proxima_execucao TIMESTAMPTZ,
  
  -- Conclusão
  concluida_em TIMESTAMPTZ,
  concluida_por UUID REFERENCES public.neohub_users(id),
  notas_conclusao TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de histórico/timeline
CREATE TABLE public.destrato_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.destrato_solicitacoes(id) ON DELETE CASCADE,
  
  -- Evento
  etapa destrato_etapa NOT NULL,
  acao TEXT NOT NULL,
  descricao TEXT,
  
  -- Usuário
  usuario_id UUID REFERENCES public.neohub_users(id),
  usuario_nome TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  data_evento TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_destrato_solicitacoes_etapa ON public.destrato_solicitacoes(etapa_atual);
CREATE INDEX idx_destrato_solicitacoes_status ON public.destrato_solicitacoes(status_final);
CREATE INDEX idx_destrato_solicitacoes_responsavel ON public.destrato_solicitacoes(responsavel_id);
CREATE INDEX idx_destrato_solicitacoes_paciente ON public.destrato_solicitacoes(paciente_id);
CREATE INDEX idx_destrato_subtarefas_solicitacao ON public.destrato_subtarefas(solicitacao_id);
CREATE INDEX idx_destrato_subtarefas_status ON public.destrato_subtarefas(status);
CREATE INDEX idx_destrato_historico_solicitacao ON public.destrato_historico(solicitacao_id);

-- Trigger para updated_at
CREATE TRIGGER update_destrato_solicitacoes_updated_at
  BEFORE UPDATE ON public.destrato_solicitacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_destrato_subtarefas_updated_at
  BEFORE UPDATE ON public.destrato_subtarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.destrato_solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destrato_subtarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destrato_historico ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Administradores e colaboradores podem ver tudo
CREATE POLICY "Admins e colaboradores podem ver solicitacoes destrato"
  ON public.destrato_solicitacoes FOR SELECT
  TO authenticated
  USING (
    public.is_neohub_admin(auth.uid()) OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

CREATE POLICY "Admins e colaboradores podem criar solicitacoes destrato"
  ON public.destrato_solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_neohub_admin(auth.uid()) OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

CREATE POLICY "Admins e colaboradores podem atualizar solicitacoes destrato"
  ON public.destrato_solicitacoes FOR UPDATE
  TO authenticated
  USING (
    public.is_neohub_admin(auth.uid()) OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

CREATE POLICY "Apenas admins podem deletar solicitacoes destrato"
  ON public.destrato_solicitacoes FOR DELETE
  TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- RLS para subtarefas
CREATE POLICY "Admins e colaboradores podem ver subtarefas destrato"
  ON public.destrato_subtarefas FOR SELECT
  TO authenticated
  USING (
    public.is_neohub_admin(auth.uid()) OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

CREATE POLICY "Admins e colaboradores podem gerenciar subtarefas destrato"
  ON public.destrato_subtarefas FOR ALL
  TO authenticated
  USING (
    public.is_neohub_admin(auth.uid()) OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

-- RLS para histórico
CREATE POLICY "Admins e colaboradores podem ver historico destrato"
  ON public.destrato_historico FOR SELECT
  TO authenticated
  USING (
    public.is_neohub_admin(auth.uid()) OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

CREATE POLICY "Admins e colaboradores podem criar historico destrato"
  ON public.destrato_historico FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_neohub_admin(auth.uid()) OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.destrato_solicitacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.destrato_subtarefas;