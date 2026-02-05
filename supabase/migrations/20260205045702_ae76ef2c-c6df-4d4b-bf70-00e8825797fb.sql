-- =============================================
-- SISTEMA DE FOLLOW-UP AUTOMÁTICO COMPLETO
-- =============================================

-- Tabela de regras de follow-up
CREATE TABLE public.avivar_followup_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Regra de Follow-up',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  delay_minutes INTEGER NOT NULL DEFAULT 30,
  delay_type VARCHAR(20) NOT NULL DEFAULT 'minutes' CHECK (delay_type IN ('minutes', 'hours', 'days')),
  message_template TEXT NOT NULL,
  urgency_level VARCHAR(20) NOT NULL DEFAULT 'soft' CHECK (urgency_level IN ('soft', 'medium', 'urgent')),
  use_ai_generation BOOLEAN DEFAULT false,
  ai_context TEXT,
  is_active BOOLEAN DEFAULT true,
  target_kanban_id UUID REFERENCES public.avivar_kanbans(id) ON DELETE SET NULL,
  move_to_column_id UUID REFERENCES public.avivar_kanban_columns(id) ON DELETE SET NULL,
  create_task_on_failure BOOLEAN DEFAULT false,
  max_attempts INTEGER DEFAULT 3,
  respect_business_hours BOOLEAN DEFAULT true,
  business_hours_start TIME DEFAULT '08:00',
  business_hours_end TIME DEFAULT '18:00',
  excluded_days INTEGER[] DEFAULT ARRAY[0, 6],
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para regras
CREATE INDEX idx_followup_rules_user_id ON public.avivar_followup_rules(user_id);
CREATE INDEX idx_followup_rules_active ON public.avivar_followup_rules(user_id, is_active);

-- Tabela de execuções de follow-up (agendamentos)
CREATE TABLE public.avivar_followup_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.avivar_followup_rules(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.crm_conversations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  lead_name VARCHAR(255),
  lead_phone VARCHAR(50),
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending', 'sent', 'delivered', 'read', 'responded', 'failed', 'cancelled', 'skipped')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  original_message TEXT,
  final_message TEXT,
  ai_generated BOOLEAN DEFAULT false,
  channel VARCHAR(30) DEFAULT 'whatsapp',
  error_message TEXT,
  skip_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para execuções
CREATE INDEX idx_followup_executions_user_id ON public.avivar_followup_executions(user_id);
CREATE INDEX idx_followup_executions_status ON public.avivar_followup_executions(status, scheduled_for);
CREATE INDEX idx_followup_executions_conversation ON public.avivar_followup_executions(conversation_id);
CREATE INDEX idx_followup_executions_scheduled ON public.avivar_followup_executions(scheduled_for) WHERE status IN ('scheduled', 'pending');

-- Tabela de métricas agregadas
CREATE TABLE public.avivar_followup_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_scheduled INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_responded INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_skipped INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER,
  by_attempt JSONB DEFAULT '{}',
  by_urgency JSONB DEFAULT '{}',
  by_hour JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, period_start, period_end)
);

-- Índices para métricas
CREATE INDEX idx_followup_metrics_user_period ON public.avivar_followup_metrics(user_id, period_start);

-- Tabela de templates de mensagem com variáveis
CREATE TABLE public.avivar_followup_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  urgency_level VARCHAR(20) DEFAULT 'soft' CHECK (urgency_level IN ('soft', 'medium', 'urgent')),
  message_template TEXT NOT NULL,
  variables_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para templates
CREATE INDEX idx_followup_templates_user ON public.avivar_followup_templates(user_id, is_active);

-- Habilitar RLS
ALTER TABLE public.avivar_followup_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_followup_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_followup_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_followup_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para avivar_followup_rules
CREATE POLICY "Users can view own followup rules"
  ON public.avivar_followup_rules FOR SELECT
  USING (user_id = auth.uid() OR public.has_avivar_access(auth.uid(), user_id));

CREATE POLICY "Users can create own followup rules"
  ON public.avivar_followup_rules FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own followup rules"
  ON public.avivar_followup_rules FOR UPDATE
  USING (user_id = auth.uid() OR public.has_avivar_access(auth.uid(), user_id));

CREATE POLICY "Users can delete own followup rules"
  ON public.avivar_followup_rules FOR DELETE
  USING (user_id = auth.uid());

-- Políticas RLS para avivar_followup_executions
CREATE POLICY "Users can view own followup executions"
  ON public.avivar_followup_executions FOR SELECT
  USING (user_id = auth.uid() OR public.has_avivar_access(auth.uid(), user_id));

CREATE POLICY "Users can create own followup executions"
  ON public.avivar_followup_executions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own followup executions"
  ON public.avivar_followup_executions FOR UPDATE
  USING (user_id = auth.uid() OR public.has_avivar_access(auth.uid(), user_id));

CREATE POLICY "Users can delete own followup executions"
  ON public.avivar_followup_executions FOR DELETE
  USING (user_id = auth.uid());

-- Políticas RLS para avivar_followup_metrics
CREATE POLICY "Users can view own followup metrics"
  ON public.avivar_followup_metrics FOR SELECT
  USING (user_id = auth.uid() OR public.has_avivar_access(auth.uid(), user_id));

CREATE POLICY "Users can manage own followup metrics"
  ON public.avivar_followup_metrics FOR ALL
  USING (user_id = auth.uid());

-- Políticas RLS para avivar_followup_templates
CREATE POLICY "Users can view own followup templates"
  ON public.avivar_followup_templates FOR SELECT
  USING (user_id = auth.uid() OR public.has_avivar_access(auth.uid(), user_id));

