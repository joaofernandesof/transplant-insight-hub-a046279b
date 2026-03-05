
-- 1. Update trigger to PRESERVE {{checklist.*}} placeholders (resolve at send-time only)
CREATE OR REPLACE FUNCTION public.generate_reminders_for_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_timezone TEXT;
  v_appointment_datetime TIMESTAMP WITH TIME ZONE;
  v_scheduled_for TIMESTAMP WITH TIME ZONE;
  v_final_message TEXT;
BEGIN
  -- Cancel reminders if appointment is cancelled/no_show/completed
  IF NEW.status IN ('cancelled', 'no_show', 'completed') THEN
    IF TG_OP = 'UPDATE' AND OLD.status NOT IN ('cancelled', 'no_show', 'completed') THEN
      UPDATE public.avivar_appointment_reminders
      SET status = 'cancelled', updated_at = now()
      WHERE appointment_id = NEW.id
        AND status IN ('scheduled', 'processing');
    END IF;
    RETURN NEW;
  END IF;

  -- Get timezone
  SELECT COALESCE(sc.timezone, 'America/Sao_Paulo') INTO v_timezone
  FROM avivar_schedule_config sc
  WHERE sc.user_id = NEW.user_id
  LIMIT 1;

  IF v_timezone IS NULL THEN
    v_timezone := 'America/Sao_Paulo';
  END IF;

  -- Calculate appointment datetime in correct timezone
  v_appointment_datetime := ((NEW.appointment_date || ' ' || NEW.start_time)::TIMESTAMP)
                            AT TIME ZONE v_timezone;

  -- Cancel old reminders on reschedule
  IF TG_OP = 'UPDATE' AND (OLD.appointment_date != NEW.appointment_date OR OLD.start_time != NEW.start_time) THEN
    UPDATE public.avivar_appointment_reminders
    SET status = 'cancelled', updated_at = now()
    WHERE appointment_id = NEW.id
      AND status IN ('scheduled', 'processing');
  END IF;

  -- Generate new reminders
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
          CONTINUE;
        END IF;

        -- Anti-duplication check
        IF EXISTS (
          SELECT 1 FROM public.avivar_appointment_reminders
          WHERE appointment_id = NEW.id
            AND rule_id = v_rule.id
            AND status IN ('scheduled', 'processing', 'sent')
        ) THEN
          CONTINUE;
        END IF;

        -- Resolve ONLY appointment-level variables (available at INSERT time)
        v_final_message := v_rule.message_template;
        v_final_message := REPLACE(v_final_message, '{{nome}}', COALESCE(NEW.patient_name, ''));
        v_final_message := REPLACE(v_final_message, '{{primeiro_nome}}', COALESCE(SPLIT_PART(NEW.patient_name, ' ', 1), ''));
        v_final_message := REPLACE(v_final_message, '{{data}}', TO_CHAR(NEW.appointment_date::DATE, 'DD/MM/YYYY'));
        v_final_message := REPLACE(v_final_message, '{{hora}}', LEFT(NEW.start_time::TEXT, 5));
        v_final_message := REPLACE(v_final_message, '{{procedimento}}', COALESCE(NEW.service_type, ''));
        v_final_message := REPLACE(v_final_message, '{{profissional}}', COALESCE(NEW.professional_name, ''));
        v_final_message := REPLACE(v_final_message, '{{local}}', COALESCE(NEW.location, ''));

        -- NOTE: {{checklist.*}} placeholders are intentionally PRESERVED here.
        -- They will be resolved at send-time by the edge function avivar-process-reminders,
        -- when custom_fields data is guaranteed to exist.

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

-- 2. Fix existing scheduled reminders that lost their checklist vars:
-- Re-apply the original template with appointment vars, preserving {{checklist.*}} for send-time
UPDATE avivar_appointment_reminders ar
SET message = (
  SELECT 
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  rr.message_template,
                  '{{nome}}', COALESCE(a.patient_name, '')
                ),
                '{{primeiro_nome}}', COALESCE(SPLIT_PART(a.patient_name, ' ', 1), '')
              ),
              '{{data}}', TO_CHAR(a.appointment_date::DATE, 'DD/MM/YYYY')
            ),
            '{{hora}}', LEFT(a.start_time::TEXT, 5)
          ),
          '{{procedimento}}', COALESCE(a.service_type, '')
        ),
        '{{profissional}}', COALESCE(a.professional_name, '')
      ),
      '{{local}}', COALESCE(a.location, '')
    )
  FROM avivar_reminder_rules rr
  JOIN avivar_appointments a ON a.id = ar.appointment_id
  WHERE rr.id = ar.rule_id
)
WHERE ar.status = 'scheduled'
  AND ar.rule_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM avivar_reminder_rules rr2
    WHERE rr2.id = ar.rule_id
      AND rr2.message_template LIKE '%{{checklist.%'
  );
