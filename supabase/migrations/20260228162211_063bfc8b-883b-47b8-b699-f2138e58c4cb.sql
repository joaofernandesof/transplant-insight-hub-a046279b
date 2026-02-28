
-- ====================================
-- NeoRH - Tabelas do MVP
-- ====================================

-- 1. rh_unidades
CREATE TABLE public.rh_unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cidade TEXT,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_rh_unidades_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('ativa', 'inativa') THEN
    RAISE EXCEPTION 'status must be ativa or inativa';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_rh_unidades_status
  BEFORE INSERT OR UPDATE ON public.rh_unidades
  FOR EACH ROW EXECUTE FUNCTION public.validate_rh_unidades_status();

ALTER TABLE public.rh_unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can read rh_unidades"
  ON public.rh_unidades FOR SELECT
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'));

CREATE POLICY "Admins can manage rh_unidades"
  ON public.rh_unidades FOR ALL
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 2. rh_areas
CREATE TABLE public.rh_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_rh_areas_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('ativa', 'inativa') THEN
    RAISE EXCEPTION 'status must be ativa or inativa';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_rh_areas_status
  BEFORE INSERT OR UPDATE ON public.rh_areas
  FOR EACH ROW EXECUTE FUNCTION public.validate_rh_areas_status();

ALTER TABLE public.rh_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can read rh_areas"
  ON public.rh_areas FOR SELECT
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'));

CREATE POLICY "Admins can manage rh_areas"
  ON public.rh_areas FOR ALL
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 3. rh_cargos
CREATE TABLE public.rh_cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  nivel TEXT NOT NULL DEFAULT 'operacional',
  objetivo TEXT,
  responsabilidades TEXT,
  competencias TEXT,
  formacao TEXT,
  modelo_contratacao TEXT NOT NULL DEFAULT 'clt',
  tem_comissao BOOLEAN NOT NULL DEFAULT false,
  faixa_salarial_min NUMERIC,
  faixa_salarial_max NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_rh_cargos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nivel NOT IN ('diretor', 'gerente', 'coordenador', 'supervisor', 'operacional', 'estagio') THEN
    RAISE EXCEPTION 'nivel invalido';
  END IF;
  IF NEW.modelo_contratacao NOT IN ('clt', 'cnpj', 'estagio', 'clt_ou_cnpj') THEN
    RAISE EXCEPTION 'modelo_contratacao invalido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_rh_cargos
  BEFORE INSERT OR UPDATE ON public.rh_cargos
  FOR EACH ROW EXECUTE FUNCTION public.validate_rh_cargos();

ALTER TABLE public.rh_cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can read rh_cargos"
  ON public.rh_cargos FOR SELECT
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'));

CREATE POLICY "Admins can manage rh_cargos"
  ON public.rh_cargos FOR ALL
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 4. rh_colaboradores
CREATE TABLE public.rh_colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  telefone TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  unidade_id UUID REFERENCES public.rh_unidades(id),
  area_id UUID REFERENCES public.rh_areas(id),
  cargo_id UUID REFERENCES public.rh_cargos(id),
  gestor_nome TEXT,
  modelo_contratacao TEXT NOT NULL DEFAULT 'clt',
  salario_fixo NUMERIC,
  tem_comissao BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_rh_colaboradores()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('ativo', 'afastado', 'desligado') THEN
    RAISE EXCEPTION 'status invalido';
  END IF;
  IF NEW.modelo_contratacao NOT IN ('clt', 'cnpj', 'estagio') THEN
    RAISE EXCEPTION 'modelo_contratacao invalido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_rh_colaboradores
  BEFORE INSERT OR UPDATE ON public.rh_colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.validate_rh_colaboradores();

ALTER TABLE public.rh_colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can read rh_colaboradores"
  ON public.rh_colaboradores FOR SELECT
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'));

CREATE POLICY "Admins can manage rh_colaboradores"
  ON public.rh_colaboradores FOR ALL
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 5. rh_vagas
CREATE TABLE public.rh_vagas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo_id UUID REFERENCES public.rh_cargos(id),
  unidade_id UUID REFERENCES public.rh_unidades(id),
  area_id UUID REFERENCES public.rh_areas(id),
  status TEXT NOT NULL DEFAULT 'aberta',
  motivo_abertura TEXT NOT NULL DEFAULT 'expansao',
  descricao_curta TEXT,
  requisitos TEXT,
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_rh_vagas()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('aberta', 'triagem', 'entrevistas', 'proposta', 'contratada', 'cancelada') THEN
    RAISE EXCEPTION 'status invalido';
  END IF;
  IF NEW.motivo_abertura NOT IN ('expansao', 'reposicao', 'urgente') THEN
    RAISE EXCEPTION 'motivo_abertura invalido';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_rh_vagas
  BEFORE INSERT OR UPDATE ON public.rh_vagas
  FOR EACH ROW EXECUTE FUNCTION public.validate_rh_vagas();

ALTER TABLE public.rh_vagas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can read rh_vagas"
  ON public.rh_vagas FOR SELECT
  USING (public.is_neohub_admin(auth.uid()) OR public.has_neohub_profile(auth.uid(), 'colaborador'));

CREATE POLICY "Admins can manage rh_vagas"
  ON public.rh_vagas FOR ALL
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

-- ====================================
-- SEED DATA
-- ====================================

-- Unidades
INSERT INTO public.rh_unidades (nome, cidade, status) VALUES
  ('Fortaleza', 'Fortaleza', 'ativa'),
  ('São Paulo', 'São Paulo', 'ativa'),
  ('Juazeiro', 'Juazeiro do Norte', 'ativa');

-- Áreas
INSERT INTO public.rh_areas (nome, status) VALUES
  ('Comercial', 'ativa'),
  ('Financeiro', 'ativa'),
  ('Jurídico', 'ativa'),
  ('Processos', 'ativa'),
  ('Operações', 'ativa');

-- Módulos NeoRH na tabela de permissões
INSERT INTO public.neohub_module_permissions (module_code, module_name, portal, profile, can_read, can_write, can_delete) VALUES
  ('neorh_dashboard', 'Dashboard RH', 'neorh', 'administrador', true, true, true),
  ('neorh_colaboradores', 'Colaboradores', 'neorh', 'administrador', true, true, true),
  ('neorh_cargos', 'Cargos', 'neorh', 'administrador', true, true, true),
  ('neorh_vagas', 'Vagas', 'neorh', 'administrador', true, true, true),
  ('neorh_dashboard', 'Dashboard RH', 'neorh', 'colaborador', true, false, false),
  ('neorh_colaboradores', 'Colaboradores', 'neorh', 'colaborador', true, false, false),
  ('neorh_cargos', 'Cargos', 'neorh', 'colaborador', true, false, false),
  ('neorh_vagas', 'Vagas', 'neorh', 'colaborador', true, false, false);
