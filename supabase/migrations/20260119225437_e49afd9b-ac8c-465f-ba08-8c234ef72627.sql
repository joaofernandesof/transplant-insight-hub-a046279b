-- Create table for weekly Sala Técnica meetings
CREATE TABLE public.sala_tecnica_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Sala Técnica',
  description TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL DEFAULT '19:00:00',
  duration_minutes INTEGER DEFAULT 60,
  google_meet_link TEXT,
  mentor_names TEXT[],
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for meeting confirmations
CREATE TABLE public.sala_tecnica_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.sala_tecnica_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attendance_status TEXT DEFAULT 'confirmed',
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS
ALTER TABLE public.sala_tecnica_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sala_tecnica_confirmations ENABLE ROW LEVEL SECURITY;

-- Policies for meetings (everyone authenticated can read)
CREATE POLICY "Anyone can view meetings"
ON public.sala_tecnica_meetings
FOR SELECT
TO authenticated
USING (true);

-- Admins can manage meetings (using user_roles table)
CREATE POLICY "Admins can manage meetings"
ON public.sala_tecnica_meetings
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Policies for confirmations
CREATE POLICY "Users can view all confirmations"
ON public.sala_tecnica_confirmations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own confirmations"
ON public.sala_tecnica_confirmations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own confirmations"
ON public.sala_tecnica_confirmations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own confirmations"
ON public.sala_tecnica_confirmations
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Enable realtime for confirmations
ALTER PUBLICATION supabase_realtime ADD TABLE public.sala_tecnica_confirmations;

-- Insert initial meetings for the next 12 weeks (every Thursday)
INSERT INTO public.sala_tecnica_meetings (title, description, meeting_date, meeting_time, google_meet_link, mentor_names)
SELECT 
  'Sala Técnica #' || row_number() OVER (ORDER BY d),
  'Mentoria semanal com os especialistas do IBRAMEC para licenciados ByNeoFolic',
  d::date,
  '19:00:00'::time,
  'https://meet.google.com/sala-tecnica-neofolic',
  ARRAY['Dr. Hygor', 'Larissa', 'João', 'Edith']
FROM generate_series(
  date_trunc('week', CURRENT_DATE) + interval '3 days',
  date_trunc('week', CURRENT_DATE) + interval '3 days' + interval '11 weeks',
  interval '1 week'
) AS d;