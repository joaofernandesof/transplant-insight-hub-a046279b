-- Create achievements table for defining all possible achievements
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  icon text NOT NULL DEFAULT 'trophy',
  points integer NOT NULL DEFAULT 10,
  requirement_type text NOT NULL DEFAULT 'manual',
  requirement_value integer DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_achievements table for tracking unlocked achievements
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements (public read)
CREATE POLICY "Anyone can view active achievements"
  ON public.achievements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage achievements"
  ON public.achievements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage user achievements"
  ON public.user_achievements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add total_points to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0;

-- Insert default achievements
INSERT INTO public.achievements (code, name, description, category, icon, points, requirement_type, requirement_value, order_index) VALUES
-- Onboarding achievements
('welcome', 'Bem-vindo!', 'Complete o tutorial de onboarding', 'onboarding', 'sparkles', 10, 'onboarding_complete', 1, 1),
('profile_complete', 'Perfil Completo', 'Preencha todos os dados do seu perfil', 'onboarding', 'user-check', 20, 'profile_complete', 1, 2),
('first_material', 'Explorador', 'Acesse a Central de Materiais', 'onboarding', 'book-open', 10, 'materials_viewed', 1, 3),

-- University achievements
('first_enrollment', 'Estudante', 'Matricule-se no seu primeiro curso', 'university', 'graduation-cap', 15, 'courses_enrolled', 1, 10),
('first_lesson', 'Primeira Aula', 'Complete sua primeira lição', 'university', 'play-circle', 15, 'lessons_completed', 1, 11),
('five_lessons', 'Dedicado', 'Complete 5 lições', 'university', 'book', 30, 'lessons_completed', 5, 12),
('ten_lessons', 'Aplicado', 'Complete 10 lições', 'university', 'award', 50, 'lessons_completed', 10, 13),
('first_course', 'Formado', 'Complete seu primeiro curso', 'university', 'medal', 100, 'courses_completed', 1, 14),
('three_courses', 'Especialista', 'Complete 3 cursos', 'university', 'crown', 200, 'courses_completed', 3, 15),

-- Leads achievements
('first_lead', 'Primeiro Contato', 'Reivindique seu primeiro lead', 'leads', 'flame', 20, 'leads_claimed', 1, 20),
('five_leads', 'Caçador de Leads', 'Reivindique 5 leads', 'leads', 'target', 50, 'leads_claimed', 5, 21),
('first_conversion', 'Primeira Venda', 'Converta seu primeiro lead', 'leads', 'dollar-sign', 100, 'leads_converted', 1, 22),
('five_conversions', 'Fechador', 'Converta 5 leads', 'leads', 'trending-up', 200, 'leads_converted', 5, 23),

-- Referral achievements
('first_referral', 'Indicador', 'Faça sua primeira indicação', 'referral', 'gift', 30, 'referrals_made', 1, 30),
('three_referrals', 'Embaixador', 'Faça 3 indicações', 'referral', 'users', 100, 'referrals_made', 3, 31),

-- Loyalty achievements
('one_month', '1 Mês de Jornada', 'Complete 1 mês como licenciado', 'loyalty', 'calendar', 25, 'days_member', 30, 40),
('three_months', '3 Meses de Jornada', 'Complete 3 meses como licenciado', 'loyalty', 'calendar-check', 50, 'days_member', 90, 41),
('six_months', '6 Meses de Jornada', 'Complete 6 meses como licenciado', 'loyalty', 'star', 100, 'days_member', 180, 42),
('one_year', '1 Ano de Jornada', 'Complete 1 ano como licenciado', 'loyalty', 'trophy', 250, 'days_member', 365, 43);