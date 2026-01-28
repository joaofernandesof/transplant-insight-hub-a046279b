-- ============================================
-- FLUXO BPMN DE DISTRATO - Etapas e Checklist Jurídico
-- ============================================

-- 1. Enum para etapas específicas de Distrato
CREATE TYPE public.distrato_etapa_bpmn AS ENUM (
  'solicitacao_recebida',
  'validacao_contato',
  'checklist_preenchido',
  'aguardando_parecer_gerente',
  'em_negociacao',
  'aguardando_assinatura',
  'aguardando_pagamento',
  'caso_concluido'
);

-- 2. Enum para decisão do parecer
CREATE TYPE public.distrato_decisao AS ENUM (
  'pendente',
  'devolver',
  'nao_devolver',
  'em_negociacao'
);

-- 3. Enum para risco jurídico
CREATE TYPE public.distrato_risco_juridico AS ENUM (
  'baixo',
  'medio',
  'alto'
);

-- 4. Enum para status do procedimento
CREATE TYPE public.distrato_status_procedimento AS ENUM (
  'nao_iniciado',
  'em_andamento',
  'finalizado',
  'cancelado'
);

-- 5. Adicionar colunas BPMN na tabela postvenda_chamados
ALTER TABLE public.postvenda_chamados
  ADD COLUMN IF NOT EXISTS distrato_etapa_bpmn distrato_etapa_bpmn DEFAULT 'solicitacao_recebida',
  ADD COLUMN IF NOT EXISTS distrato_decisao distrato_decisao DEFAULT 'pendente',
  
  -- Campos de Validação do Contato
  ADD COLUMN IF NOT EXISTS distrato_email_remetente TEXT,
  ADD COLUMN IF NOT EXISTS distrato_nome_remetente TEXT,
  ADD COLUMN IF NOT EXISTS distrato_contrato_localizado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distrato_paciente_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distrato_remetente_titular BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distrato_email_resposta_enviado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distrato_data_email_recebido TIMESTAMPTZ,
  
  -- Campos do Checklist Jurídico
  ADD COLUMN IF NOT EXISTS distrato_checklist_nome_completo TEXT,
  ADD COLUMN IF NOT EXISTS distrato_checklist_email TEXT,
  ADD COLUMN IF NOT EXISTS distrato_checklist_termo_sinal BOOLEAN,
  ADD COLUMN IF NOT EXISTS distrato_checklist_contrato BOOLEAN,
  ADD COLUMN IF NOT EXISTS distrato_checklist_procedimento TEXT,
  ADD COLUMN IF NOT EXISTS distrato_checklist_valor_total NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS distrato_checklist_valor_pago NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS distrato_checklist_data_contratacao DATE,
  ADD COLUMN IF NOT EXISTS distrato_checklist_status_procedimento distrato_status_procedimento,
  ADD COLUMN IF NOT EXISTS distrato_checklist_motivo TEXT,
  ADD COLUMN IF NOT EXISTS distrato_checklist_tratamento_iniciado BOOLEAN,
  ADD COLUMN IF NOT EXISTS distrato_checklist_risco_juridico distrato_risco_juridico,
  ADD COLUMN IF NOT EXISTS distrato_checklist_observacoes TEXT,
  ADD COLUMN IF NOT EXISTS distrato_checklist_completo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distrato_checklist_data_preenchimento TIMESTAMPTZ,
  
  -- Campos de Parecer da Gerente
  ADD COLUMN IF NOT EXISTS distrato_parecer_enviado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distrato_parecer_recebido_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distrato_parecer_tentativas INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distrato_parecer_observacoes TEXT,
  
  -- Campos de Assinatura
  ADD COLUMN IF NOT EXISTS distrato_documento_tipo TEXT, -- 'com_devolucao' ou 'sem_devolucao'
  ADD COLUMN IF NOT EXISTS distrato_documento_enviado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distrato_documento_assinado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distrato_documento_assinado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distrato_documento_url TEXT,
  
  -- Campos de Pagamento
  ADD COLUMN IF NOT EXISTS distrato_pagamento_solicitado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distrato_pagamento_confirmado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distrato_pagamento_confirmado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distrato_pagamento_valor NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS distrato_pagamento_verificacoes INTEGER DEFAULT 0,
  
  -- Campos de Conclusão
  ADD COLUMN IF NOT EXISTS distrato_status_juridico_final TEXT,
  ADD COLUMN IF NOT EXISTS distrato_observacao_final TEXT,
  ADD COLUMN IF NOT EXISTS distrato_concluido_em TIMESTAMPTZ,
  
  -- Responsáveis
  ADD COLUMN IF NOT EXISTS distrato_responsavel_atual TEXT DEFAULT 'julia',
  ADD COLUMN IF NOT EXISTS distrato_gerente_responsavel TEXT DEFAULT 'jessica';

