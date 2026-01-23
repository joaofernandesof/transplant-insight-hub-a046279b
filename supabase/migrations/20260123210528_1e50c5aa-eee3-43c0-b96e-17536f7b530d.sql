-- Tabela para armazenar as respostas da pesquisa de satisfação
CREATE TABLE public.satisfaction_survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.course_classes(id) ON DELETE SET NULL,
  
  -- Status de conclusão
  is_completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  survey_version INTEGER NOT NULL DEFAULT 1,
  
  -- BLOCO 1: Identificação e Perfil Básico
  full_name TEXT,
  years_practicing TEXT, -- 'menos_3', '3_7', '7_12', 'acima_12'
  practice_format TEXT, -- 'consultorio', 'clinica', 'hospital', 'misto', 'nao_atuo'
  
  -- BLOCO 2: Satisfação Geral com o Curso
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
  expectations_met TEXT, -- 'nao_atendeu', 'parcialmente', 'atendeu_bem', 'superou'
  clarity_teachers TEXT, -- 'discordo_totalmente', 'discordo', 'neutro', 'concordo', 'concordo_totalmente'
  what_liked_most TEXT,
  what_could_improve TEXT,
  
  -- BLOCO 3: Clareza e Maturidade Estratégica
  evolution_path_clarity TEXT, -- 'confuso', 'algumas_ideias', 'boa_nocao', 'pronto_avancar'
  knows_next_step TEXT, -- 'nao_sei', 'ideia_sem_seguranca', 'sei_proximo', 'organizando'
  
  -- BLOCO 4: Momento Atual, Fome e Velocidade
  professional_moment TEXT, -- 'calma', 'orientacao', 'sozinho_dificil', 'salto_nivel'
  priority_score INTEGER CHECK (priority_score >= 1 AND priority_score <= 10),
  start_timeline TEXT, -- 'imediatamente', '30_dias', '2_3_meses', 'sem_pressa'
  
  -- BLOCO 5: Tempo Disponível e Investimento
  weekly_hours TEXT, -- 'menos_2', '2_4', '4_6', 'mais_6'
  time_vs_money TEXT, -- 'mais_tempo', 'equilibrado', 'mais_dinheiro'
  investment_comfort TEXT, -- 'ate_2500', '2500_5000', '5000_10000', 'acima_10000'
  
  -- BLOCO 6: Visão de Futuro e Posicionamento
  future_vision_12m TEXT, -- 'seguro_consistente', 'servico_proprio', 'referencia', 'liderando'
  success_result TEXT,
  
  -- BLOCO 7: Tecnologia, Comercial e Próximo Passo
  ai_relation TEXT, -- 'aplicar_logo', 'curiosidade', 'interessante_distante', 'tradicional'
  has_captation_plan TEXT, -- 'sim_claro', 'algumas_ideias', 'nao_pensei'
  wants_individual_talk TEXT, -- 'sim', 'talvez', 'prefiro_continuar'
  
  -- BLOCO 8: Feedback Final e Branding
  what_differentiates_best TEXT,
  memorable_phrase TEXT,
  
  -- Tags e classificação automática (preenchido após conclusão)
  lead_tags TEXT[] DEFAULT '{}',
  lead_score INTEGER DEFAULT 0,
  is_priority_lead BOOLEAN DEFAULT false,
  
  -- Progresso parcial (para salvar automaticamente)
  current_block INTEGER DEFAULT 1,
  partial_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraint: um usuário só pode ter uma resposta por turma
  UNIQUE(user_id, class_id)
);

-- Habilitar RLS
ALTER TABLE public.satisfaction_survey_responses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own responses"
ON public.satisfaction_survey_responses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
ON public.satisfaction_survey_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
ON public.satisfaction_survey_responses
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins podem ver todas as respostas
CREATE POLICY "Admins can view all responses"
ON public.satisfaction_survey_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_satisfaction_survey_responses_updated_at
BEFORE UPDATE ON public.satisfaction_survey_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função helper para verificar se o aluno completou a pesquisa
CREATE OR REPLACE FUNCTION public.has_completed_satisfaction_survey(_user_id uuid, _class_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.satisfaction_survey_responses
    WHERE user_id = _user_id
      AND is_completed = true
      AND (_class_id IS NULL OR class_id = _class_id)
  )
$$;

-- Índices para performance
CREATE INDEX idx_satisfaction_survey_user_id ON public.satisfaction_survey_responses(user_id);
CREATE INDEX idx_satisfaction_survey_class_id ON public.satisfaction_survey_responses(class_id);
CREATE INDEX idx_satisfaction_survey_completed ON public.satisfaction_survey_responses(is_completed);
CREATE INDEX idx_satisfaction_survey_priority ON public.satisfaction_survey_responses(is_priority_lead) WHERE is_priority_lead = true;