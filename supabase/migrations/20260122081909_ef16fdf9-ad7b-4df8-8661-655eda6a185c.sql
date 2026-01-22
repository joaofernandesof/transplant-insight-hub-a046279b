-- =========================================
-- MÓDULO PÓS-VENDA CAPYS
-- =========================================

-- Enum para status do chamado
CREATE TYPE chamado_status AS ENUM (
  'aberto',
  'em_andamento',
  'aguardando_paciente',
  'resolvido',
  'fechado',
  'reaberto',
  'cancelado'
);

-- Enum para prioridade
CREATE TYPE chamado_prioridade AS ENUM (
  'baixa',
  'normal',
  'alta',
  'urgente'
);

-- Enum para etapas do fluxo CAPYS
CREATE TYPE chamado_etapa AS ENUM (
  'triagem',
  'atendimento',
  'resolucao',
  'validacao_paciente',
  'nps',
  'encerrado'
);

-- 1. Tabela de Configuração de SLA
CREATE TABLE public.postvenda_sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_demanda TEXT NOT NULL,
  prioridade chamado_prioridade NOT NULL DEFAULT 'normal',
  etapa chamado_etapa NOT NULL,
  tempo_limite_horas INTEGER NOT NULL DEFAULT 24,
  alerta_previo_min INTEGER NOT NULL DEFAULT 60,
  escalonamento_auto BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela principal de Chamados
CREATE TABLE public.postvenda_chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_chamado SERIAL,
  paciente_id UUID REFERENCES public.neohub_users(id),
  paciente_nome TEXT NOT NULL,
  paciente_telefone TEXT,
  paciente_email TEXT,
  procedimento_id UUID REFERENCES public.clinic_surgeries(id),
  tipo_demanda TEXT NOT NULL,
  prioridade chamado_prioridade NOT NULL DEFAULT 'normal',
  canal_origem TEXT DEFAULT 'whatsapp',
  status chamado_status NOT NULL DEFAULT 'aberto',
  etapa_atual chamado_etapa NOT NULL DEFAULT 'triagem',
  responsavel_id UUID REFERENCES public.neohub_users(id),
  responsavel_nome TEXT,
  sla_id UUID REFERENCES public.postvenda_sla_config(id),
  sla_prazo_fim TIMESTAMPTZ,
  sla_estourado BOOLEAN DEFAULT false,
  motivo_abertura TEXT,
  resolucao TEXT,
  branch TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Histórico de Chamados
CREATE TABLE public.postvenda_chamado_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.postvenda_chamados(id) ON DELETE CASCADE,
  etapa chamado_etapa NOT NULL,
  acao TEXT NOT NULL,
  descricao TEXT,
  usuario_id UUID REFERENCES public.neohub_users(id),
  usuario_nome TEXT,
  data_evento TIMESTAMPTZ DEFAULT now(),
  evidencias JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 4. Tabela de NPS
CREATE TABLE public.postvenda_nps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.postvenda_chamados(id) ON DELETE CASCADE,
  nota INTEGER CHECK (nota >= 0 AND nota <= 10),
  comentario TEXT,
  enviado_em TIMESTAMPTZ DEFAULT now(),
  respondido_em TIMESTAMPTZ,
  canal_envio TEXT DEFAULT 'whatsapp'
);

-- 5. Tabela de Anexos
CREATE TABLE public.postvenda_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.postvenda_chamados(id) ON DELETE CASCADE,
  historico_id UUID REFERENCES public.postvenda_chamado_historico(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.postvenda_sla_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postvenda_chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postvenda_chamado_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postvenda_nps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postvenda_anexos ENABLE ROW LEVEL SECURITY;

-- RLS Policies - SLA Config (admin only for write, all authenticated for read)
CREATE POLICY "SLA config viewable by authenticated" ON public.postvenda_sla_config
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "SLA config editable by admin" ON public.postvenda_sla_config
  FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- RLS Policies - Chamados
CREATE POLICY "Chamados viewable by authenticated" ON public.postvenda_chamados
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Chamados insertable by authenticated" ON public.postvenda_chamados
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Chamados updatable by authenticated" ON public.postvenda_chamados
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies - Histórico
CREATE POLICY "Historico viewable by authenticated" ON public.postvenda_chamado_historico
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Historico insertable by authenticated" ON public.postvenda_chamado_historico
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies - NPS
CREATE POLICY "NPS viewable by authenticated" ON public.postvenda_nps
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "NPS insertable by authenticated" ON public.postvenda_nps
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "NPS updatable by authenticated" ON public.postvenda_nps
  FOR UPDATE USING (auth.role() = 'authenticated');

-- RLS Policies - Anexos
CREATE POLICY "Anexos viewable by authenticated" ON public.postvenda_anexos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anexos insertable by authenticated" ON public.postvenda_anexos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX idx_chamados_status ON public.postvenda_chamados(status);
CREATE INDEX idx_chamados_etapa ON public.postvenda_chamados(etapa_atual);
CREATE INDEX idx_chamados_paciente ON public.postvenda_chamados(paciente_id);
CREATE INDEX idx_chamados_responsavel ON public.postvenda_chamados(responsavel_id);
CREATE INDEX idx_chamados_sla_prazo ON public.postvenda_chamados(sla_prazo_fim);
CREATE INDEX idx_historico_chamado ON public.postvenda_chamado_historico(chamado_id);

-- Trigger para updated_at
CREATE TRIGGER update_chamados_updated_at
  BEFORE UPDATE ON public.postvenda_chamados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sla_config_updated_at
  BEFORE UPDATE ON public.postvenda_sla_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default SLA configurations
INSERT INTO public.postvenda_sla_config (tipo_demanda, prioridade, etapa, tempo_limite_horas, alerta_previo_min) VALUES
('duvida', 'normal', 'triagem', 4, 30),
('duvida', 'normal', 'atendimento', 24, 60),
('duvida', 'normal', 'resolucao', 48, 120),
('reclamacao', 'alta', 'triagem', 2, 15),
('reclamacao', 'alta', 'atendimento', 12, 30),
('reclamacao', 'alta', 'resolucao', 24, 60),
('elogio', 'baixa', 'triagem', 24, 60),
('sugestao', 'normal', 'triagem', 24, 60),
('retorno', 'normal', 'triagem', 4, 30),
('retorno', 'normal', 'atendimento', 24, 60),
('urgencia_medica', 'urgente', 'triagem', 1, 10),
('urgencia_medica', 'urgente', 'atendimento', 4, 15);

-- Enable realtime for chamados
ALTER PUBLICATION supabase_realtime ADD TABLE public.postvenda_chamados;
ALTER PUBLICATION supabase_realtime ADD TABLE public.postvenda_chamado_historico;