CREATE POLICY "Users can create own followup templates"
  ON public.avivar_followup_templates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own followup templates"
  ON public.avivar_followup_templates FOR UPDATE
  USING (user_id = auth.uid() OR public.has_avivar_access(auth.uid(), user_id));

CREATE POLICY "Users can delete own followup templates"
  ON public.avivar_followup_templates FOR DELETE
  USING (user_id = auth.uid());

-- Triggers de updated_at
CREATE OR REPLACE FUNCTION public.update_followup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_followup_rules_updated_at
  BEFORE UPDATE ON public.avivar_followup_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_followup_updated_at();

CREATE TRIGGER update_followup_executions_updated_at
  BEFORE UPDATE ON public.avivar_followup_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_followup_updated_at();

CREATE TRIGGER update_followup_metrics_updated_at
  BEFORE UPDATE ON public.avivar_followup_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_followup_updated_at();

CREATE TRIGGER update_followup_templates_updated_at
  BEFORE UPDATE ON public.avivar_followup_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_followup_updated_at();

-- Função para agendar follow-up automaticamente quando lead não responde
CREATE OR REPLACE FUNCTION public.schedule_followup_for_conversation(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_rule RECORD;
  v_lead RECORD;
  v_conversation RECORD;
  v_execution_id UUID;
  v_current_attempts INTEGER;
  v_scheduled_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get conversation and lead info
  SELECT c.*, l.id as lead_id, l.name as lead_name, l.phone as lead_phone
  INTO v_conversation
  FROM public.crm_conversations c
  JOIN public.leads l ON l.id = c.lead_id
  WHERE c.id = p_conversation_id;

  IF v_conversation IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count existing attempts for this conversation
  SELECT COUNT(*) INTO v_current_attempts
  FROM public.avivar_followup_executions
  WHERE conversation_id = p_conversation_id
    AND status NOT IN ('cancelled', 'skipped');

  -- Find the next applicable rule
  SELECT * INTO v_rule
  FROM public.avivar_followup_rules
  WHERE user_id = p_user_id
    AND is_active = true
    AND attempt_number = v_current_attempts + 1
  ORDER BY order_index
  LIMIT 1;

  IF v_rule IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate scheduled time
  v_scheduled_time := now() + (v_rule.delay_minutes * INTERVAL '1 minute');

  -- Adjust for business hours if needed
  IF v_rule.respect_business_hours THEN
    -- If scheduled time is outside business hours, move to next day
    IF v_scheduled_time::TIME < v_rule.business_hours_start THEN
      v_scheduled_time := DATE(v_scheduled_time) + v_rule.business_hours_start;
    ELSIF v_scheduled_time::TIME > v_rule.business_hours_end THEN
      v_scheduled_time := DATE(v_scheduled_time) + INTERVAL '1 day' + v_rule.business_hours_start;
    END IF;

    -- Skip excluded days
    WHILE EXTRACT(DOW FROM v_scheduled_time) = ANY(v_rule.excluded_days) LOOP
      v_scheduled_time := v_scheduled_time + INTERVAL '1 day';
    END LOOP;
  END IF;

  -- Create execution
  INSERT INTO public.avivar_followup_executions (
    user_id, rule_id, conversation_id, lead_id, lead_name, lead_phone,
    attempt_number, scheduled_for, original_message, ai_generated
  ) VALUES (
    p_user_id, v_rule.id, p_conversation_id, v_conversation.lead_id, 
    v_conversation.lead_name, v_conversation.lead_phone,
    v_current_attempts + 1, v_scheduled_time, v_rule.message_template, v_rule.use_ai_generation
  )
  RETURNING id INTO v_execution_id;

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para obter estatísticas de follow-up
CREATE OR REPLACE FUNCTION public.get_followup_stats(p_user_id UUID)
RETURNS TABLE (
  total_scheduled BIGINT,
  today_scheduled BIGINT,
  tomorrow_scheduled BIGINT,
  pending_now BIGINT,
  success_rate NUMERIC,
  avg_response_time_minutes NUMERIC,
  by_status JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE fe.status IN ('scheduled', 'pending'))::BIGINT as total_scheduled,
    COUNT(*) FILTER (WHERE fe.scheduled_for::DATE = CURRENT_DATE AND fe.status IN ('scheduled', 'pending'))::BIGINT as today_scheduled,
    COUNT(*) FILTER (WHERE fe.scheduled_for::DATE = CURRENT_DATE + 1 AND fe.status IN ('scheduled', 'pending'))::BIGINT as tomorrow_scheduled,
    COUNT(*) FILTER (WHERE fe.scheduled_for <= now() AND fe.status = 'pending')::BIGINT as pending_now,
    ROUND(
      (COUNT(*) FILTER (WHERE fe.status = 'responded')::NUMERIC / 
       NULLIF(COUNT(*) FILTER (WHERE fe.status IN ('sent', 'delivered', 'read', 'responded')), 0)::NUMERIC) * 100
    , 2) as success_rate,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (fe.responded_at - fe.sent_at)) / 60) FILTER (WHERE fe.responded_at IS NOT NULL)
    , 2) as avg_response_time_minutes,
    jsonb_build_object(
      'scheduled', COUNT(*) FILTER (WHERE fe.status = 'scheduled'),
      'pending', COUNT(*) FILTER (WHERE fe.status = 'pending'),
      'sent', COUNT(*) FILTER (WHERE fe.status = 'sent'),
      'delivered', COUNT(*) FILTER (WHERE fe.status = 'delivered'),
      'read', COUNT(*) FILTER (WHERE fe.status = 'read'),
      'responded', COUNT(*) FILTER (WHERE fe.status = 'responded'),
      'failed', COUNT(*) FILTER (WHERE fe.status = 'failed')
    ) as by_status
  FROM public.avivar_followup_executions fe
  WHERE fe.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Habilitar realtime para execuções
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_followup_executions;