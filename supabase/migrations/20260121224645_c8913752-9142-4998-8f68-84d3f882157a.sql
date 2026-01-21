-- =============================================
-- MVP NeoCare - Schema Completo
-- =============================================

-- 1. Tabela de médicos/profissionais (para agenda real)
CREATE TABLE IF NOT EXISTS public.neoteam_doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  neohub_user_id UUID REFERENCES public.neohub_users(id),
  full_name TEXT NOT NULL,
  specialty TEXT DEFAULT 'Transplante Capilar',
  crm TEXT,
  crm_state TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  consultation_duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Horários de trabalho dos médicos
CREATE TABLE IF NOT EXISTS public.neoteam_doctor_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.neoteam_doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo, 6=sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Bloqueios de agenda (férias, feriados, etc)
CREATE TABLE IF NOT EXISTS public.neoteam_schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES public.neoteam_doctors(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_all_doctors BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de notificações para pacientes
CREATE TABLE IF NOT EXISTS public.patient_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('appointment_reminder', 'appointment_confirmation', 'welcome', 'document_available', 'general')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'push', 'sms')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'read')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Configurações de notificações do paciente
CREATE TABLE IF NOT EXISTS public.patient_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Atualizar portal_appointments para incluir doctor_id
ALTER TABLE public.portal_appointments 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.neoteam_doctors(id),
ADD COLUMN IF NOT EXISTS unit_id UUID,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- 7. Criar índices
CREATE INDEX IF NOT EXISTS idx_neoteam_doctors_active ON public.neoteam_doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_neoteam_doctor_schedules_doctor ON public.neoteam_doctor_schedules(doctor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_patient ON public.patient_notifications(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_patient_notifications_scheduled ON public.patient_notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_portal_appointments_doctor ON public.portal_appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_portal_appointments_date ON public.portal_appointments(scheduled_at);

-- 8. Enable RLS
ALTER TABLE public.neoteam_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoteam_doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoteam_schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_notification_preferences ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies - Doctors (público para leitura, admin para escrita)
CREATE POLICY "Doctors visible to authenticated users"
ON public.neoteam_doctors FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admin can manage doctors"
ON public.neoteam_doctors FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 10. RLS Policies - Doctor Schedules
CREATE POLICY "Schedules visible to authenticated users"
ON public.neoteam_doctor_schedules FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admin can manage schedules"
ON public.neoteam_doctor_schedules FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 11. RLS Policies - Schedule Blocks
CREATE POLICY "Blocks visible to authenticated users"
ON public.neoteam_schedule_blocks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can manage blocks"
ON public.neoteam_schedule_blocks FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 12. RLS Policies - Notifications (paciente vê as próprias)
CREATE POLICY "Patients can view own notifications"
ON public.patient_notifications FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT pp.id FROM public.portal_patients pp
    JOIN public.portal_users pu ON pu.id = pp.portal_user_id
    WHERE pu.user_id = auth.uid()
  )
);

CREATE POLICY "System can manage notifications"
ON public.patient_notifications FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));

-- 13. RLS Policies - Notification Preferences
CREATE POLICY "Patients can manage own preferences"
ON public.patient_notification_preferences FOR ALL
TO authenticated
USING (
  patient_id IN (
    SELECT pp.id FROM public.portal_patients pp
    JOIN public.portal_users pu ON pu.id = pp.portal_user_id
    WHERE pu.user_id = auth.uid()
  )
)
WITH CHECK (
  patient_id IN (
    SELECT pp.id FROM public.portal_patients pp
    JOIN public.portal_users pu ON pu.id = pp.portal_user_id
    WHERE pu.user_id = auth.uid()
  )
);

-- 14. Inserir médicos de exemplo
INSERT INTO public.neoteam_doctors (full_name, specialty, crm, crm_state, email, is_active, consultation_duration_minutes)
VALUES 
  ('Dr. Ricardo Mendes', 'Transplante Capilar', '123456', 'SP', 'ricardo@clinica.com', true, 30),
  ('Dra. Paula Lima', 'Tricologia', '654321', 'SP', 'paula@clinica.com', true, 30)
ON CONFLICT DO NOTHING;

-- 15. Inserir horários de trabalho padrão (seg-sex, 8h-18h)
INSERT INTO public.neoteam_doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
SELECT 
  d.id,
  day_num,
  '08:00:00'::TIME,
  '18:00:00'::TIME,
  30
FROM public.neoteam_doctors d
CROSS JOIN generate_series(1, 5) AS day_num -- Segunda a Sexta
WHERE NOT EXISTS (
  SELECT 1 FROM public.neoteam_doctor_schedules ds 
  WHERE ds.doctor_id = d.id
)
ON CONFLICT DO NOTHING;

-- 16. Trigger para updated_at
CREATE TRIGGER update_neoteam_doctors_updated_at
BEFORE UPDATE ON public.neoteam_doctors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_notification_preferences_updated_at
BEFORE UPDATE ON public.patient_notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();