
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
  v_custom_fields JSONB;
  v_cf_key TEXT;
  v_cf_value TEXT;
BEGIN
  -- Só processar se status é ativo (scheduled, confirmed, pending)
  IF NEW.status IN ('cancelled', 'no_show', 'completed') THEN
    IF TG_OP = 'UPDATE' AND OLD.status NOT IN ('cancelled', 'no_show', 'completed') THEN
      UPDATE public.avivar_appointment_reminders
      SET status = 'cancelled', updated_at = now()
      WHERE appointment_id = NEW.id
        AND status IN ('scheduled', 'processing');
    END IF;
    RETURN NEW;
  END IF;

  v_appointment_datetime := (NEW.appointment_date || ' ' || NEW.start_time)::TIMESTAMP WITH TIME ZONE;

  IF TG_OP = 'UPDATE' AND (OLD.appointment_date != NEW.appointment_date OR OLD.start_time != NEW.start_time) THEN
    UPDATE public.avivar_appointment_reminders
    SET status = 'cancelled', updated_at = now()
    WHERE appointment_id = NEW.id
      AND status IN ('scheduled', 'processing');
  END IF;

  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.appointment_date != NEW.appointment_date OR OLD.start_time != NEW.start_time)) THEN
    FOR v_rule IN
      SELECT * FROM public.avivar_reminder_rules
      WHERE account_id = NEW.account_id
        AND is_active = true
      ORDER BY time_before_minutes DESC
    LOOP
      v_scheduled_for := v_appointment_datetime - (v_rule.time_before_minutes * INTERVAL '1 minute');
      
      IF v_appointment_datetime > now() THEN
        IF v_scheduled_for <= now() THEN
          v_scheduled_for := now();
        END IF;

        v_final_message := v_rule.message_template;
        v_final_message := REPLACE(v_final_message, '{{nome}}', COALESCE(NEW.patient_name, ''));
        v_final_message := REPLACE(v_final_message, '{{primeiro_nome}}', COALESCE(SPLIT_PART(NEW.patient_name, ' ', 1), ''));
        v_final_message := REPLACE(v_final_message, '{{data}}', TO_CHAR(NEW.appointment_date::DATE, 'DD/MM/YYYY'));
        v_final_message := REPLACE(v_final_message, '{{hora}}', LEFT(NEW.start_time::TEXT, 5));
        v_final_message := REPLACE(v_final_message, '{{procedimento}}', COALESCE(NEW.service_type, ''));
        v_final_message := REPLACE(v_final_message, '{{profissional}}', COALESCE(NEW.professional_name, ''));
        v_final_message := REPLACE(v_final_message, '{{local}}', COALESCE(NEW.location, ''));

        -- Resolver variáveis {{checklist.*}} dos custom_fields do kanban lead
        IF v_final_message LIKE '%{{checklist.%' AND NEW.lead_id IS NOT NULL THEN
          SELECT akl.custom_fields INTO v_custom_fields
          FROM avivar_kanban_leads akl
          JOIN leads l ON l.phone = akl.phone AND l.account_id = akl.account_id
          WHERE l.id = NEW.lead_id
            AND akl.custom_fields IS NOT NULL
          LIMIT 1;

          IF v_custom_fields IS NOT NULL THEN
            FOR v_cf_key, v_cf_value IN 
              SELECT key, value::text FROM jsonb_each_text(v_custom_fields)
            LOOP
              v_final_message := REPLACE(v_final_message, '{{checklist.' || v_cf_key || '}}', COALESCE(v_cf_value, ''));
            END LOOP;
          END IF;

          -- Limpar placeholders restantes sem valor
          v_final_message := regexp_replace(v_final_message, '\{\{checklist\.[^}]+\}\}', '', 'g');
        END IF;

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
