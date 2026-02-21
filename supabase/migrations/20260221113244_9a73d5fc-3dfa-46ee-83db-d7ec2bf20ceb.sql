
-- Add specialty and birth_date to ipromed_legal_clients
ALTER TABLE public.ipromed_legal_clients 
  ADD COLUMN IF NOT EXISTS medical_specialty TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Create a reference table for medical specialty days
CREATE TABLE IF NOT EXISTS public.ipromed_specialty_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty TEXT NOT NULL UNIQUE,
  celebration_date TEXT NOT NULL, -- format MM-DD
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ipromed_specialty_days ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read specialty days
CREATE POLICY "Authenticated users can read specialty days" ON public.ipromed_specialty_days
  FOR SELECT TO authenticated USING (true);

-- Allow admins to manage specialty days
CREATE POLICY "Admins can manage specialty days" ON public.ipromed_specialty_days
  FOR ALL TO authenticated USING (public.is_neohub_admin(auth.uid()));

-- Insert common medical specialty days in Brazil
INSERT INTO public.ipromed_specialty_days (specialty, celebration_date, description) VALUES
  ('Cardiologia', '08-14', 'Dia do Cardiologista'),
  ('Dermatologia', '02-05', 'Dia do Dermatologista'),
  ('Endocrinologia', '07-27', 'Dia do Endocrinologista'),
  ('Gastroenterologia', '12-08', 'Dia do Gastroenterologista'),
  ('Geriatria', '09-26', 'Dia do Geriatra'),
  ('Ginecologia', '10-30', 'Dia do Ginecologista'),
  ('Neurologia', '09-15', 'Dia do Neurologista'),
  ('Oftalmologia', '05-07', 'Dia do Oftalmologista'),
  ('Oncologia', '07-09', 'Dia do Oncologista'),
  ('Ortopedia', '09-16', 'Dia do Ortopedista'),
  ('Otorrinolaringologia', '10-29', 'Dia do Otorrinolaringologista'),
  ('Pediatria', '07-27', 'Dia do Pediatra'),
  ('Psiquiatria', '08-11', 'Dia do Psiquiatra'),
  ('Radiologia', '11-08', 'Dia do Radiologista'),
  ('Urologia', '11-06', 'Dia do Urologista'),
  ('Anestesiologia', '03-16', 'Dia do Anestesiologista'),
  ('Cirurgia Geral', '05-30', 'Dia do Cirurgião'),
  ('Cirurgia Plástica', '07-09', 'Dia do Cirurgião Plástico'),
  ('Medicina do Trabalho', '10-04', 'Dia do Médico do Trabalho'),
  ('Medicina de Família', '12-05', 'Dia do Médico de Família'),
  ('Nefrologia', '03-13', 'Dia do Nefrologista'),
  ('Pneumologia', '06-02', 'Dia do Pneumologista'),
  ('Reumatologia', '06-15', 'Dia do Reumatologista'),
  ('Infectologia', '04-11', 'Dia do Infectologista'),
  ('Hematologia', '10-28', 'Dia do Hematologista'),
  ('Nutrologia', '01-31', 'Dia do Nutrólogo'),
  ('Medicina Esportiva', '09-21', 'Dia do Médico do Esporte'),
  ('Mastologia', '05-29', 'Dia do Mastologista')
ON CONFLICT (specialty) DO NOTHING;
