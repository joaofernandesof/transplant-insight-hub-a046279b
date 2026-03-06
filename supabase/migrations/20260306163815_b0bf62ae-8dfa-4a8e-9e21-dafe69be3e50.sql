
-- Student profiles table
CREATE TABLE public.neoacademy_student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'Users',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, slug)
);

-- Profile to courses mapping
CREATE TABLE public.neoacademy_profile_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.neoacademy_student_profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.neoacademy_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, course_id)
);

-- RLS
ALTER TABLE public.neoacademy_student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_profile_courses ENABLE ROW LEVEL SECURITY;

-- Policies for student profiles
CREATE POLICY "Members can read student profiles" ON public.neoacademy_student_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.neoacademy_account_members m
      WHERE m.account_id = neoacademy_student_profiles.account_id
      AND m.user_id = auth.uid()
      AND m.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_users nu
      JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id
      WHERE nu.user_id = auth.uid()
      AND nup.profile = 'administrador'
      AND nup.is_active = true
    )
  );

CREATE POLICY "Admins can manage student profiles" ON public.neoacademy_student_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.neoacademy_account_members m
      WHERE m.account_id = neoacademy_student_profiles.account_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
      AND m.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_users nu
      JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id
      WHERE nu.user_id = auth.uid()
      AND nup.profile = 'administrador'
      AND nup.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.neoacademy_account_members m
      WHERE m.account_id = neoacademy_student_profiles.account_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
      AND m.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_users nu
      JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id
      WHERE nu.user_id = auth.uid()
      AND nup.profile = 'administrador'
      AND nup.is_active = true
    )
  );

-- Policies for profile courses
CREATE POLICY "Members can read profile courses" ON public.neoacademy_profile_courses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.neoacademy_student_profiles sp
      JOIN public.neoacademy_account_members m ON m.account_id = sp.account_id
      WHERE sp.id = neoacademy_profile_courses.profile_id
      AND m.user_id = auth.uid()
      AND m.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_users nu
      JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id
      WHERE nu.user_id = auth.uid()
      AND nup.profile = 'administrador'
      AND nup.is_active = true
    )
  );

CREATE POLICY "Admins can manage profile courses" ON public.neoacademy_profile_courses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.neoacademy_student_profiles sp
      JOIN public.neoacademy_account_members m ON m.account_id = sp.account_id
      WHERE sp.id = neoacademy_profile_courses.profile_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
      AND m.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_users nu
      JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id
      WHERE nu.user_id = auth.uid()
      AND nup.profile = 'administrador'
      AND nup.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.neoacademy_student_profiles sp
      JOIN public.neoacademy_account_members m ON m.account_id = sp.account_id
      WHERE sp.id = neoacademy_profile_courses.profile_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
      AND m.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_users nu
      JOIN public.neohub_user_profiles nup ON nup.neohub_user_id = nu.id
      WHERE nu.user_id = auth.uid()
      AND nup.profile = 'administrador'
      AND nup.is_active = true
    )
  );
