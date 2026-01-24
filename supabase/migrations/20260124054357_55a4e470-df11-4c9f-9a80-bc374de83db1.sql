-- Create anamnesis records table for medical history
CREATE TABLE public.neoteam_anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.clinic_patients(id) ON DELETE CASCADE,
  created_by UUID,
  branch_id UUID REFERENCES public.neoteam_branches(id),
  
  -- Dados básicos
  patient_name TEXT NOT NULL,
  health_insurance TEXT,
  health_insurance_type TEXT,
  profession TEXT,
  age INTEGER,
  
  -- Região de interesse (array de strings)
  interest_regions TEXT[] DEFAULT '{}',
  
  -- Grau de calvície
  baldness_grade INTEGER CHECK (baldness_grade >= 1 AND baldness_grade <= 7),
  
  -- Histórico capilar
  hair_loss_evolution TEXT,
  main_complaint TEXT,
  previous_clinical_treatment TEXT,
  previous_transplant TEXT,
  
  -- Histórico médico
  continuous_medications TEXT,
  chronic_diseases TEXT,
  known_allergies TEXT,
  previous_surgeries TEXT,
  blood_pressure TEXT,
  family_baldness TEXT,
  recent_exams TEXT,
  
  -- Percepção e expectativas
  current_feeling TEXT,
  how_found_clinic TEXT,
  follows_neofolic TEXT,
  seen_other_results TEXT,
  visited_other_clinics TEXT,
  urgency_level INTEGER CHECK (urgency_level >= 0 AND urgency_level <= 10),
  important_event TEXT,
  best_time_procedure TEXT,
  price_awareness TEXT,
  decision_factors TEXT,
  additional_info TEXT,
  
  -- Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'reviewed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.neoteam_anamnesis ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated staff to manage
CREATE POLICY "Authenticated users can view anamnesis"
ON public.neoteam_anamnesis FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create anamnesis"
ON public.neoteam_anamnesis FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update anamnesis"
ON public.neoteam_anamnesis FOR UPDATE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_neoteam_anamnesis_updated_at
BEFORE UPDATE ON public.neoteam_anamnesis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();