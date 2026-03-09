
CREATE TABLE public.surgery_agenda_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  branch TEXT,
  note TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, branch)
);

ALTER TABLE public.surgery_agenda_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read surgery agenda notes"
  ON public.surgery_agenda_notes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert surgery agenda notes"
  ON public.surgery_agenda_notes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update surgery agenda notes"
  ON public.surgery_agenda_notes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
