-- Create surgery_schedule table for managing clinic surgeries
CREATE TABLE public.surgery_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id),
  user_id UUID NOT NULL,
  
  -- Basic info
  surgery_date DATE NOT NULL,
  day_of_week TEXT,
  trichotomy_datetime TIMESTAMP WITH TIME ZONE,
  surgery_time TIME,
  confirmed BOOLEAN DEFAULT false,
  exams_sent BOOLEAN DEFAULT false,
  
  -- Patient info
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  medical_record TEXT,
  category TEXT, -- CATEGORIA A, B, C, D
  
  -- Procedure info
  procedure_type TEXT, -- CABELO, BARBA, SOBRANCELHA, etc
  grade INTEGER, -- Grau 1-7
  
  -- Financial
  initial_value DECIMAL(10,2) DEFAULT 0,
  referral_bonus DECIMAL(10,2) DEFAULT 0,
  upgrade_value DECIMAL(10,2) DEFAULT 0,
  upsell_value DECIMAL(10,2) DEFAULT 0,
  final_value DECIMAL(10,2) DEFAULT 0,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  remaining_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  
  -- Companion info
  companion_name TEXT,
  companion_phone TEXT,
  
  -- Documentation checklist
  contract_signed BOOLEAN DEFAULT false,
  exams_in_system BOOLEAN DEFAULT false,
  
  -- Follow-up checklist
  d7_contact BOOLEAN DEFAULT false,
  d2_contact BOOLEAN DEFAULT false,
  d1_contact BOOLEAN DEFAULT false,
  checkin_sent BOOLEAN DEFAULT false,
  scheduling_form BOOLEAN DEFAULT false,
  d0_discharge_form BOOLEAN DEFAULT false,
  d1_gpi BOOLEAN DEFAULT false,
  
  -- Notes
  observations TEXT,
  financial_verification TEXT,
  post_sale_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surgery_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for licensees to manage their own surgeries
CREATE POLICY "Licensees can view their own surgeries" 
ON public.surgery_schedule 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Licensees can create their own surgeries" 
ON public.surgery_schedule 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Licensees can update their own surgeries" 
ON public.surgery_schedule 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Licensees can delete their own surgeries" 
ON public.surgery_schedule 
FOR DELETE 
USING (user_id = auth.uid());

-- Admin can see all surgeries
CREATE POLICY "Admins can view all surgeries"
ON public.surgery_schedule
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all surgeries"
ON public.surgery_schedule
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_surgery_schedule_updated_at
BEFORE UPDATE ON public.surgery_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_surgery_schedule_user_date ON public.surgery_schedule(user_id, surgery_date);
CREATE INDEX idx_surgery_schedule_date ON public.surgery_schedule(surgery_date);