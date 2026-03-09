
CREATE TABLE public.clinic_patient_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  user_id UUID,
  user_name TEXT NOT NULL DEFAULT 'Usuário',
  action TEXT NOT NULL DEFAULT 'updated',
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_patient_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read patient audit logs"
  ON public.clinic_patient_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert patient audit logs"
  ON public.clinic_patient_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_clinic_patient_audit_log_patient_id ON public.clinic_patient_audit_log(patient_id);
CREATE INDEX idx_clinic_patient_audit_log_created_at ON public.clinic_patient_audit_log(created_at DESC);
