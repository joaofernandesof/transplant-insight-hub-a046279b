
CREATE OR REPLACE FUNCTION public.get_available_slots_flexible(
  p_user_id uuid,
  p_date date,
  p_duration_minutes integer DEFAULT 30,
  p_agenda_id uuid DEFAULT NULL
)
RETURNS TABLE(slot_start time, slot_end time, is_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_day_of_week INTEGER;
  v_config avivar_schedule_config%ROWTYPE;
  v_hours RECORD;
  v_current_time TIME;
  v_slot_end TIME;
  v_buffer INTEGER;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;
  
  -- Try to find config by agenda_id first
  IF p_agenda_id IS NOT NULL THEN
    SELECT * INTO v_config FROM avivar_schedule_config WHERE agenda_id = p_agenda_id;
  END IF;
  
  -- Fallback: find config by user_id (legacy single-agenda setup)
  IF v_config IS NULL THEN
    SELECT * INTO v_config FROM avivar_schedule_config 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  -- NEW: Fallback by account_id (AI agent passes account_id as p_user_id)
  IF v_config IS NULL THEN
    SELECT sc.* INTO v_config FROM avivar_schedule_config sc
    JOIN avivar_account_members am ON am.user_id = sc.user_id
    WHERE am.account_id = p_user_id
      AND (sc.agenda_id = p_agenda_id OR (p_agenda_id IS NULL AND sc.agenda_id IS NULL))
    ORDER BY sc.created_at DESC
    LIMIT 1;
  END IF;
  
  -- NEW: If still no config, generate default slots (08:00-18:00, Mon-Sat)
  IF v_config IS NULL THEN
    IF v_day_of_week BETWEEN 1 AND 6 THEN
      v_current_time := '08:00'::time;
      WHILE v_current_time <= '18:00'::time LOOP
        v_slot_end := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
        
        IF v_slot_end > '18:00'::time + (p_duration_minutes || ' minutes')::INTERVAL THEN
          EXIT;
        END IF;
        
        RETURN QUERY
        SELECT 
          v_current_time,
          v_slot_end,
          NOT EXISTS (
            SELECT 1 FROM avivar_appointments a
            WHERE (a.agenda_id = p_agenda_id OR (p_agenda_id IS NULL AND a.user_id = p_user_id))
              AND a.appointment_date = p_date
              AND a.status NOT IN ('cancelled')
              AND (
                (a.start_time::time <= v_current_time AND a.end_time::time > v_current_time)
                OR (a.start_time::time < v_slot_end AND a.end_time::time >= v_slot_end)
                OR (a.start_time::time >= v_current_time AND a.end_time::time <= v_slot_end)
              )
          );
        
        v_current_time := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
      END LOOP;
    END IF;
    RETURN;
  END IF;
  
  -- Buffer is for conflict checking, not for slot generation
  v_buffer := COALESCE(v_config.buffer_between, 0);
  
  -- Get ALL enabled periods for this day (support multiple periods)
  FOR v_hours IN 
    SELECT start_time, end_time 
    FROM avivar_schedule_hours 
    WHERE schedule_config_id = v_config.id 
      AND day_of_week = v_day_of_week 
      AND is_enabled = true
    ORDER BY start_time
  LOOP
    v_current_time := v_hours.start_time;
    
    WHILE v_current_time <= v_hours.end_time LOOP
      v_slot_end := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
      
      IF v_slot_end > v_hours.end_time + (p_duration_minutes || ' minutes')::INTERVAL THEN
        EXIT;
      END IF;
      
      RETURN QUERY
      SELECT 
        v_current_time,
        v_slot_end,
        NOT EXISTS (
          SELECT 1 FROM avivar_appointments a
          WHERE (a.agenda_id = p_agenda_id OR (p_agenda_id IS NULL AND a.user_id = p_user_id))
            AND a.appointment_date = p_date
            AND a.status NOT IN ('cancelled')
            AND (
              (a.start_time::time <= v_current_time AND (a.end_time::time + (v_buffer || ' minutes')::INTERVAL) > v_current_time)
              OR (a.start_time::time < v_slot_end AND a.end_time::time >= v_slot_end)
              OR (a.start_time::time >= v_current_time AND a.end_time::time <= v_slot_end)
            )
        )
        AND NOT EXISTS (
          SELECT 1 FROM avivar_schedule_blocks b
          WHERE b.schedule_config_id = v_config.id
            AND b.block_date = p_date
            AND (
              b.start_time IS NULL
              OR (b.start_time::time <= v_current_time AND b.end_time::time > v_current_time)
              OR (b.start_time::time < v_slot_end AND b.end_time::time >= v_slot_end)
            )
        );
      
      v_current_time := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
    END LOOP;
  END LOOP;
END;
$function$;
