
CREATE TABLE public.clinic_surgeries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.clinic_patients(id),
  sale_id UUID REFERENCES public.clinic_sales(id),
  branch TEXT NOT NULL DEFAULT 'Filial Fortaleza',
  patient_name TEXT,
  medical_record TEXT,
  procedure TEXT DEFAULT 'CABELO',
  category TEXT,
  grade INTEGER,
  vgv NUMERIC,
  outsourcing BOOLEAN DEFAULT false,
  doctor_on_duty TEXT,
  is_juazeiro BOOLEAN DEFAULT false,
  surgery_date DATE,
  surgery_time TEXT,
  schedule_status TEXT DEFAULT 'agendado',
  expected_month TEXT,
  surgery_confirmed BOOLEAN DEFAULT false,
  exams_sent BOOLEAN DEFAULT false,
  guides_sent BOOLEAN DEFAULT false,
  contract_signed BOOLEAN DEFAULT false,
  chart_ready BOOLEAN DEFAULT false,
  trichotomy_datetime TEXT,
  sale_year TEXT,
  companion_name TEXT,
  companion_phone TEXT,
  d20_contact BOOLEAN DEFAULT false,
  d15_contact BOOLEAN DEFAULT false,
  d10_contact BOOLEAN DEFAULT false,
  d7_contact BOOLEAN DEFAULT false,
  d2_contact BOOLEAN DEFAULT false,
  d1_contact BOOLEAN DEFAULT false,
  lunch_choice TEXT,
  booking_term_signed BOOLEAN DEFAULT false,
  discharge_term_signed BOOLEAN DEFAULT false,
  gpi_d1_done BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.clinic_surgeries ENABLE ROW LEVEL SECURITY;

-- Staff can view surgeries for their branch
CREATE POLICY "Staff can view surgeries"
ON public.clinic_surgeries FOR SELECT
USING (
  public.is_staff_admin_or_gestao(auth.uid())
  OR public.can_access_branch(auth.uid(), branch)
);

-- Admin/gestao can insert
CREATE POLICY "Admin/gestao can insert surgeries"
ON public.clinic_surgeries FOR INSERT
WITH CHECK (
  public.is_staff_admin_or_gestao(auth.uid())
);

-- Admin/gestao can update
CREATE POLICY "Admin/gestao can update surgeries"
ON public.clinic_surgeries FOR UPDATE
USING (
  public.is_staff_admin_or_gestao(auth.uid())
);

-- Admin can delete
CREATE POLICY "Admin can delete surgeries"
ON public.clinic_surgeries FOR DELETE
USING (
  public.is_staff_admin_or_gestao(auth.uid())
);
