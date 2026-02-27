
-- ============================================
-- NeoAcademy SaaS - Schema Multi-Tenant
-- ============================================

-- 1. Contas (Tenants) - cada produtor tem sua conta
CREATE TABLE public.neoacademy_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color VARCHAR(20) DEFAULT '#8B5CF6',
  plan VARCHAR(50) DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Membros da conta
CREATE TYPE public.neoacademy_member_role AS ENUM ('owner', 'admin', 'instructor', 'student');

CREATE TABLE public.neoacademy_account_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role neoacademy_member_role DEFAULT 'student',
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, user_id)
);

-- 3. Cursos
CREATE TABLE public.neoacademy_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  short_description VARCHAR(300),
  thumbnail_url TEXT,
  banner_url TEXT,
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  access_type VARCHAR(50) DEFAULT 'free', -- free, paid, plan_required
  price NUMERIC(10,2) DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Módulos (seções dentro de um curso)
CREATE TABLE public.neoacademy_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.neoacademy_courses(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Aulas
CREATE TYPE public.neoacademy_lesson_type AS ENUM ('video', 'text', 'pdf', 'quiz', 'live');

CREATE TABLE public.neoacademy_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.neoacademy_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.neoacademy_courses(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  lesson_type neoacademy_lesson_type DEFAULT 'video',
  video_url TEXT,
  video_duration_seconds INTEGER DEFAULT 0,
  content TEXT, -- para aulas de texto/pdf
  thumbnail_url TEXT,
  is_preview BOOLEAN DEFAULT false, -- aula gratuita de preview
  is_published BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Matrículas
CREATE TABLE public.neoacademy_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.neoacademy_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(course_id, user_id)
);

-- 7. Progresso por aula
CREATE TABLE public.neoacademy_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.neoacademy_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.neoacademy_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  watch_time_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);

-- 8. Categorias do catálogo
CREATE TABLE public.neoacademy_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.neoacademy_accounts(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  icon VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE public.neoacademy_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoacademy_categories ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is member of account
CREATE OR REPLACE FUNCTION public.is_neoacademy_member(_user_id UUID, _account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.neoacademy_account_members
    WHERE user_id = _user_id AND account_id = _account_id AND is_active = true
  )
$$;

-- Helper: check if user is admin/owner of account
CREATE OR REPLACE FUNCTION public.is_neoacademy_admin(_user_id UUID, _account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.neoacademy_account_members
    WHERE user_id = _user_id AND account_id = _account_id 
      AND role IN ('owner', 'admin') AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.neoacademy_accounts
    WHERE id = _account_id AND owner_user_id = _user_id
  )
$$;

-- Accounts: owners and members can see their accounts
CREATE POLICY "Members can view their accounts" ON public.neoacademy_accounts
  FOR SELECT USING (
    public.is_neoacademy_member(auth.uid(), id) OR owner_user_id = auth.uid()
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "Owners can manage accounts" ON public.neoacademy_accounts
  FOR ALL USING (owner_user_id = auth.uid() OR public.is_neohub_admin(auth.uid()));

-- Account Members
CREATE POLICY "Members can view members" ON public.neoacademy_account_members
  FOR SELECT USING (public.is_neoacademy_member(auth.uid(), account_id));

CREATE POLICY "Admins can manage members" ON public.neoacademy_account_members
  FOR ALL USING (public.is_neoacademy_admin(auth.uid(), account_id));

-- Courses: members can view published, admins can manage all
CREATE POLICY "Members can view published courses" ON public.neoacademy_courses
  FOR SELECT USING (
    (is_published = true AND public.is_neoacademy_member(auth.uid(), account_id))
    OR public.is_neoacademy_admin(auth.uid(), account_id)
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "Admins can manage courses" ON public.neoacademy_courses
  FOR ALL USING (
    public.is_neoacademy_admin(auth.uid(), account_id) OR public.is_neohub_admin(auth.uid())
  );

-- Modules
CREATE POLICY "Members can view published modules" ON public.neoacademy_modules
  FOR SELECT USING (
    (is_published = true AND public.is_neoacademy_member(auth.uid(), account_id))
    OR public.is_neoacademy_admin(auth.uid(), account_id)
  );

CREATE POLICY "Admins can manage modules" ON public.neoacademy_modules
  FOR ALL USING (public.is_neoacademy_admin(auth.uid(), account_id));

-- Lessons
CREATE POLICY "Members can view published lessons" ON public.neoacademy_lessons
  FOR SELECT USING (
    (is_published = true AND public.is_neoacademy_member(auth.uid(), account_id))
    OR public.is_neoacademy_admin(auth.uid(), account_id)
  );

CREATE POLICY "Admins can manage lessons" ON public.neoacademy_lessons
  FOR ALL USING (public.is_neoacademy_admin(auth.uid(), account_id));

-- Enrollments: users see their own
CREATE POLICY "Users can view own enrollments" ON public.neoacademy_enrollments
  FOR SELECT USING (user_id = auth.uid() OR public.is_neoacademy_admin(auth.uid(), account_id));

CREATE POLICY "Users can enroll" ON public.neoacademy_enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage enrollments" ON public.neoacademy_enrollments
  FOR ALL USING (public.is_neoacademy_admin(auth.uid(), account_id));

-- Lesson Progress: users manage their own
CREATE POLICY "Users can view own progress" ON public.neoacademy_lesson_progress
  FOR SELECT USING (user_id = auth.uid() OR public.is_neoacademy_admin(auth.uid(), account_id));

CREATE POLICY "Users can update own progress" ON public.neoacademy_lesson_progress
  FOR ALL USING (user_id = auth.uid());

-- Categories
CREATE POLICY "Members can view categories" ON public.neoacademy_categories
  FOR SELECT USING (public.is_neoacademy_member(auth.uid(), account_id));

CREATE POLICY "Admins can manage categories" ON public.neoacademy_categories
  FOR ALL USING (public.is_neoacademy_admin(auth.uid(), account_id));

-- Indexes
CREATE INDEX idx_neoacademy_courses_account ON public.neoacademy_courses(account_id);
CREATE INDEX idx_neoacademy_modules_course ON public.neoacademy_modules(course_id);
CREATE INDEX idx_neoacademy_lessons_module ON public.neoacademy_lessons(module_id);
CREATE INDEX idx_neoacademy_enrollments_user ON public.neoacademy_enrollments(user_id);
CREATE INDEX idx_neoacademy_progress_user ON public.neoacademy_lesson_progress(user_id);
CREATE INDEX idx_neoacademy_members_user ON public.neoacademy_account_members(user_id);
