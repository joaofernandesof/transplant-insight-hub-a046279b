-- Criar enum para os perfis do NeoHub
CREATE TYPE public.neohub_profile AS ENUM ('paciente', 'colaborador', 'aluno', 'licenciado');

-- Criar tabela unificada de usuários do NeoHub
CREATE TABLE public.neohub_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    cpf TEXT,
    birth_date DATE,
    phone TEXT,
    avatar_url TEXT,
    -- Endereço
    address_cep TEXT,
    address_street TEXT,
    address_number TEXT,
    address_complement TEXT,
    address_neighborhood TEXT,
    address_city TEXT,
    address_state TEXT,
    -- Campos adicionais
    marital_status TEXT,
    nationality TEXT DEFAULT 'Brasileira',
    -- Metadados
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Criar tabela de perfis por usuário (múltiplos perfis permitidos)
CREATE TABLE public.neohub_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neohub_user_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
    profile neohub_profile NOT NULL,
    is_active BOOLEAN DEFAULT true,
    granted_at TIMESTAMPTZ DEFAULT now(),
    granted_by UUID,
    UNIQUE(neohub_user_id, profile)
);

-- Habilitar RLS
ALTER TABLE public.neohub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neohub_user_profiles ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário tem um perfil específico
CREATE OR REPLACE FUNCTION public.has_neohub_profile(_user_id UUID, _profile neohub_profile)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.neohub_user_profiles nup
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.user_id = _user_id
      AND nup.profile = _profile
      AND nup.is_active = true
      AND nu.is_active = true
  )
$$;

-- Função para obter todos os perfis de um usuário
CREATE OR REPLACE FUNCTION public.get_neohub_user_profiles(_user_id UUID)
RETURNS TABLE(profile neohub_profile)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nup.profile
  FROM public.neohub_user_profiles nup
  JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
  WHERE nu.user_id = _user_id
    AND nup.is_active = true
    AND nu.is_active = true
$$;

-- Função para obter o neohub_user_id a partir do auth user_id
CREATE OR REPLACE FUNCTION public.get_neohub_user_id(_auth_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nu.id FROM public.neohub_users nu WHERE nu.user_id = _auth_user_id LIMIT 1
$$;

-- Políticas RLS para neohub_users
CREATE POLICY "Users can view own data"
ON public.neohub_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own data"
ON public.neohub_users
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all users"
ON public.neohub_users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all users"
ON public.neohub_users
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para neohub_user_profiles
CREATE POLICY "Users can view own profiles"
ON public.neohub_user_profiles
FOR SELECT
TO authenticated
USING (
  neohub_user_id = public.get_neohub_user_id(auth.uid())
);

CREATE POLICY "Admins can manage all profiles"
ON public.neohub_user_profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_neohub_users_updated_at
BEFORE UPDATE ON public.neohub_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_neohub_users_user_id ON public.neohub_users(user_id);
CREATE INDEX idx_neohub_users_email ON public.neohub_users(email);
CREATE INDEX idx_neohub_user_profiles_user_id ON public.neohub_user_profiles(neohub_user_id);
CREATE INDEX idx_neohub_user_profiles_profile ON public.neohub_user_profiles(profile);