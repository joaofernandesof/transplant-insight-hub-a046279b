-- Cadências automáticas para Avivar
-- Sistema de follow-up multi-canal com templates

-- Tabela de sequências de cadência
CREATE TABLE public.avivar_cadence_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'no_response', -- 'no_response', 'after_stage', 'custom'
  trigger_stage TEXT, -- qual etapa dispara a cadência
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_template BOOLEAN NOT NULL DEFAULT false, -- se é um template pré-configurado
  template_category TEXT, -- 'capilar', 'estetica', 'geral', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Passos individuais de cada cadência
CREATE TABLE public.avivar_cadence_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.avivar_cadence_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'sms', 'email', 'call'
  delay_minutes INTEGER NOT NULL DEFAULT 30, -- tempo após passo anterior ou trigger
  message_template TEXT NOT NULL,
  subject TEXT, -- para email
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Execuções de cadência por lead
CREATE TABLE public.avivar_cadence_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.avivar_cadence_sequences(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES public.avivar_patient_journeys(id) ON DELETE SET NULL,
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  lead_email TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled', 'responded'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_step_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de mensagens enviadas
CREATE TABLE public.avivar_cadence_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.avivar_cadence_executions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.avivar_cadence_steps(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avivar_cadence_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_cadence_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_cadence_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para cadence_sequences
CREATE POLICY "Users can view their own sequences and templates"
ON public.avivar_cadence_sequences
FOR SELECT
USING (auth.uid() = user_id OR is_template = true);

CREATE POLICY "Users can create their own sequences"
ON public.avivar_cadence_sequences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences"
ON public.avivar_cadence_sequences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sequences"
ON public.avivar_cadence_sequences
FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para cadence_steps
CREATE POLICY "Users can view steps of accessible sequences"
ON public.avivar_cadence_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_cadence_sequences s 
    WHERE s.id = sequence_id AND (s.user_id = auth.uid() OR s.is_template = true)
  )
);

CREATE POLICY "Users can manage steps of their sequences"
ON public.avivar_cadence_steps
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_cadence_sequences s 
    WHERE s.id = sequence_id AND s.user_id = auth.uid()
  )
);

-- Políticas para cadence_executions
CREATE POLICY "Users can view executions of their sequences"
ON public.avivar_cadence_executions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_cadence_sequences s 
    WHERE s.id = sequence_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage executions of their sequences"
ON public.avivar_cadence_executions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_cadence_sequences s 
    WHERE s.id = sequence_id AND s.user_id = auth.uid()
  )
);

-- Políticas para cadence_messages
CREATE POLICY "Users can view messages of their executions"
ON public.avivar_cadence_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_cadence_executions e 
    JOIN public.avivar_cadence_sequences s ON s.id = e.sequence_id
    WHERE e.id = execution_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage messages of their executions"
ON public.avivar_cadence_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.avivar_cadence_executions e 
    JOIN public.avivar_cadence_sequences s ON s.id = e.sequence_id
    WHERE e.id = execution_id AND s.user_id = auth.uid()
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_avivar_cadence_sequences_updated_at
BEFORE UPDATE ON public.avivar_cadence_sequences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir templates pré-configurados (admin templates)
INSERT INTO public.avivar_cadence_sequences (id, user_id, name, description, trigger_type, is_active, is_template, template_category)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Boas-vindas Capilar', 'Sequência de boas-vindas para leads de transplante capilar', 'no_response', true, true, 'capilar'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Recuperação de Lead Frio', 'Para leads que pararam de responder', 'no_response', true, true, 'geral'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Pós-Consulta', 'Follow-up após consulta de avaliação', 'after_stage', true, true, 'capilar'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'Urgência - Promoção', 'Cadência agressiva para promoções limitadas', 'custom', true, true, 'geral'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'Estética - Primeiro Contato', 'Boas-vindas para procedimentos estéticos', 'no_response', true, true, 'estetica');

