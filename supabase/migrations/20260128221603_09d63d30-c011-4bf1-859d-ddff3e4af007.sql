-- Create Meeting Agenda Templates table
CREATE TABLE public.meeting_agenda_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  guidance TEXT,
  talking_points TEXT[],
  required_before_next BOOLEAN DEFAULT false,
  estimated_minutes INTEGER DEFAULT 5,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Meeting Agendas (instances for actual meetings)
CREATE TABLE public.meeting_agendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE,
  meeting_time TIME,
  status TEXT DEFAULT 'pendente',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Meeting Agenda Items (items in an actual meeting)
CREATE TABLE public.meeting_agenda_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_id UUID NOT NULL REFERENCES public.meeting_agendas(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.meeting_agenda_templates(id),
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  guidance TEXT,
  talking_points TEXT[],
  estimated_minutes INTEGER DEFAULT 5,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_agenda_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_agenda_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates (everyone can view, authenticated can create)
CREATE POLICY "Anyone can view agenda templates" 
ON public.meeting_agenda_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated can create templates" 
ON public.meeting_agenda_templates 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creator can update templates" 
ON public.meeting_agenda_templates 
FOR UPDATE 
USING (created_by = auth.uid() OR created_by IS NULL);

-- RLS policies for agendas
CREATE POLICY "Authenticated can view agendas" 
ON public.meeting_agendas 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can create agendas" 
ON public.meeting_agendas 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creator can update agendas" 
ON public.meeting_agendas 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Creator can delete agendas" 
ON public.meeting_agendas 
FOR DELETE 
USING (created_by = auth.uid());

-- RLS policies for agenda items
CREATE POLICY "Authenticated can view agenda items" 
ON public.meeting_agenda_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can create agenda items" 
ON public.meeting_agenda_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update agenda items" 
ON public.meeting_agenda_items 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete agenda items" 
ON public.meeting_agenda_items 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_agenda_templates_category ON public.meeting_agenda_templates(category);
CREATE INDEX idx_agenda_items_agenda ON public.meeting_agenda_items(agenda_id);
CREATE INDEX idx_agendas_created_by ON public.meeting_agendas(created_by);
CREATE INDEX idx_agendas_date ON public.meeting_agendas(meeting_date);

-- Insert default templates for common meeting types
INSERT INTO public.meeting_agenda_templates (category, order_index, title, description, guidance, talking_points, required_before_next, estimated_minutes) VALUES
-- Reunião de Equipe
('reuniao_equipe', 1, '👋 Abertura e Check-in', 'Início da reunião e alinhamento inicial', 'Comece perguntando como todos estão. Isso cria conexão e permite identificar preocupações.', ARRAY['Como está o time?', 'Algum impedimento urgente?', 'Celebrar conquistas recentes'], true, 5),
('reuniao_equipe', 2, '📊 Revisão de Métricas', 'Analisar indicadores da semana/mês', 'Apresente os números de forma objetiva. Foque em tendências, não apenas valores absolutos.', ARRAY['KPIs principais', 'Comparativo com período anterior', 'Metas vs realizado'], true, 10),
('reuniao_equipe', 3, '🎯 Status dos Projetos', 'Atualização de cada projeto em andamento', 'Cada responsável reporta brevemente. Use o formato: O que fez, O que fará, Bloqueios.', ARRAY['Projeto A - status', 'Projeto B - status', 'Identificar bloqueios'], true, 15),
('reuniao_equipe', 4, '⚠️ Problemas e Riscos', 'Discussão de desafios identificados', 'Incentive transparência. Problemas escondidos crescem. Foque em soluções, não culpados.', ARRAY['Listar problemas identificados', 'Priorizar por impacto', 'Definir responsáveis'], true, 10),
('reuniao_equipe', 5, '💡 Ideias e Melhorias', 'Espaço para sugestões do time', 'Valorize todas as sugestões. Anote para análise posterior se não houver tempo.', ARRAY['Colher sugestões', 'Avaliar viabilidade', 'Priorizar implementação'], false, 10),
('reuniao_equipe', 6, '📝 Próximos Passos', 'Definir ações e responsáveis', 'Seja específico: O QUE, QUEM e QUANDO. Confirme entendimento de cada pessoa.', ARRAY['Listar ações', 'Atribuir responsáveis', 'Definir prazos'], true, 5),
('reuniao_equipe', 7, '✅ Encerramento', 'Finalização e alinhamento final', 'Resuma as decisões tomadas. Confirme próxima reunião. Agradeça a participação.', ARRAY['Resumir decisões', 'Confirmar próxima reunião', 'Agradecimentos'], true, 5),

-- One-on-One
('one_on_one', 1, '🤝 Conexão Pessoal', 'Início informal para criar rapport', 'Demonstre interesse genuíno na pessoa. Pergunte sobre vida pessoal se apropriado.', ARRAY['Como você está?', 'Algo acontecendo fora do trabalho?', 'Criar ambiente seguro'], true, 5),
('one_on_one', 2, '📈 Progresso e Conquistas', 'Reconhecer realizações recentes', 'Seja específico nos elogios. Mencione exemplos concretos do bom trabalho.', ARRAY['O que correu bem?', 'Quais conquistas destacar?', 'Reconhecimento específico'], true, 10),
('one_on_one', 3, '🎯 Desafios Atuais', 'Entender dificuldades e bloqueios', 'Escute mais do que fale. Faça perguntas abertas. Não julgue.', ARRAY['Quais os maiores desafios?', 'O que está travando?', 'Como posso ajudar?'], true, 15),
('one_on_one', 4, '🌱 Desenvolvimento', 'Discutir crescimento profissional', 'Conecte aspirações da pessoa com oportunidades disponíveis. Seja realista mas encorajador.', ARRAY['Metas de carreira', 'Skills a desenvolver', 'Próximos passos'], true, 10),
('one_on_one', 5, '💬 Feedback', 'Dar e receber feedback', 'Seja construtivo e específico. Peça feedback sobre sua liderança também.', ARRAY['Feedback para a pessoa', 'Pedir feedback para você', 'Acordos de melhoria'], true, 10),
('one_on_one', 6, '📋 Ações e Compromissos', 'Definir próximas ações', 'Anote tudo. Envie resumo por escrito. Acompanhe na próxima 1:1.', ARRAY['O que você vai fazer?', 'O que eu vou fazer?', 'Quando nos falamos de novo?'], true, 5),

-- Kickoff de Projeto
('kickoff_projeto', 1, '🎯 Visão e Objetivos', 'Apresentar propósito do projeto', 'Comece pelo PORQUÊ. Conecte com a estratégia maior da empresa.', ARRAY['Por que este projeto?', 'Qual o objetivo principal?', 'Como mede sucesso?'], true, 10),
('kickoff_projeto', 2, '👥 Stakeholders e Papéis', 'Definir envolvidos e responsabilidades', 'Seja claro sobre quem decide o quê. Evite ambiguidades de responsabilidade.', ARRAY['Quem é o sponsor?', 'Quem são os key users?', 'Matriz RACI'], true, 10),
('kickoff_projeto', 3, '📦 Escopo e Entregáveis', 'Detalhar o que será entregue', 'Defina o que está FORA do escopo tão claramente quanto o que está dentro.', ARRAY['O que vamos entregar?', 'O que NÃO vamos entregar?', 'MVPs vs nice-to-haves'], true, 15),
('kickoff_projeto', 4, '📅 Cronograma e Marcos', 'Apresentar timeline e milestones', 'Inclua buffers para imprevistos. Marque pontos de decisão go/no-go.', ARRAY['Data de início e fim', 'Marcos principais', 'Pontos de decisão'], true, 10),
('kickoff_projeto', 5, '⚠️ Riscos e Dependências', 'Mapear riscos e mitigações', 'Ser transparente sobre riscos cria confiança. Mostre que pensou nas mitigações.', ARRAY['Principais riscos', 'Planos de contingência', 'Dependências externas'], true, 10),
('kickoff_projeto', 6, '🔧 Ferramentas e Processos', 'Alinhar como vamos trabalhar', 'Estabeleça rituais de comunicação. Defina onde ficará a documentação.', ARRAY['Ferramentas de comunicação', 'Frequência de status', 'Repositório de docs'], true, 5),
('kickoff_projeto', 7, '❓ Perguntas e Dúvidas', 'Esclarecer pontos pendentes', 'Incentive perguntas. Não há pergunta boba neste momento.', ARRAY['Tirar dúvidas', 'Levantar preocupações', 'Próximos passos'], true, 10),

-- Reunião de Alinhamento Comercial
('alinhamento_comercial', 1, '📊 Pipeline Atual', 'Revisão do funil de vendas', 'Analise cada estágio do funil. Identifique gargalos e oportunidades.', ARRAY['Leads por estágio', 'Taxa de conversão', 'Deals em risco'], true, 15),
('alinhamento_comercial', 2, '🎯 Metas vs Realizado', 'Análise de performance', 'Compare com o período anterior. Identifique padrões de sazonalidade.', ARRAY['Meta do período', 'Realizado até agora', 'Projeção de fechamento'], true, 10),
('alinhamento_comercial', 3, '🔥 Oportunidades Quentes', 'Deals prioritários', 'Foque nas oportunidades com maior probabilidade e valor. Defina ações específicas.', ARRAY['Top 5 oportunidades', 'Próximos passos de cada', 'Suporte necessário'], true, 15),
('alinhamento_comercial', 4, '💡 Estratégias de Abordagem', 'Táticas para avançar deals', 'Compartilhe cases de sucesso. O que funcionou pode ser replicado.', ARRAY['O que está funcionando?', 'Objeções frequentes', 'Scripts e abordagens'], true, 10),
('alinhamento_comercial', 5, '📝 Ações da Semana', 'Compromissos individuais', 'Cada vendedor define 3 ações prioritárias. Menos é mais.', ARRAY['Ações prioritárias', 'Responsáveis', 'Deadlines'], true, 5);