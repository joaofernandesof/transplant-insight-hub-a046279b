
CREATE TABLE public.neoacademy_user_student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID NOT NULL REFERENCES public.neoacademy_student_profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID,
  UNIQUE(user_id, profile_id)
);

ALTER TABLE public.neoacademy_user_student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read user student profiles"
  ON public.neoacademy_user_student_profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage user student profiles"
  ON public.neoacademy_user_student_profiles
  FOR ALL TO authenticated
  USING (public.is_neohub_admin(auth.uid()))
  WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE INDEX idx_neoacademy_usp_user ON public.neoacademy_user_student_profiles(user_id);
CREATE INDEX idx_neoacademy_usp_account ON public.neoacademy_user_student_profiles(account_id);