-- Steps para template "Boas-vindas Capilar"
INSERT INTO public.avivar_cadence_steps (sequence_id, step_order, channel, delay_minutes, message_template) VALUES
  ('00000000-0000-0000-0000-000000000001', 1, 'whatsapp', 30, 'Olá {{nome}}! 👋 Vi que você demonstrou interesse em transplante capilar. Sou {{atendente}} da {{clinica}}. Posso te ajudar com alguma dúvida?'),
  ('00000000-0000-0000-0000-000000000001', 2, 'whatsapp', 120, '{{nome}}, sei que sua rotina é corrida! 📱 Quando tiver um minutinho, adoraria te mostrar como funciona nosso procedimento. Qual o melhor horário para conversarmos?'),
  ('00000000-0000-0000-0000-000000000001', 3, 'email', 1440, 'Prezado(a) {{nome}}, Espero que esteja bem! Notei que ainda não conseguimos conversar. Preparei um material especial sobre transplante capilar que pode te interessar. Quando puder, me avise!'),
  ('00000000-0000-0000-0000-000000000001', 4, 'whatsapp', 4320, '{{nome}}, última mensagem! 🙏 Estou disponível para tirar qualquer dúvida sobre o procedimento. Se preferir, posso agendar uma avaliação gratuita. Qual sua preferência?');

-- Steps para template "Recuperação de Lead Frio"
INSERT INTO public.avivar_cadence_steps (sequence_id, step_order, channel, delay_minutes, message_template) VALUES
  ('00000000-0000-0000-0000-000000000002', 1, 'whatsapp', 60, '{{nome}}, tudo bem? 😊 Faz um tempo que não conversamos. Surgiu alguma dúvida que posso ajudar?'),
  ('00000000-0000-0000-0000-000000000002', 2, 'sms', 1440, '{{nome}}, estamos com condições especiais esta semana! Entre em contato: {{telefone_clinica}}'),
  ('00000000-0000-0000-0000-000000000002', 3, 'email', 2880, 'Olá {{nome}}! Passando para ver se ainda tem interesse. Temos novidades que podem te interessar!'),
  ('00000000-0000-0000-0000-000000000002', 4, 'call', 4320, 'Ligar para {{nome}} - Lead não está respondendo há mais de 3 dias');

-- Steps para template "Pós-Consulta"
INSERT INTO public.avivar_cadence_steps (sequence_id, step_order, channel, delay_minutes, message_template) VALUES
  ('00000000-0000-0000-0000-000000000003', 1, 'whatsapp', 120, '{{nome}}, foi um prazer te conhecer hoje! 🤝 Ficou com alguma dúvida sobre o que conversamos?'),
  ('00000000-0000-0000-0000-000000000003', 2, 'whatsapp', 1440, 'Bom dia, {{nome}}! Pensou sobre nossa conversa de ontem? Estou aqui para te ajudar no que precisar!'),
  ('00000000-0000-0000-0000-000000000003', 3, 'whatsapp', 2880, '{{nome}}, vi que você ainda não retornou. Posso te enviar o orçamento novamente ou esclarecer algo?'),
  ('00000000-0000-0000-0000-000000000003', 4, 'call', 4320, 'Ligar para {{nome}} - Não respondeu após consulta');

-- Steps para template "Urgência - Promoção"
INSERT INTO public.avivar_cadence_steps (sequence_id, step_order, channel, delay_minutes, message_template) VALUES
  ('00000000-0000-0000-0000-000000000004', 1, 'whatsapp', 15, '🔥 {{nome}}, ÚLTIMA CHANCE! Nossa promoção de {{procedimento}} termina hoje! Não perca: {{desconto}}% OFF!'),
  ('00000000-0000-0000-0000-000000000004', 2, 'sms', 60, 'URGENTE {{nome}}: Promoção {{clinica}} acaba em 3h! Ligue agora: {{telefone_clinica}}'),
  ('00000000-0000-0000-0000-000000000004', 3, 'whatsapp', 180, '⏰ {{nome}}, restam apenas 2 vagas na promoção! Posso reservar uma pra você?'),
  ('00000000-0000-0000-0000-000000000004', 4, 'call', 240, 'Ligar URGENTE para {{nome}} - Promoção acabando');

-- Steps para template "Estética - Primeiro Contato"
INSERT INTO public.avivar_cadence_steps (sequence_id, step_order, channel, delay_minutes, message_template) VALUES
  ('00000000-0000-0000-0000-000000000005', 1, 'whatsapp', 30, 'Oi {{nome}}! 💜 Tudo bem? Vi que você se interessou por {{procedimento}}. Sou {{atendente}} e adoraria te ajudar!'),
  ('00000000-0000-0000-0000-000000000005', 2, 'whatsapp', 180, '{{nome}}, posso te enviar fotos de antes e depois? Nossos resultados são incríveis! 📸'),
  ('00000000-0000-0000-0000-000000000005', 3, 'email', 1440, 'Olá {{nome}}! Preparei um material completo sobre {{procedimento}} para você. Qualquer dúvida, estou à disposição!');