-- Create surveys table (similar to exams)
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  class_id UUID REFERENCES public.course_classes(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  survey_type VARCHAR(50) DEFAULT 'satisfaction', -- satisfaction, feedback, nps, custom
  is_active BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  show_results_to_students BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create survey_questions table (similar to exam_questions)
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'rating', -- rating, text, single_choice, multiple_choice, scale
  options JSONB, -- For choice questions: ["Option 1", "Option 2", ...]
  scale_min INTEGER DEFAULT 1,
  scale_max INTEGER DEFAULT 5,
  scale_labels JSONB, -- {"1": "Péssimo", "5": "Excelente"}
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  category VARCHAR(100), -- For grouping questions (e.g., "Instrutor", "Infraestrutura")
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create survey_submissions table (user's survey attempt)
CREATE TABLE public.survey_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.course_classes(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(survey_id, user_id, class_id)
);

-- Create survey_answers table (individual answers)
CREATE TABLE public.survey_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.survey_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_rating INTEGER,
  answer_choices JSONB, -- For multiple choice: ["Option 1", "Option 3"]
  answered_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;

-- Surveys policies
CREATE POLICY "Admins can manage surveys"
  ON public.surveys FOR ALL
  USING (is_neohub_admin(auth.uid()) OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile))
  WITH CHECK (is_neohub_admin(auth.uid()) OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile));

CREATE POLICY "Users can view active surveys for their classes"
  ON public.surveys FOR SELECT
  USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM class_enrollments ce
        WHERE ce.class_id = surveys.class_id AND ce.user_id = auth.uid()
      )
      OR class_id IS NULL
    )
  );

-- Survey questions policies
CREATE POLICY "Admins can manage survey questions"
  ON public.survey_questions FOR ALL
  USING (is_neohub_admin(auth.uid()) OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile))
  WITH CHECK (is_neohub_admin(auth.uid()) OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile));

CREATE POLICY "Users can view questions of active surveys"
  ON public.survey_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM surveys s
      WHERE s.id = survey_questions.survey_id
      AND s.is_active = true
    )
  );

-- Survey submissions policies
CREATE POLICY "Users can manage own submissions"
  ON public.survey_submissions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all submissions"
  ON public.survey_submissions FOR SELECT
  USING (is_neohub_admin(auth.uid()) OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile));

-- Survey answers policies
CREATE POLICY "Users can manage own answers"
  ON public.survey_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM survey_submissions ss
      WHERE ss.id = survey_answers.submission_id AND ss.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM survey_submissions ss
      WHERE ss.id = survey_answers.submission_id AND ss.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all answers"
  ON public.survey_answers FOR SELECT
  USING (is_neohub_admin(auth.uid()) OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile));

-- Indexes for performance
CREATE INDEX idx_surveys_class_id ON public.surveys(class_id);
CREATE INDEX idx_surveys_is_active ON public.surveys(is_active);
CREATE INDEX idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX idx_survey_submissions_survey_id ON public.survey_submissions(survey_id);
CREATE INDEX idx_survey_submissions_user_id ON public.survey_submissions(user_id);
CREATE INDEX idx_survey_answers_submission_id ON public.survey_answers(submission_id);

-- Updated_at trigger for surveys
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();