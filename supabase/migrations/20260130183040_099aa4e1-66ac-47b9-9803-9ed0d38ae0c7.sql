-- Enum for service types
CREATE TYPE public.avivar_service_type AS ENUM ('capilar', 'barba', 'sobrancelha');

-- Enum for journey stages
CREATE TYPE public.avivar_stage AS ENUM (
  -- Commercial stages
  'lead_entrada', 'triagem', 'agendamento', 'follow_up', 'paciente',
  -- Post-sale stages
  'onboarding', 'contrato', 'contrato_assinado', 'pre_operatorio', 'procedimento', 'pos_operatorio', 'relacionamento'
);

-- Enum for journey type
CREATE TYPE public.avivar_journey_type AS ENUM ('comercial', 'pos_venda');

-- Main patient journey table
CREATE TABLE public.avivar_patient_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Patient info
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  
  -- Service info
  service_type avivar_service_type NOT NULL DEFAULT 'capilar',
  
  -- Current stage tracking
  current_stage avivar_stage NOT NULL DEFAULT 'lead_entrada',
  journey_type avivar_journey_type NOT NULL DEFAULT 'comercial',
  
  -- Lead capture data
  lead_source TEXT,
  selected_time TEXT,
  pain_point TEXT,
  desired_area TEXT,
  initial_expectation TEXT,
  
  -- Scheduling data
  scheduled_date TIMESTAMPTZ,
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_active BOOLEAN DEFAULT false,
  
  -- Follow-up data
  contact_attempts INTEGER DEFAULT 0,
  pending_reason TEXT,
  next_step TEXT,
  
  -- Conversion data
  attended BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  
  -- Post-sale: Onboarding
  welcome_sent BOOLEAN DEFAULT false,
  initial_instructions_sent BOOLEAN DEFAULT false,
  support_channel_informed BOOLEAN DEFAULT false,
  
  -- Post-sale: Contract
  contract_sent BOOLEAN DEFAULT false,
  contract_doubts_cleared BOOLEAN DEFAULT false,
  signature_requested BOOLEAN DEFAULT false,
  contract_signed BOOLEAN DEFAULT false,
  payment_confirmed BOOLEAN DEFAULT false,
  legal_status_validated BOOLEAN DEFAULT false,
  
  -- Post-sale: Pre-op
  exams_requested BOOLEAN DEFAULT false,
  exams_verified BOOLEAN DEFAULT false,
  pre_op_instructions_sent BOOLEAN DEFAULT false,
  
  -- Post-sale: Procedure
  procedure_done BOOLEAN DEFAULT false,
  photo_record_done BOOLEAN DEFAULT false,
  discharge_instructions_given BOOLEAN DEFAULT false,
  
  -- Post-sale: Post-op
  same_day_contact BOOLEAN DEFAULT false,
  next_day_contact BOOLEAN DEFAULT false,
  issues_registered BOOLEAN DEFAULT false,
  
  -- Post-sale: Relationship
  evaluation_requested BOOLEAN DEFAULT false,
  testimonial_invited BOOLEAN DEFAULT false,
  referral_program_presented BOOLEAN DEFAULT false,
  
  -- Metadata
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avivar_patient_journeys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view journeys"
ON public.avivar_patient_journeys FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create journeys"
ON public.avivar_patient_journeys FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update journeys"
ON public.avivar_patient_journeys FOR UPDATE
TO authenticated
USING (true);

-- Stage transition history for audit
CREATE TABLE public.avivar_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES public.avivar_patient_journeys(id) ON DELETE CASCADE,
  from_stage avivar_stage,
  to_stage avivar_stage NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.avivar_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stage history"
ON public.avivar_stage_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create stage history"
ON public.avivar_stage_history FOR INSERT TO authenticated WITH CHECK (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_avivar_journey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_avivar_journeys_updated_at
BEFORE UPDATE ON public.avivar_patient_journeys
FOR EACH ROW EXECUTE FUNCTION public.update_avivar_journey_updated_at();

-- Indexes for performance
CREATE INDEX idx_avivar_journeys_stage ON public.avivar_patient_journeys(current_stage);
CREATE INDEX idx_avivar_journeys_type ON public.avivar_patient_journeys(journey_type);
CREATE INDEX idx_avivar_journeys_service ON public.avivar_patient_journeys(service_type);
CREATE INDEX idx_avivar_journeys_assigned ON public.avivar_patient_journeys(assigned_to);