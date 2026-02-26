
-- Table for group contact directory
CREATE TABLE public.group_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa TEXT NOT NULL,
  area TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'Geral',
  setor TEXT,
  telefone TEXT,
  whatsapp TEXT,
  email TEXT,
  observacao TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.group_contacts ENABLE ROW LEVEL SECURITY;

-- Public read for active contacts (page is public)
CREATE POLICY "Anyone can read active contacts"
  ON public.group_contacts FOR SELECT
  USING (is_active = true);

-- Authenticated users can manage (admin check done in app)
CREATE POLICY "Authenticated users can insert contacts"
  ON public.group_contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contacts"
  ON public.group_contacts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete contacts"
  ON public.group_contacts FOR DELETE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_group_contacts_updated_at
  BEFORE UPDATE ON public.group_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with the company list
INSERT INTO public.group_contacts (empresa, area, unidade, order_index) VALUES
  ('Neo Folic Fortaleza', 'Comercial', 'Fortaleza', 1),
  ('Neo Folic Fortaleza', 'Pós-vendas', 'Fortaleza', 2),
  ('Neo Folic Fortaleza', 'Financeiro', 'Geral', 3),
  ('Neo Folic Juazeiro', 'Comercial', 'Juazeiro', 4),
  ('Neo Folic Juazeiro', 'Pós-vendas', 'Juazeiro', 5),
  ('Neo Folic Juazeiro', 'Financeiro', 'Geral', 6),
  ('Neo Folic São Paulo', 'Comercial', 'São Paulo', 7),
  ('Neo Folic São Paulo', 'Pós-vendas', 'São Paulo', 8),
  ('Neo Folic São Paulo', 'Financeiro', 'Geral', 9),
  ('IBRAMEC', 'Comercial', 'Geral', 10),
  ('IBRAMEC', 'Pós-vendas', 'Geral', 11),
  ('IBRAMEC', 'Financeiro', 'Geral', 12),
  ('Avivar', 'Comercial', 'Geral', 13),
  ('Avivar', 'Pós-vendas', 'Geral', 14),
  ('Avivar', 'Financeiro', 'Geral', 15),
  ('Neo Folic SPA', 'Comercial', 'Geral', 16),
  ('Neo Folic SPA', 'Pós-vendas', 'Geral', 17),
  ('Neo Folic SPA', 'Financeiro', 'Geral', 18),
  ('Licença ByNeoFolic', 'Comercial', 'Geral', 19),
  ('Licença ByNeoFolic', 'Pós-vendas', 'Geral', 20),
  ('Licença ByNeoFolic', 'Financeiro', 'Geral', 21);
