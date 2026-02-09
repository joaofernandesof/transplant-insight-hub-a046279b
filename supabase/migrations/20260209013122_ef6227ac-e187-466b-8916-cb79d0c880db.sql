
CREATE OR REPLACE FUNCTION public.generate_reminders_for_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      
      -- Só criar se a consulta ainda não aconteceu
      IF v_appointment_datetime > now() THEN
        -- Se o horário de envio já passou mas a consulta ainda é futura, agendar para envio imediato
        IF v_scheduled_for <= now() THEN
          v_scheduled_for := now();
        END IF;

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
$function$;
