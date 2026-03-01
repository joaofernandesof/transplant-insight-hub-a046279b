
-- Tabela de POPs (Procedimentos Operacionais Padrão) para NeoTeam
CREATE TABLE public.neoteam_pops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  content TEXT,
  description TEXT,
  version TEXT DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.neoteam_pops ENABLE ROW LEVEL SECURITY;

-- Administradores e licenciados podem ver POPs publicados
CREATE POLICY "Authenticated users can view published POPs"
ON public.neoteam_pops FOR SELECT TO authenticated
USING (status = 'published' OR created_by = auth.uid() OR public.is_neohub_admin(auth.uid()));

-- Apenas admin pode criar/editar/excluir
CREATE POLICY "Admins can insert POPs"
ON public.neoteam_pops FOR INSERT TO authenticated
WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can update POPs"
ON public.neoteam_pops FOR UPDATE TO authenticated
USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins can delete POPs"
ON public.neoteam_pops FOR DELETE TO authenticated
USING (public.is_neohub_admin(auth.uid()));
