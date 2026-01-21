-- ====================================
-- NeoTeam: Appointments, Waiting Room & Documents
-- ====================================

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.neoteam_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.neohub_users(id),
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  type TEXT NOT NULL DEFAULT 'consulta',
  doctor_name TEXT,
  doctor_id UUID,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  branch TEXT DEFAULT 'matriz',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create waiting room table
CREATE TABLE IF NOT EXISTS public.neoteam_waiting_room (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.neoteam_appointments(id),
  patient_id UUID REFERENCES public.neohub_users(id),
  patient_name TEXT NOT NULL,
  appointment_time TIME,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  type TEXT NOT NULL DEFAULT 'consulta',
  doctor_name TEXT,
  room TEXT,
  status TEXT NOT NULL DEFAULT 'arrived' CHECK (status IN ('arrived', 'waiting', 'called', 'in_service', 'completed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  called_at TIMESTAMP WITH TIME ZONE,
  service_started_at TIMESTAMP WITH TIME ZONE,
  service_ended_at TIMESTAMP WITH TIME ZONE,
  branch TEXT DEFAULT 'matriz',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient documents table
CREATE TABLE IF NOT EXISTS public.neoteam_patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.neohub_users(id),
  patient_name TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT NOT NULL DEFAULT 'outros' CHECK (category IN ('exames', 'laudos', 'receitas', 'termos', 'fotos', 'outros')),
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  branch TEXT DEFAULT 'matriz',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.neoteam_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoteam_waiting_room ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoteam_patient_documents ENABLE ROW LEVEL SECURITY;

-- Policies for appointments
CREATE POLICY "Authenticated users can view appointments" 
ON public.neoteam_appointments FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert appointments" 
ON public.neoteam_appointments FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update appointments" 
ON public.neoteam_appointments FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete appointments" 
ON public.neoteam_appointments FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Policies for waiting room
CREATE POLICY "Authenticated users can view waiting room" 
ON public.neoteam_waiting_room FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert to waiting room" 
ON public.neoteam_waiting_room FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update waiting room" 
ON public.neoteam_waiting_room FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from waiting room" 
ON public.neoteam_waiting_room FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Policies for documents
CREATE POLICY "Authenticated users can view documents" 
ON public.neoteam_patient_documents FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload documents" 
ON public.neoteam_patient_documents FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update documents" 
ON public.neoteam_patient_documents FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete documents" 
ON public.neoteam_patient_documents FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Enable realtime for waiting room
ALTER PUBLICATION supabase_realtime ADD TABLE public.neoteam_waiting_room;

-- Triggers for updated_at
CREATE TRIGGER update_neoteam_appointments_updated_at
BEFORE UPDATE ON public.neoteam_appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neoteam_waiting_room_updated_at
BEFORE UPDATE ON public.neoteam_waiting_room
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neoteam_patient_documents_updated_at
BEFORE UPDATE ON public.neoteam_patient_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();