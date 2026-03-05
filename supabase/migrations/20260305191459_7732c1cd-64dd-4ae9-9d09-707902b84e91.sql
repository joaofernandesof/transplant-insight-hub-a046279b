
CREATE TABLE public.surgery_agenda_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL,
  date DATE NOT NULL,
  max_slots INTEGER NOT NULL DEFAULT 5,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch, date)
);

ALTER TABLE public.surgery_agenda_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read availability"
  ON public.surgery_agenda_availability
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert availability"
  ON public.surgery_agenda_availability
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update availability"
  ON public.surgery_agenda_availability
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete availability"
  ON public.surgery_agenda_availability
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
