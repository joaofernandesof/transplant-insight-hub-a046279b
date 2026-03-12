
-- =============================================
-- Generic Sector Ticket System
-- =============================================

-- 1. Ticket Type definitions per sector
CREATE TABLE IF NOT EXISTS sector_ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_code TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Ticket',
  color TEXT DEFAULT 'bg-blue-500',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sector_code, code)
);

-- 2. Stages per ticket type
CREATE TABLE IF NOT EXISTS sector_ticket_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID REFERENCES sector_ticket_types(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  sla_hours INTEGER,
  responsible_role TEXT,
  is_initial BOOLEAN DEFAULT false,
  is_final BOOLEAN DEFAULT false,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ticket_type_id, code)
);

-- 3. Checklist items per stage
CREATE TABLE IF NOT EXISTS sector_ticket_stage_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES sector_ticket_stages(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT DEFAULT 'checkbox',
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Actual tickets
CREATE TABLE IF NOT EXISTS sector_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number SERIAL,
  ticket_type_id UUID REFERENCES sector_ticket_types(id) NOT NULL,
  sector_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'aberto',
  current_stage_id UUID REFERENCES sector_ticket_stages(id),
  requester_id UUID NOT NULL,
  requester_name TEXT NOT NULL,
  assigned_to UUID,
  assigned_name TEXT,
  branch TEXT,
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  checklist_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Ticket history/timeline
CREATE TABLE IF NOT EXISTS sector_ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES sector_tickets(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  from_stage_name TEXT,
  to_stage_name TEXT,
  description TEXT,
  user_id UUID,
  user_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_sector_ticket_types_sector ON sector_ticket_types(sector_code);
CREATE INDEX idx_sector_ticket_stages_type ON sector_ticket_stages(ticket_type_id);
CREATE INDEX idx_sector_tickets_sector ON sector_tickets(sector_code);
CREATE INDEX idx_sector_tickets_type ON sector_tickets(ticket_type_id);
CREATE INDEX idx_sector_tickets_status ON sector_tickets(status);
CREATE INDEX idx_sector_tickets_requester ON sector_tickets(requester_id);
CREATE INDEX idx_sector_ticket_history_ticket ON sector_ticket_history(ticket_id);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE sector_ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_ticket_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_ticket_stage_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_ticket_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_types" ON sector_ticket_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_stages" ON sector_ticket_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_checklists" ON sector_ticket_stage_checklists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_tickets" ON sector_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_history" ON sector_ticket_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- Triggers
-- =============================================

-- Auto-set initial stage on ticket creation
CREATE OR REPLACE FUNCTION set_ticket_initial_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stage_id IS NULL THEN
    SELECT id INTO NEW.current_stage_id
    FROM sector_ticket_stages
    WHERE ticket_type_id = NEW.ticket_type_id AND is_initial = true
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_initial_stage
BEFORE INSERT ON sector_tickets
FOR EACH ROW EXECUTE FUNCTION set_ticket_initial_stage();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_sector_ticket_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_ticket_ts
BEFORE UPDATE ON sector_tickets
FOR EACH ROW EXECUTE FUNCTION update_sector_ticket_ts();

-- =============================================
-- Seed: Ticket Types per Sector
-- =============================================
INSERT INTO sector_ticket_types (sector_code, name, code, description, icon, color, order_index) VALUES
-- Técnico
('tecnico', 'Ocorrência Clínica', 'ocorrencia_clinica', 'Registro de ocorrências clínicas', 'Stethoscope', 'bg-cyan-500', 1),
('tecnico', 'Intercorrência Cirúrgica', 'intercorrencia', 'Eventos durante procedimentos', 'AlertTriangle', 'bg-red-500', 2),
('tecnico', 'Solicitação de Material', 'solicitacao_material', 'Pedidos de materiais cirúrgicos', 'Package', 'bg-blue-500', 3),
('tecnico', 'Manutenção de Equipamento', 'manutencao_equip', 'Reparo ou calibração de equipamentos', 'Wrench', 'bg-amber-500', 4),
-- Pós-vendas (sucesso_paciente)
('sucesso_paciente', 'Distrato', 'distrato', 'Solicitação de cancelamento/distrato', 'FileX', 'bg-red-500', 1),
('sucesso_paciente', 'Reclamação', 'reclamacao', 'Reclamações de pacientes', 'MessageSquareWarning', 'bg-orange-500', 2),
('sucesso_paciente', 'Reagendamento', 'reagendamento', 'Solicitações de reagendamento', 'CalendarClock', 'bg-blue-500', 3),
('sucesso_paciente', 'Dúvida Pós-Operatório', 'duvida_pos_op', 'Dúvidas sobre pós-operatório', 'HelpCircle', 'bg-purple-500', 4),
('sucesso_paciente', 'Urgência Médica', 'urgencia_medica', 'Casos de urgência médica', 'Siren', 'bg-red-600', 5),
-- Operacional
('operacional', 'Solicitação de Serviço', 'solicitacao_servico', 'Pedidos de serviços internos', 'ClipboardList', 'bg-blue-500', 1),
('operacional', 'Incidente', 'incidente', 'Registro de incidentes operacionais', 'AlertOctagon', 'bg-red-500', 2),
('operacional', 'Logística', 'logistica', 'Demandas de logística e transporte', 'Truck', 'bg-green-500', 3),
('operacional', 'Manutenção Predial', 'manutencao_predial', 'Reparos do espaço físico', 'Building', 'bg-amber-500', 4),
-- Processos
('processos', 'Melhoria de Processo', 'melhoria', 'Sugestões de melhoria em processos', 'TrendingUp', 'bg-green-500', 1),
('processos', 'Não-Conformidade', 'nao_conformidade', 'Registro de não-conformidades', 'ShieldAlert', 'bg-red-500', 2),
('processos', 'Auditoria Interna', 'auditoria', 'Processos de auditoria', 'Search', 'bg-purple-500', 3),
('processos', 'Padronização', 'padronizacao', 'Solicitações de padronização', 'FileCheck', 'bg-blue-500', 4),
-- Financeiro
('financeiro', 'Reembolso', 'reembolso', 'Solicitações de reembolso', 'ReceiptText', 'bg-green-500', 1),
('financeiro', 'Cobrança', 'cobranca', 'Demandas de cobrança', 'BadgeDollarSign', 'bg-amber-500', 2),
('financeiro', 'Nota Fiscal', 'nota_fiscal', 'Emissão ou correção de NF', 'FileText', 'bg-blue-500', 3),
('financeiro', 'Conciliação', 'conciliacao', 'Conciliação bancária', 'Scale', 'bg-purple-500', 4),
('financeiro', 'Pagamento a Fornecedor', 'pagamento', 'Solicitação de pagamentos', 'Wallet', 'bg-emerald-500', 5),
-- Jurídico
('juridico', 'Parecer Jurídico', 'parecer', 'Solicitação de parecer jurídico', 'Gavel', 'bg-indigo-500', 1),
('juridico', 'Revisão de Contrato', 'revisao_contrato', 'Análise e revisão contratual', 'FileSearch', 'bg-blue-500', 2),
('juridico', 'Notificação', 'notificacao', 'Notificações extrajudiciais', 'Mail', 'bg-red-500', 3),
('juridico', 'Compliance', 'compliance', 'Demandas de compliance', 'Shield', 'bg-green-500', 4),
-- Marketing
('marketing', 'Campanha', 'campanha', 'Planejamento e execução de campanhas', 'Megaphone', 'bg-pink-500', 1),
('marketing', 'Material Gráfico', 'material_grafico', 'Criação de peças gráficas', 'Palette', 'bg-purple-500', 2),
('marketing', 'Evento', 'evento', 'Organização de eventos', 'Calendar', 'bg-blue-500', 3),
('marketing', 'Redes Sociais', 'redes_sociais', 'Demandas de redes sociais', 'Share2', 'bg-cyan-500', 4),
-- TI
('ti', 'Bug/Erro', 'bug', 'Reporte de bugs e erros no sistema', 'Bug', 'bg-red-500', 1),
('ti', 'Melhoria de Sistema', 'melhoria', 'Solicitação de melhorias', 'Lightbulb', 'bg-amber-500', 2),
('ti', 'Solicitação de Acesso', 'acesso', 'Acessos e permissões', 'Key', 'bg-green-500', 3),
('ti', 'Infraestrutura', 'infraestrutura', 'Demandas de infra', 'Server', 'bg-blue-500', 4),
-- RH
('rh', 'Admissão', 'admissao', 'Processo de admissão', 'UserPlus', 'bg-green-500', 1),
('rh', 'Desligamento', 'desligamento', 'Processo de desligamento', 'UserMinus', 'bg-red-500', 2),
('rh', 'Férias/Licença', 'ferias', 'Solicitação de férias ou licença', 'Palmtree', 'bg-cyan-500', 3),
('rh', 'Treinamento', 'treinamento', 'Solicitação de treinamento', 'GraduationCap', 'bg-purple-500', 4),
('rh', 'Benefício', 'beneficio', 'Demandas de benefícios', 'Gift', 'bg-pink-500', 5),
-- Comercial
('comercial', 'Proposta Comercial', 'proposta', 'Elaboração de propostas', 'FileSignature', 'bg-blue-500', 1),
('comercial', 'Negociação', 'negociacao', 'Processos de negociação', 'Handshake', 'bg-green-500', 2),
('comercial', 'Contrato Comercial', 'contrato', 'Elaboração de contratos', 'FileText', 'bg-indigo-500', 3),
('comercial', 'Pós-Venda Comercial', 'pos_venda', 'Acompanhamento pós-venda', 'HeartHandshake', 'bg-pink-500', 4),
-- Compras
('compras', 'Requisição de Compra', 'requisicao', 'Pedidos de compra', 'ShoppingCart', 'bg-blue-500', 1),
('compras', 'Cotação', 'cotacao', 'Processos de cotação', 'Calculator', 'bg-amber-500', 2),
('compras', 'Ordem de Compra', 'ordem_compra', 'Emissão de OC', 'ClipboardCheck', 'bg-green-500', 3),
('compras', 'Recebimento', 'recebimento', 'Conferência de recebimento', 'PackageCheck', 'bg-cyan-500', 4),
-- Manutenção
('manutencao', 'Preventiva', 'preventiva', 'Manutenção preventiva programada', 'Clock', 'bg-blue-500', 1),
('manutencao', 'Corretiva', 'corretiva', 'Manutenção corretiva de emergência', 'Wrench', 'bg-red-500', 2),
('manutencao', 'Inspeção', 'inspecao', 'Inspeções técnicas', 'Search', 'bg-purple-500', 3),
('manutencao', 'Calibração', 'calibracao', 'Calibração de equipamentos', 'Gauge', 'bg-amber-500', 4);

-- =============================================
-- Seed: Default Stages for ALL types
-- =============================================
INSERT INTO sector_ticket_stages (ticket_type_id, name, code, order_index, sla_hours, is_initial, is_final)
SELECT t.id, s.name, s.code, s.idx, s.sla, s.is_initial, s.is_final
FROM sector_ticket_types t
CROSS JOIN (VALUES
  ('aberto', 'Aberto', 1, NULL::integer, true, false),
  ('em_analise', 'Em Análise', 2, 24, false, false),
  ('em_execucao', 'Em Execução', 3, 48, false, false),
  ('revisao', 'Revisão', 4, 24, false, false),
  ('concluido', 'Concluído', 5, NULL::integer, false, true)
) AS s(code, name, idx, sla, is_initial, is_final);
