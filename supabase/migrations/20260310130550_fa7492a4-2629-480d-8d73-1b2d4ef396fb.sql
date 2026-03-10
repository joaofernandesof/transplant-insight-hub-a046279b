
-- Asset categories
CREATE TABLE public.asset_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read categories" ON public.asset_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.asset_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Asset locations
CREATE TYPE public.asset_location_type AS ENUM ('clinica', 'escritorio', 'sala', 'setor', 'deposito');
CREATE TABLE public.asset_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_local TEXT NOT NULL,
  tipo_local public.asset_location_type NOT NULL DEFAULT 'setor',
  empresa_id UUID,
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read locations" ON public.asset_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage locations" ON public.asset_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Assets
CREATE TYPE public.asset_status AS ENUM ('ativo', 'em_uso', 'em_manutencao', 'inativo', 'descartado');
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_patrimonio TEXT NOT NULL UNIQUE,
  nome_item TEXT NOT NULL,
  categoria_id UUID REFERENCES public.asset_categories(id),
  marca TEXT,
  modelo TEXT,
  numero_serie TEXT,
  descricao TEXT,
  empresa_id UUID,
  localizacao_id UUID REFERENCES public.asset_locations(id),
  responsavel_id UUID,
  data_compra DATE,
  valor_compra NUMERIC(12,2),
  garantia_ate DATE,
  status public.asset_status NOT NULL DEFAULT 'ativo',
  qr_code TEXT,
  codigo_barras TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update assets" ON public.assets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Asset movements
CREATE TABLE public.asset_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  local_anterior UUID REFERENCES public.asset_locations(id),
  local_novo UUID REFERENCES public.asset_locations(id),
  responsavel_anterior UUID,
  responsavel_novo UUID,
  data_movimentacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  motivo TEXT,
  registrado_por UUID NOT NULL
);
ALTER TABLE public.asset_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read movements" ON public.asset_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert movements" ON public.asset_movements FOR INSERT TO authenticated WITH CHECK (true);

-- Asset maintenance
CREATE TYPE public.maintenance_type AS ENUM ('preventiva', 'corretiva');
CREATE TYPE public.maintenance_status AS ENUM ('aberta', 'em_execucao', 'finalizada');
CREATE TABLE public.asset_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  tipo_manutencao public.maintenance_type NOT NULL DEFAULT 'corretiva',
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  valor NUMERIC(12,2),
  responsavel TEXT,
  status public.maintenance_status NOT NULL DEFAULT 'aberta',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read maintenance" ON public.asset_maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert maintenance" ON public.asset_maintenance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update maintenance" ON public.asset_maintenance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Auto-generate patrimonio code
CREATE OR REPLACE FUNCTION public.generate_patrimonio_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_patrimonio FROM 4) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.assets;
  NEW.codigo_patrimonio := 'NG-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_patrimonio_code
  BEFORE INSERT ON public.assets
  FOR EACH ROW
  WHEN (NEW.codigo_patrimonio IS NULL OR NEW.codigo_patrimonio = '')
  EXECUTE FUNCTION public.generate_patrimonio_code();

-- Seed default categories
INSERT INTO public.asset_categories (nome) VALUES
  ('Notebook'), ('Celular'), ('Monitor'), ('Cadeira'), ('Mesa'),
  ('Equipamento Médico'), ('Equipamento Cirúrgico'), ('Equipamento de TI'), ('Outros');
