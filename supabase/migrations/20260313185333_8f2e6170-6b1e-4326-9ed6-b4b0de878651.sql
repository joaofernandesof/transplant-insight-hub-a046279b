
-- Systems/tools that can be granted access
CREATE TABLE public.org_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'Geral',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.org_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view org_systems"
  ON public.org_systems FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage org_systems"
  ON public.org_systems FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Access matrix: which position has access to which system
CREATE TABLE public.org_access_matrix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.org_positions(id) ON DELETE CASCADE,
  system_id UUID NOT NULL REFERENCES public.org_systems(id) ON DELETE CASCADE,
  has_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (position_id, system_id)
);

ALTER TABLE public.org_access_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view org_access_matrix"
  ON public.org_access_matrix FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage org_access_matrix"
  ON public.org_access_matrix FOR ALL TO authenticated USING (true) WITH CHECK (true);
