
CREATE TABLE public.org_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit TEXT NOT NULL DEFAULT 'Fortaleza',
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  role_title TEXT NOT NULL,
  person_name TEXT,
  is_vacant BOOLEAN NOT NULL DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.org_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view org_positions"
  ON public.org_positions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage org_positions"
  ON public.org_positions FOR ALL TO authenticated USING (true) WITH CHECK (true);
