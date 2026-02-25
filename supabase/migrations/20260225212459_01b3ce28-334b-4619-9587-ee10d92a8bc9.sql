
-- ==============================================
-- NEOTEAM RBAC - Etapa 1: Estrutura de dados
-- ==============================================

-- 1. Enum de papéis do NeoTeam
CREATE TYPE public.neoteam_role AS ENUM ('MASTER', 'ADMIN', 'PROFISSIONAL', 'OPERACIONAL');

-- 2. Tabela de membros da equipe
CREATE TABLE public.neoteam_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role neoteam_role NOT NULL DEFAULT 'OPERACIONAL',
  is_active BOOLEAN NOT NULL DEFAULT true,
  doctor_id UUID REFERENCES public.neoteam_doctors(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Enum de módulos do NeoTeam
CREATE TYPE public.neoteam_module AS ENUM (
  'clinico_agenda',
  'clinico_agenda_cirurgica',
  'clinico_sala_espera',
  'clinico_pacientes',
  'clinico_prontuarios',
  'clinico_visao_medico',
  'operacoes_tarefas',
  'operacoes_documentos',
  'operacoes_pos_venda',
  'operacoes_limpeza',
  'operacoes_educacao',
  'gestao_eventos',
  'gestao_galerias',
  'admin_equipe',
  'admin_relatorios',
  'admin_configuracoes'
);

-- 4. Tabela de permissões por módulo
CREATE TABLE public.neoteam_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES public.neoteam_team_members(id) ON DELETE CASCADE,
  module neoteam_module NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, module)
);

-- 5. Tabela de auditoria
CREATE TABLE public.neoteam_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Trigger de updated_at
CREATE TRIGGER update_neoteam_team_members_updated_at
  BEFORE UPDATE ON public.neoteam_team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neoteam_module_permissions_updated_at
  BEFORE UPDATE ON public.neoteam_module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Funções de segurança (SECURITY DEFINER)

-- Verifica se user é MASTER no NeoTeam
CREATE OR REPLACE FUNCTION public.is_neoteam_master(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM neoteam_team_members
    WHERE user_id = _user_id
      AND role = 'MASTER'
      AND is_active = true
  );
$$;

-- Verifica se user é ADMIN ou superior
CREATE OR REPLACE FUNCTION public.is_neoteam_admin_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM neoteam_team_members
    WHERE user_id = _user_id
      AND role IN ('MASTER', 'ADMIN')
      AND is_active = true
  );
$$;

-- Verifica se user é membro ativo do NeoTeam
CREATE OR REPLACE FUNCTION public.is_neoteam_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM neoteam_team_members
    WHERE user_id = _user_id
      AND is_active = true
  );
$$;

-- Retorna o papel do usuário no NeoTeam
CREATE OR REPLACE FUNCTION public.get_neoteam_role(_user_id UUID)
RETURNS neoteam_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM neoteam_team_members
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1;
$$;

-- Conta quantos MASTERs ativos existem
CREATE OR REPLACE FUNCTION public.count_neoteam_masters()
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM neoteam_team_members
  WHERE role = 'MASTER' AND is_active = true;
$$;

-- 8. RLS nas tabelas

-- neoteam_team_members
ALTER TABLE public.neoteam_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view team"
  ON public.neoteam_team_members FOR SELECT
  TO authenticated
  USING (public.is_neoteam_member(auth.uid()) OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can insert members"
  ON public.neoteam_team_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_neoteam_admin_or_above(auth.uid()) OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can update members"
  ON public.neoteam_team_members FOR UPDATE
  TO authenticated
  USING (public.is_neoteam_admin_or_above(auth.uid()) OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Master can delete members"
  ON public.neoteam_team_members FOR DELETE
  TO authenticated
  USING (public.is_neoteam_master(auth.uid()) OR public.is_neohub_admin(auth.uid()));

-- neoteam_module_permissions
ALTER TABLE public.neoteam_module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view permissions"
  ON public.neoteam_module_permissions FOR SELECT
  TO authenticated
  USING (public.is_neoteam_member(auth.uid()) OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can manage permissions"
  ON public.neoteam_module_permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_neoteam_admin_or_above(auth.uid()) OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can update permissions"
  ON public.neoteam_module_permissions FOR UPDATE
  TO authenticated
  USING (public.is_neoteam_admin_or_above(auth.uid()) OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can delete permissions"
  ON public.neoteam_module_permissions FOR DELETE
  TO authenticated
  USING (public.is_neoteam_admin_or_above(auth.uid()) OR public.is_neohub_admin(auth.uid()));

-- neoteam_audit_log
ALTER TABLE public.neoteam_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin+ can view audit log"
  ON public.neoteam_audit_log FOR SELECT
  TO authenticated
  USING (public.is_neoteam_admin_or_above(auth.uid()) OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "System can insert audit log"
  ON public.neoteam_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 9. Índices
CREATE INDEX idx_neoteam_team_members_user_id ON public.neoteam_team_members(user_id);
CREATE INDEX idx_neoteam_team_members_role ON public.neoteam_team_members(role);
CREATE INDEX idx_neoteam_module_permissions_member ON public.neoteam_module_permissions(team_member_id);
CREATE INDEX idx_neoteam_audit_log_actor ON public.neoteam_audit_log(actor_user_id);
CREATE INDEX idx_neoteam_audit_log_target ON public.neoteam_audit_log(target_user_id);
CREATE INDEX idx_neoteam_audit_log_created ON public.neoteam_audit_log(created_at DESC);
