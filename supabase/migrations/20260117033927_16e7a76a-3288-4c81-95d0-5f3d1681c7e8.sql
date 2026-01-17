-- =============================================
-- UNIVERSITY BACKEND - Complete Schema
-- =============================================

-- 1. COURSES TABLE
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration_hours INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. COURSE MODULES TABLE
CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MODULE LESSONS TABLE
CREATE TABLE public.module_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', 'text', 'pdf', 'quiz')),
  content_url TEXT,
  content_html TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. LESSON QUIZZES TABLE
CREATE TABLE public.lesson_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.module_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. QUIZ QUESTIONS TABLE
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.lesson_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'text')),
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. USER COURSE ENROLLMENTS TABLE
CREATE TABLE public.user_course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_percent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
  UNIQUE(user_id, course_id)
);

-- 7. USER LESSON PROGRESS TABLE
CREATE TABLE public.user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.module_lessons(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  watch_time_seconds INTEGER DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);

-- 8. USER QUIZ ATTEMPTS TABLE
CREATE TABLE public.user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.lesson_quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  score INTEGER,
  max_score INTEGER,
  passed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '{}'::jsonb
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - COURSES
-- =============================================
CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view published courses"
  ON public.courses FOR SELECT
  USING (is_published = true OR has_role(auth.uid(), 'admin'));

-- =============================================
-- RLS POLICIES - COURSE MODULES
-- =============================================
CREATE POLICY "Admins can manage modules"
  ON public.course_modules FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view modules of published courses"
  ON public.course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_modules.course_id 
      AND (courses.is_published = true OR has_role(auth.uid(), 'admin'))
    )
  );

-- =============================================
-- RLS POLICIES - MODULE LESSONS
-- =============================================
CREATE POLICY "Admins can manage lessons"
  ON public.module_lessons FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled users can view lessons"
  ON public.module_lessons FOR SELECT
  USING (
    is_preview = true OR
    has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.course_modules cm
      JOIN public.courses c ON c.id = cm.course_id
      JOIN public.user_course_enrollments uce ON uce.course_id = c.id
      WHERE cm.id = module_lessons.module_id
      AND uce.user_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES - LESSON QUIZZES
-- =============================================
CREATE POLICY "Admins can manage quizzes"
  ON public.lesson_quizzes FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled users can view quizzes"
  ON public.lesson_quizzes FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.module_lessons ml
      JOIN public.course_modules cm ON cm.id = ml.module_id
      JOIN public.courses c ON c.id = cm.course_id
      JOIN public.user_course_enrollments uce ON uce.course_id = c.id
      WHERE ml.id = lesson_quizzes.lesson_id
      AND uce.user_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES - QUIZ QUESTIONS
-- =============================================
CREATE POLICY "Admins can manage questions"
  ON public.quiz_questions FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Enrolled users can view questions"
  ON public.quiz_questions FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.lesson_quizzes lq
      JOIN public.module_lessons ml ON ml.id = lq.lesson_id
      JOIN public.course_modules cm ON cm.id = ml.module_id
      JOIN public.courses c ON c.id = cm.course_id
      JOIN public.user_course_enrollments uce ON uce.course_id = c.id
      WHERE lq.id = quiz_questions.quiz_id
      AND uce.user_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES - USER ENROLLMENTS
-- =============================================
CREATE POLICY "Admins can manage all enrollments"
  ON public.user_course_enrollments FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own enrollments"
  ON public.user_course_enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can enroll themselves"
  ON public.user_course_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enrollment"
  ON public.user_course_enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- =============================================
-- RLS POLICIES - USER LESSON PROGRESS
-- =============================================
CREATE POLICY "Admins can view all progress"
  ON public.user_lesson_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own progress"
  ON public.user_lesson_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- RLS POLICIES - USER QUIZ ATTEMPTS
-- =============================================
CREATE POLICY "Admins can view all quiz attempts"
  ON public.user_quiz_attempts FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own quiz attempts"
  ON public.user_quiz_attempts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX idx_module_lessons_module_id ON public.module_lessons(module_id);
CREATE INDEX idx_lesson_quizzes_lesson_id ON public.lesson_quizzes(lesson_id);
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_user_enrollments_user_id ON public.user_course_enrollments(user_id);
CREATE INDEX idx_user_enrollments_course_id ON public.user_course_enrollments(course_id);
CREATE INDEX idx_user_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX idx_user_progress_lesson_id ON public.user_lesson_progress(lesson_id);
CREATE INDEX idx_user_quiz_attempts_user_id ON public.user_quiz_attempts(user_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_lessons_updated_at
  BEFORE UPDATE ON public.module_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_quizzes_updated_at
  BEFORE UPDATE ON public.lesson_quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();