
-- ====================================================
-- ETAPA 4: Camada de Setores sobre RBAC existente
-- ====================================================

-- 1. Adicionar novos módulos ao enum (sem alterar existentes)
ALTER TYPE public.neoteam_module ADD VALUE IF NOT EXISTS 'tecnico_anamnese';
ALTER TYPE public.neoteam_module ADD VALUE IF NOT EXISTS 'tecnico_procedimentos';
ALTER TYPE public.neoteam_module ADD VALUE IF NOT EXISTS 'operacional_inventario';
ALTER TYPE public.neoteam_module ADD VALUE IF NOT EXISTS 'operacional_diario';
ALTER TYPE public.neoteam_module ADD VALUE IF NOT EXISTS 'processos_fluxos';
ALTER TYPE public.neoteam_module ADD VALUE IF NOT EXISTS 'processos_pops';
ALTER TYPE public.neoteam_module ADD VALUE IF NOT EXISTS 'financeiro_contratos';
ALTER TYPE public.neoteam_module ADD VALUE IF NOT EXISTS 'financeiro_importacao';
ALTER TYPE public.neoteam_module ADD VALUE IF NOT EXISTS 'juridico_dashboard';

-- 2. Tabela de setores
CREATE TABLE IF NOT EXISTS public.neoteam_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Building2',
  color TEXT NOT NULL DEFAULT 'bg-blue-500',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.neoteam_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sectors"
  ON public.neoteam_sectors FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sectors"
  ON public.neoteam_sectors FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- 3. Tabela de vinculação setor → módulos do enum
CREATE TABLE IF NOT EXISTS public.neoteam_sector_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES public.neoteam_sectors(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sector_id, module_code)
);

ALTER TABLE public.neoteam_sector_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sector modules"
  ON public.neoteam_sector_modules FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sector modules"
  ON public.neoteam_sector_modules FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- 4. Tabela de roles por setor (financeiro_admin, sucesso_operador, etc.)
CREATE TABLE IF NOT EXISTS public.neoteam_sector_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID NOT NULL REFERENCES public.neoteam_sectors(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.neoteam_team_members(id) ON DELETE CASCADE,
  role_level TEXT NOT NULL DEFAULT 'operador' CHECK (role_level IN ('admin', 'operador', 'visualizador')),
  granted_by UUID,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(sector_id, team_member_id)
);

ALTER TABLE public.neoteam_sector_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own sector roles"
  ON public.neoteam_sector_roles FOR SELECT TO authenticated
  USING (
    team_member_id IN (
      SELECT id FROM public.neoteam_team_members WHERE user_id = auth.uid()
    )
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "Admins can manage sector roles"
  ON public.neoteam_sector_roles FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()));

-- 5. Inserir os setores
INSERT INTO public.neoteam_sectors (code, name, description, icon, color, order_index) VALUES
  ('tecnico', 'Setor Técnico', 'Agenda, pacientes, prontuários e procedimentos clínicos', 'Stethoscope', 'bg-cyan-500', 1),
  ('sucesso_paciente', 'Setor de Sucesso do Paciente', 'Pós-venda, retenção e satisfação', 'HeadphonesIcon', 'bg-yellow-500', 2),
  ('operacional', 'Setor Operacional', 'Tarefas, limpeza, inventário e diário de bordo', 'ClipboardList', 'bg-blue-500', 3),
  ('processos', 'Setor de Processos', 'Fluxos de processo, POPs e documentos', 'GitCompare', 'bg-indigo-500', 4),
  ('financeiro', 'Setor Financeiro', 'Contratos e gestão financeira', 'DollarSign', 'bg-emerald-500', 5),
  ('juridico', 'Setor Jurídico', 'Dashboard jurídico e compliance', 'Scale', 'bg-rose-500', 6),
  ('marketing', 'Setor de Marketing', 'Eventos e galerias de fotos', 'Megaphone', 'bg-pink-500', 7),
  ('ti', 'Setor de TI', 'Relatórios e infraestrutura', 'CircuitBoard', 'bg-purple-500', 8),
  ('rh', 'Setor de RH', 'Cargos, funções e colaboradores', 'UsersRound', 'bg-orange-500', 9)
ON CONFLICT (code) DO NOTHING;

-- 6. Vincular módulos existentes aos setores
INSERT INTO public.neoteam_sector_modules (sector_id, module_code, order_index)
SELECT s.id, m.module_code, m.order_index
FROM public.neoteam_sectors s
CROSS JOIN (VALUES
  -- Setor Técnico
  ('tecnico', 'clinico_agenda', 1),
  ('tecnico', 'clinico_agenda_cirurgica', 2),
  ('tecnico', 'clinico_sala_espera', 3),
  ('tecnico', 'clinico_pacientes', 4),
  ('tecnico', 'clinico_prontuarios', 5),
  ('tecnico', 'clinico_visao_medico', 6),
  ('tecnico', 'tecnico_anamnese', 7),
  ('tecnico', 'tecnico_procedimentos', 8),
  -- Setor Sucesso do Paciente
  ('sucesso_paciente', 'operacoes_pos_venda', 1),
  -- Setor Operacional
  ('operacional', 'operacoes_tarefas', 1),
  ('operacional', 'operacoes_limpeza', 2),
  ('operacional', 'operacional_inventario', 3),
  ('operacional', 'operacional_diario', 4),
  -- Setor de Processos
  ('processos', 'processos_fluxos', 1),
  ('processos', 'processos_pops', 2),
  ('processos', 'operacoes_documentos', 3),
  -- Setor Financeiro
  ('financeiro', 'financeiro_contratos', 1),
  ('financeiro', 'financeiro_importacao', 2),
  -- Setor Jurídico
  ('juridico', 'juridico_dashboard', 1),
  -- Setor Marketing
  ('marketing', 'gestao_eventos', 1),
  ('marketing', 'gestao_galerias', 2),
  -- Setor de RH
  ('rh', 'admin_equipe', 1),
  -- Setor de TI
  ('ti', 'admin_relatorios', 1),
  ('ti', 'admin_configuracoes', 2)
) AS m(sector_code, module_code, order_index)
WHERE s.code = m.sector_code
ON CONFLICT (sector_id, module_code) DO NOTHING;