-- 6. Tabela de SLAs específicos para Distrato
CREATE TABLE IF NOT EXISTS public.postvenda_distrato_sla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa distrato_etapa_bpmn NOT NULL,
  horas_corridas INTEGER,
  horas_uteis INTEGER,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(etapa)
);

-- Inserir SLAs padrão
INSERT INTO public.postvenda_distrato_sla (etapa, horas_corridas, horas_uteis, descricao) VALUES
  ('validacao_contato', 24, 8, 'Validação do contato'),
  ('checklist_preenchido', 24, NULL, 'Preenchimento do checklist jurídico'),
  ('aguardando_parecer_gerente', 24, NULL, 'Parecer da gerente'),
  ('em_negociacao', NULL, NULL, 'Cobrança a cada 24h'),
  ('aguardando_assinatura', NULL, NULL, 'Sem SLA fixo - bloqueia avanço'),
  ('aguardando_pagamento', NULL, NULL, 'Verificação a cada 24h')
ON CONFLICT (etapa) DO NOTHING;

-- 7. Tabela de tarefas automáticas do fluxo
CREATE TABLE IF NOT EXISTS public.postvenda_distrato_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID REFERENCES public.postvenda_chamados(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'enviar_checklist', 'cobrar_parecer', 'enviar_distrato', 'verificar_pagamento'
  titulo TEXT NOT NULL,
  descricao TEXT,
  responsavel TEXT,
  status TEXT DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluida', 'atrasada', 'cancelada'
  prazo TIMESTAMPTZ,
  tentativas INTEGER DEFAULT 0,
  ultima_tentativa TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,
  concluida_por TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_chamados_distrato_etapa ON public.postvenda_chamados(distrato_etapa_bpmn) 
  WHERE tipo_demanda = 'distrato';
CREATE INDEX IF NOT EXISTS idx_chamados_distrato_decisao ON public.postvenda_chamados(distrato_decisao) 
  WHERE tipo_demanda = 'distrato';
CREATE INDEX IF NOT EXISTS idx_distrato_tarefas_chamado ON public.postvenda_distrato_tarefas(chamado_id);
CREATE INDEX IF NOT EXISTS idx_distrato_tarefas_status ON public.postvenda_distrato_tarefas(status);

-- 9. RLS para tarefas
ALTER TABLE public.postvenda_distrato_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read distrato tasks"
  ON public.postvenda_distrato_tarefas FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage distrato tasks"
  ON public.postvenda_distrato_tarefas FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- 10. RLS para SLA distrato
ALTER TABLE public.postvenda_distrato_sla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read distrato SLA"
  ON public.postvenda_distrato_sla FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage distrato SLA"
  ON public.postvenda_distrato_sla FOR ALL
  TO authenticated USING (public.is_neohub_admin(auth.uid()));

-- 11. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_distrato_tarefas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_distrato_tarefas ON public.postvenda_distrato_tarefas;
CREATE TRIGGER trigger_update_distrato_tarefas
  BEFORE UPDATE ON public.postvenda_distrato_tarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_distrato_tarefas_updated_at();