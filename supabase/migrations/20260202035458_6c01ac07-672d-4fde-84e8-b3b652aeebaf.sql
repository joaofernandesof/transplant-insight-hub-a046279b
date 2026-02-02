-- =============================================
-- Sistema de Equipe/Colaboradores Avivar
-- =============================================

-- Enum para roles de equipe Avivar
CREATE TYPE public.avivar_team_role AS ENUM (
  'admin',      -- Acesso total
  'gestor',     -- Tudo exceto config IA
  'sdr',        -- Leads, Follow-up, Cadências
  'atendente'   -- Inbox, Chats, Contatos
);

-- Tabela de membros da equipe
CREATE TABLE public.avivar_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL, -- Admin cliente que criou a equipe
  member_user_id UUID NOT NULL, -- Usuário colaborador (auth.users.id)
  role avivar_team_role NOT NULL DEFAULT 'atendente',
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(owner_user_id, member_user_id),
  UNIQUE(owner_user_id, email)
);

-- Índices para performance
CREATE INDEX idx_avivar_team_members_owner ON public.avivar_team_members(owner_user_id);
CREATE INDEX idx_avivar_team_members_member ON public.avivar_team_members(member_user_id);
CREATE INDEX idx_avivar_team_members_active ON public.avivar_team_members(owner_user_id, is_active);

-- Enable RLS
ALTER TABLE public.avivar_team_members ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é owner de uma equipe
CREATE OR REPLACE FUNCTION public.is_avivar_team_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.avivar_team_members
    WHERE owner_user_id = _user_id
  )
  OR EXISTS (
    -- Também considerar quem tem agente configurado como potencial owner
    SELECT 1 FROM public.avivar_agents
    WHERE user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.avivar_agent_configs
    WHERE user_id = _user_id
  )
$$;

-- Função para obter o owner_user_id de um colaborador
CREATE OR REPLACE FUNCTION public.get_avivar_team_owner(_member_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_user_id 
  FROM public.avivar_team_members
  WHERE member_user_id = _member_user_id
    AND is_active = true
  LIMIT 1
$$;

-- Função para verificar role do membro na equipe
CREATE OR REPLACE FUNCTION public.get_avivar_team_role(_user_id UUID)
RETURNS avivar_team_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.avivar_team_members
  WHERE member_user_id = _user_id
    AND is_active = true
  LIMIT 1
$$;

-- Função para verificar se usuário tem acesso a recursos de um owner
CREATE OR REPLACE FUNCTION public.has_avivar_access(_user_id UUID, _owner_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _user_id = _owner_user_id -- É o próprio owner
    OR EXISTS (
      SELECT 1 FROM public.avivar_team_members
      WHERE owner_user_id = _owner_user_id
        AND member_user_id = _user_id
        AND is_active = true
    )
$$;

-- RLS Policies

-- Admin cliente pode ver sua própria equipe
CREATE POLICY "Owner can view their team"
ON public.avivar_team_members
FOR SELECT
USING (
  auth.uid() = owner_user_id
  OR auth.uid() = member_user_id
);

-- Admin cliente pode adicionar membros
CREATE POLICY "Owner can insert team members"
ON public.avivar_team_members
FOR INSERT
WITH CHECK (auth.uid() = owner_user_id);

-- Admin cliente pode atualizar sua equipe
CREATE POLICY "Owner can update team members"
ON public.avivar_team_members
FOR UPDATE
USING (auth.uid() = owner_user_id);

-- Admin cliente pode remover membros
CREATE POLICY "Owner can delete team members"
ON public.avivar_team_members
FOR DELETE
USING (auth.uid() = owner_user_id);

-- NeoHub admin pode gerenciar tudo
CREATE POLICY "NeoHub admin full access"
ON public.avivar_team_members
FOR ALL
USING (public.is_neohub_admin(auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_avivar_team_members_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_avivar_team_members_timestamp
  BEFORE UPDATE ON public.avivar_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_avivar_team_members_updated_at();