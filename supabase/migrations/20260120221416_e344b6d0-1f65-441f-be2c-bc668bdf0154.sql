-- Enum for clinic staff roles
CREATE TYPE public.clinic_staff_role AS ENUM ('admin', 'gestao', 'comercial', 'operacao', 'recepcao');

-- Enum for contract status
CREATE TYPE public.contract_status AS ENUM ('ativo', 'pendente', 'quitado', 'cancelado');

-- Enum for schedule status
CREATE TYPE public.schedule_status AS ENUM ('sem_data', 'agendado', 'confirmado', 'realizado', 'cancelado');

-- Staff profiles table (role + branch control)
CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role clinic_staff_role NOT NULL DEFAULT 'recepcao',
  branch TEXT NOT NULL,
  additional_branches TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Patients table
CREATE TABLE public.clinic_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  cpf TEXT UNIQUE,
  phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sales table
CREATE TABLE public.clinic_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  patient_id UUID REFERENCES public.clinic_patients(id) ON DELETE SET NULL,
  branch TEXT NOT NULL,
  service_type TEXT NOT NULL,
  seller TEXT,
  consultant TEXT,
  category TEXT,
  lead_source TEXT,
  vgv DECIMAL(12,2) DEFAULT 0,
  down_payment DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2) GENERATED ALWAYS AS (vgv - down_payment) STORED,
  contract_status contract_status NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Surgeries table
CREATE TABLE public.clinic_surgeries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.clinic_patients(id) ON DELETE SET NULL,
  sale_id UUID REFERENCES public.clinic_sales(id) ON DELETE SET NULL,
  branch TEXT NOT NULL,
  procedure TEXT NOT NULL,
  category TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 7),
  outsourcing BOOLEAN DEFAULT false,
  surgery_date DATE,
  surgery_time TIME,
  schedule_status schedule_status NOT NULL DEFAULT 'sem_data',
  expected_month TEXT,
  doctor_on_duty TEXT,
  exams_sent BOOLEAN DEFAULT false,
  contract_signed BOOLEAN DEFAULT false,
  chart_ready BOOLEAN DEFAULT false,
  surgery_confirmed BOOLEAN DEFAULT false,
  lunch_choice TEXT,
  booking_term_signed BOOLEAN DEFAULT false,
  discharge_term_signed BOOLEAN DEFAULT false,
  gpi_d1_done BOOLEAN DEFAULT false,
  companion_name TEXT,
  companion_phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_surgeries ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's staff profile
CREATE OR REPLACE FUNCTION public.get_staff_profile(_user_id UUID)
RETURNS TABLE(role clinic_staff_role, branch TEXT, additional_branches TEXT[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sp.role, sp.branch, sp.additional_branches
  FROM public.staff_profiles sp
  WHERE sp.user_id = _user_id AND sp.is_active = true
  LIMIT 1
$$;

-- Helper function to check if user can access a branch
CREATE OR REPLACE FUNCTION public.can_access_branch(_user_id UUID, _branch TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = _user_id
      AND sp.is_active = true
      AND (
        sp.role IN ('admin', 'gestao')
        OR sp.branch = _branch
        OR _branch = ANY(sp.additional_branches)
      )
  )
$$;

-- Helper function to check staff role
CREATE OR REPLACE FUNCTION public.has_staff_role(_user_id UUID, _role clinic_staff_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = _user_id
      AND sp.role = _role
      AND sp.is_active = true
  )
$$;

-- Helper to check if user is admin or gestao
CREATE OR REPLACE FUNCTION public.is_staff_admin_or_gestao(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = _user_id
      AND sp.role IN ('admin', 'gestao')
      AND sp.is_active = true
  )
$$;

-- RLS Policies for staff_profiles
CREATE POLICY "Staff can view own profile"
  ON public.staff_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_admin_or_gestao(auth.uid()));

CREATE POLICY "Admin can manage staff profiles"
  ON public.staff_profiles FOR ALL
  TO authenticated
  USING (public.has_staff_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_staff_role(auth.uid(), 'admin'));

-- RLS Policies for clinic_patients (all staff can view/create)
CREATE POLICY "Staff can view patients"
  ON public.clinic_patients FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Staff can create patients"
  ON public.clinic_patients FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Staff can update patients"
  ON public.clinic_patients FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.staff_profiles WHERE user_id = auth.uid() AND is_active = true));

-- RLS Policies for clinic_sales (branch-based)
CREATE POLICY "Staff can view sales in their branch"
  ON public.clinic_sales FOR SELECT
  TO authenticated
  USING (public.can_access_branch(auth.uid(), branch));

CREATE POLICY "Staff can create sales in their branch"
  ON public.clinic_sales FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_branch(auth.uid(), branch));

CREATE POLICY "Staff can update sales in their branch"
  ON public.clinic_sales FOR UPDATE
  TO authenticated
  USING (public.can_access_branch(auth.uid(), branch));

-- RLS Policies for clinic_surgeries (branch-based)
CREATE POLICY "Staff can view surgeries in their branch"
  ON public.clinic_surgeries FOR SELECT
  TO authenticated
  USING (public.can_access_branch(auth.uid(), branch));

CREATE POLICY "Staff can create surgeries in their branch"
  ON public.clinic_surgeries FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_branch(auth.uid(), branch));

CREATE POLICY "Staff can update surgeries in their branch"
  ON public.clinic_surgeries FOR UPDATE
  TO authenticated
  USING (public.can_access_branch(auth.uid(), branch));

-- Indexes for performance
CREATE INDEX idx_staff_profiles_user_id ON public.staff_profiles(user_id);
CREATE INDEX idx_staff_profiles_branch ON public.staff_profiles(branch);
CREATE INDEX idx_clinic_patients_cpf ON public.clinic_patients(cpf);
CREATE INDEX idx_clinic_sales_branch ON public.clinic_sales(branch);
CREATE INDEX idx_clinic_sales_patient ON public.clinic_sales(patient_id);
CREATE INDEX idx_clinic_surgeries_branch ON public.clinic_surgeries(branch);
CREATE INDEX idx_clinic_surgeries_patient ON public.clinic_surgeries(patient_id);
CREATE INDEX idx_clinic_surgeries_date ON public.clinic_surgeries(surgery_date);
CREATE INDEX idx_clinic_surgeries_status ON public.clinic_surgeries(schedule_status);

-- Triggers for updated_at
CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinic_patients_updated_at
  BEFORE UPDATE ON public.clinic_patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinic_sales_updated_at
  BEFORE UPDATE ON public.clinic_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinic_surgeries_updated_at
  BEFORE UPDATE ON public.clinic_surgeries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();