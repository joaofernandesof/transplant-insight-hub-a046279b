-- Create survey_questions_config table for managing survey questions
CREATE TABLE public.survey_questions_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_key TEXT NOT NULL UNIQUE,
  question_label TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'select', -- select, text, boolean, scale
  category TEXT NOT NULL DEFAULT 'general', -- instructor, monitor, infrastructure, profile, general
  options JSONB, -- for select type questions: ["Option 1", "Option 2", ...]
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_required BOOLEAN NOT NULL DEFAULT false,
  target_person TEXT, -- for instructor/monitor questions: "hygor", "patrick", etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.survey_questions_config ENABLE ROW LEVEL SECURITY;

-- Anyone can view survey questions config
CREATE POLICY "Anyone can view survey questions config"
  ON public.survey_questions_config
  FOR SELECT
  USING (true);

-- NeoHub admins can manage questions (using the function with auth.uid())
CREATE POLICY "NeoHub admins can manage survey questions config"
  ON public.survey_questions_config
  FOR ALL
  USING (public.is_neohub_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_survey_questions_config_updated_at
  BEFORE UPDATE ON public.survey_questions_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default questions based on existing day1_satisfaction_surveys structure
INSERT INTO public.survey_questions_config (question_key, question_label, question_type, category, options, order_index, is_visible, is_required, target_person) VALUES
-- General satisfaction
('q1_satisfaction_level', 'Nível de Satisfação Geral', 'select', 'general', '["Muito Satisfeito", "Satisfeito", "Neutro", "Insatisfeito", "Muito Insatisfeito"]', 1, true, true, null),
('q2_first_time_course', 'Primeira vez no curso?', 'boolean', 'profile', null, 2, true, false, null),

-- Dr. Hygor questions
('q3_hygor_expectations', 'Expectativas - Dr. Hygor', 'select', 'instructor', '["Superou Expectativas", "Atendeu Plenamente", "Atendeu Parcialmente", "Não Atendeu"]', 10, true, false, 'hygor'),
('q4_hygor_clarity', 'Clareza - Dr. Hygor', 'select', 'instructor', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 11, true, false, 'hygor'),
('q5_hygor_time', 'Tempo - Dr. Hygor', 'select', 'instructor', '["Mais do que suficiente", "Adequado", "Insuficiente"]', 12, true, false, 'hygor'),
('q6_hygor_liked_most', 'O que mais gostou - Dr. Hygor', 'text', 'instructor', null, 13, true, false, 'hygor'),
('q7_hygor_improve', 'O que melhorar - Dr. Hygor', 'text', 'instructor', null, 14, true, false, 'hygor'),

-- Dr. Patrick questions  
('q8_patrick_expectations', 'Expectativas - Dr. Patrick', 'select', 'instructor', '["Superou Expectativas", "Atendeu Plenamente", "Atendeu Parcialmente", "Não Atendeu"]', 20, true, false, 'patrick'),
('q9_patrick_clarity', 'Clareza - Dr. Patrick', 'select', 'instructor', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 21, true, false, 'patrick'),
('q10_patrick_time', 'Tempo - Dr. Patrick', 'select', 'instructor', '["Mais do que suficiente", "Adequado", "Insuficiente"]', 22, true, false, 'patrick'),
('q11_patrick_liked_most', 'O que mais gostou - Dr. Patrick', 'text', 'instructor', null, 23, true, false, 'patrick'),
('q12_patrick_improve', 'O que melhorar - Dr. Patrick', 'text', 'instructor', null, 24, true, false, 'patrick'),

-- Infrastructure questions
('q13_organization', 'Organização', 'select', 'infrastructure', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 30, true, false, null),
('q14_content_relevance', 'Relevância do Conteúdo', 'select', 'infrastructure', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 31, true, false, null),
('q15_teacher_competence', 'Competência dos Professores', 'select', 'infrastructure', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 32, true, false, null),
('q16_material_quality', 'Qualidade do Material', 'select', 'infrastructure', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 33, true, false, null),
('q17_punctuality', 'Pontualidade', 'select', 'infrastructure', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 34, true, false, null),
('q18_infrastructure', 'Infraestrutura', 'select', 'infrastructure', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 35, true, false, null),
('q19_support_team', 'Equipe de Apoio', 'select', 'infrastructure', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 36, true, false, null),
('q20_coffee_break', 'Coffee Break', 'select', 'infrastructure', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 37, true, false, null),

-- Open feedback
('q21_liked_most_today', 'O que mais gostou hoje', 'text', 'general', null, 40, true, false, null),
('q22_suggestions', 'Sugestões de Melhoria', 'text', 'general', null, 41, true, false, null),

-- Profile questions
('q23_start_preference', 'Preferência de Horário', 'select', 'profile', '["Manhã cedo (7h)", "Manhã (8h)", "Manhã (9h)"]', 50, true, false, null),
('q24_hunger_level', 'Nível de Fome (tempo dedicado)', 'select', 'profile', '["Mais de 10 horas", "De 5 a 10 horas", "Até 5 horas"]', 51, true, false, null),
('q25_urgency_level', 'Nível de Urgência', 'select', 'profile', '["Alta Urgência", "Média Urgência", "Sem Urgência"]', 52, true, false, null),
('q26_investment_level', 'Nível de Investimento', 'select', 'profile', '["Alto Investimento", "Médio Investimento", "Baixo Investimento"]', 53, true, false, null),
('q27_weekly_time', 'Tempo Semanal Disponível', 'select', 'profile', '["Mais de 10 horas", "De 5 a 10 horas", "Até 5 horas"]', 54, true, false, null),
('q28_current_reality', 'Realidade Atual', 'text', 'profile', null, 55, true, false, null),

-- Monitor questions
('q29_monitor_name', 'Nome do Monitor Avaliado', 'text', 'monitor', null, 60, true, false, null),
('q30_monitor_technical', 'Conhecimento Técnico - Monitor', 'select', 'monitor', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 61, true, false, null),
('q31_monitor_interest', 'Interesse em Ensinar - Monitor', 'select', 'monitor', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 62, true, false, null),
('q32_monitor_engagement', 'Engajamento - Monitor', 'select', 'monitor', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 63, true, false, null),
('q33_monitor_posture', 'Postura - Monitor', 'select', 'monitor', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 64, true, false, null),
('q34_monitor_communication', 'Comunicação - Monitor', 'select', 'monitor', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 65, true, false, null),
('q35_monitor_contribution', 'Contribuição - Monitor', 'select', 'monitor', '["Excelente", "Muito Bom", "Bom", "Regular", "Ruim"]', 66, true, false, null),
('q36_monitor_strength', 'Ponto Forte - Monitor', 'text', 'monitor', null, 67, true, false, null),
('q37_monitor_improve', 'O que Melhorar - Monitor', 'text', 'monitor', null, 68, true, false, null);

-- Create index for ordering
CREATE INDEX idx_survey_questions_config_order ON public.survey_questions_config (order_index, category);