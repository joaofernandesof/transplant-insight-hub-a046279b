
-- =============================================
-- 1. Tabela de Regras de Lembretes
-- =============================================
CREATE TABLE public.avivar_reminder_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Novo Lembrete',
  time_before_minutes INTEGER NOT NULL DEFAULT 1440,
  time_before_type TEXT NOT NULL DEFAULT 'hours' CHECK (time_before_type IN ('minutes', 'hours', 'days')),
  time_before_value INTEGER NOT NULL DEFAULT 24,
  message_template TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.avivar_reminder_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminder rules"
  ON public.avivar_reminder_rules
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- =============================================
-- 2. Tabela de Lembretes de Agendamento
-- =============================================
CREATE TABLE public.avivar_appointment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id),
  rule_id UUID REFERENCES public.avivar_reminder_rules(id) ON DELETE SET NULL,
  appointment_id UUID NOT NULL REFERENCES public.avivar_appointments(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.crm_conversations(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'sent', 'failed', 'cancelled', 'skipped')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.avivar_appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own appointment reminders"
  ON public.avivar_appointment_reminders
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.avivar_account_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE INDEX idx_appointment_reminders_scheduled
  ON public.avivar_appointment_reminders (status, scheduled_for)
  WHERE status = 'scheduled';

CREATE INDEX idx_appointment_reminders_appointment
  ON public.avivar_appointment_reminders (appointment_id);

-- =============================================
-- 3. Trigger Function: gerar lembretes ao criar/atualizar agendamento
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_reminders_for_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_rule RECORD;
  v_appointment_datetime TIMESTAMP WITH TIME ZONE;
  v_scheduled_for TIMESTAMP WITH TIME ZONE;
  v_final_message TEXT;
BEGIN
  -- Só processar se status é ativo (scheduled, confirmed, pending)
  IF NEW.status IN ('cancelled', 'no_show', 'completed') THEN
    -- Cancelar lembretes pendentes quando agendamento é cancelado
    IF TG_OP = 'UPDATE' AND OLD.status NOT IN ('cancelled', 'no_show', 'completed') THEN
      UPDATE public.avivar_appointment_reminders
      SET status = 'cancelled', updated_at = now()
      WHERE appointment_id = NEW.id
        AND status IN ('scheduled', 'processing');
    END IF;
    RETURN NEW;
  END IF;

  -- Calcular datetime do agendamento
  v_appointment_datetime := (NEW.appointment_date || ' ' || NEW.start_time)::TIMESTAMP WITH TIME ZONE;

  -- Se é UPDATE e data/hora mudou, cancelar lembretes antigos
  IF TG_OP = 'UPDATE' AND (OLD.appointment_date != NEW.appointment_date OR OLD.start_time != NEW.start_time) THEN
    UPDATE public.avivar_appointment_reminders
    SET status = 'cancelled', updated_at = now()
    WHERE appointment_id = NEW.id
      AND status IN ('scheduled', 'processing');
  END IF;

  -- Se é INSERT ou data/hora mudou, criar novos lembretes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.appointment_date != NEW.appointment_date OR OLD.start_time != NEW.start_time)) THEN
    FOR v_rule IN
      SELECT * FROM public.avivar_reminder_rules
      WHERE account_id = NEW.account_id
        AND is_active = true
      ORDER BY time_before_minutes DESC
    LOOP
      v_scheduled_for := v_appointment_datetime - (v_rule.time_before_minutes * INTERVAL '1 minute');
      
      -- Só criar se o horário de envio ainda não passou
      IF v_scheduled_for > now() THEN
        -- Substituir variáveis básicas na mensagem
        v_final_message := v_rule.message_template;
        v_final_message := REPLACE(v_final_message, '{{nome}}', COALESCE(NEW.patient_name, ''));
        v_final_message := REPLACE(v_final_message, '{{primeiro_nome}}', COALESCE(SPLIT_PART(NEW.patient_name, ' ', 1), ''));
        v_final_message := REPLACE(v_final_message, '{{data}}', TO_CHAR(NEW.appointment_date::DATE, 'DD/MM/YYYY'));
        v_final_message := REPLACE(v_final_message, '{{hora}}', LEFT(NEW.start_time, 5));
        v_final_message := REPLACE(v_final_message, '{{procedimento}}', COALESCE(NEW.service_type, ''));
        v_final_message := REPLACE(v_final_message, '{{profissional}}', COALESCE(NEW.professional_name, ''));
        v_final_message := REPLACE(v_final_message, '{{local}}', COALESCE(NEW.location, ''));

        INSERT INTO public.avivar_appointment_reminders (
          account_id, rule_id, appointment_id, lead_id, conversation_id,
          scheduled_for, message, status
        ) VALUES (
          NEW.account_id, v_rule.id, NEW.id, NEW.lead_id, NEW.conversation_id,
          v_scheduled_for, v_final_message, 'scheduled'
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================
-- 4. Triggers no avivar_appointments
-- =============================================
CREATE TRIGGER trg_generate_reminders_on_insert
  AFTER INSERT ON public.avivar_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_reminders_for_appointment();

CREATE TRIGGER trg_generate_reminders_on_update
  AFTER UPDATE ON public.avivar_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_reminders_for_appointment();

-- =============================================
-- 5. Trigger para updated_at
-- =============================================
CREATE TRIGGER update_reminder_rules_updated_at
  BEFORE UPDATE ON public.avivar_reminder_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_followup_updated_at();

CREATE TRIGGER update_appointment_reminders_updated_at
  BEFORE UPDATE ON public.avivar_appointment_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_followup_updated_at();
