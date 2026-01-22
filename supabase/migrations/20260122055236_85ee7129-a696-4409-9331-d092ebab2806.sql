-- Table to track patient orientation progress (moving from localStorage to DB)
CREATE TABLE public.patient_orientation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('pre', 'post')),
  task_day INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_overdue BOOLEAN DEFAULT false,
  overdue_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(patient_id, task_id)
);

-- Table to track overdue notifications sent to patients
CREATE TABLE public.patient_orientation_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('on_time', '30min', '1h', '2h')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'push', 'email')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
  UNIQUE(patient_id, task_id, notification_type)
);

-- Table to track team tasks created from overdue patient orientations
CREATE TABLE public.patient_followup_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  neoteam_task_id UUID REFERENCES public.neoteam_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  UNIQUE(patient_id, task_id)
);

-- Enable RLS
ALTER TABLE public.patient_orientation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_orientation_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_followup_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for patient_orientation_progress
CREATE POLICY "Patients can view own progress"
  ON public.patient_orientation_progress FOR SELECT
  USING (patient_id = public.get_neohub_user_id(auth.uid()));

CREATE POLICY "Patients can insert own progress"
  ON public.patient_orientation_progress FOR INSERT
  WITH CHECK (patient_id = public.get_neohub_user_id(auth.uid()));

CREATE POLICY "Patients can modify own progress"
  ON public.patient_orientation_progress FOR UPDATE
  USING (patient_id = public.get_neohub_user_id(auth.uid()));

CREATE POLICY "Staff can view all progress"
  ON public.patient_orientation_progress FOR SELECT
  USING (
    public.has_neohub_profile(auth.uid(), 'administrador') OR
    public.has_neohub_profile(auth.uid(), 'colaborador') OR
    public.has_neohub_profile(auth.uid(), 'medico')
  );

-- Policies for notifications
CREATE POLICY "Patients can view own notifications"
  ON public.patient_orientation_notifications FOR SELECT
  USING (patient_id = public.get_neohub_user_id(auth.uid()));

CREATE POLICY "Staff can view all notifications"
  ON public.patient_orientation_notifications FOR SELECT
  USING (
    public.has_neohub_profile(auth.uid(), 'administrador') OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

-- Policies for followup tasks
CREATE POLICY "Staff can view followup tasks"
  ON public.patient_followup_tasks FOR SELECT
  USING (
    public.has_neohub_profile(auth.uid(), 'administrador') OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

CREATE POLICY "Staff can manage followup tasks"
  ON public.patient_followup_tasks FOR ALL
  USING (
    public.has_neohub_profile(auth.uid(), 'administrador') OR
    public.has_neohub_profile(auth.uid(), 'colaborador')
  );

-- Indexes for performance
CREATE INDEX idx_orient_progress_patient ON public.patient_orientation_progress(patient_id);
CREATE INDEX idx_orient_progress_overdue ON public.patient_orientation_progress(is_overdue) WHERE is_overdue = true;
CREATE INDEX idx_orient_notif_patient ON public.patient_orientation_notifications(patient_id);
CREATE INDEX idx_followup_unresolved ON public.patient_followup_tasks(resolved_at) WHERE resolved_at IS NULL;