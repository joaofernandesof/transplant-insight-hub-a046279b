-- Corrigir a função get_available_slots_flexible para não adicionar buffer no incremento visual
-- O buffer deve ser usado apenas para validar conflitos, não para gerar slots
-- Os slots devem ser gerados a cada consultation_duration minutos (ex: 08:00, 08:30, 09:00)

CREATE OR REPLACE FUNCTION public.get_available_slots_flexible(
  p_user_id uuid, 
  p_agenda_id uuid DEFAULT NULL::uuid, 
  p_date date DEFAULT (CURRENT_DATE + 1), 
  p_duration_minutes integer DEFAULT 30
)
RETURNS TABLE(slot_start time without time zone, slot_end time without time zone, is_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Try to find config by agenda_id first, then by user_id without agenda_id
  IF p_agenda_id IS NOT NULL THEN
    SELECT * INTO v_config FROM avivar_schedule_config WHERE agenda_id = p_agenda_id;
  END IF;
  
  -- Fallback: find any config for this user (for legacy single-agenda setup)
  IF v_config IS NULL THEN
    SELECT * INTO v_config FROM avivar_schedule_config 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  IF v_config IS NULL THEN
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
    
    -- Generate slots for this period - INCREMENT BY DURATION ONLY, NOT BUFFER
    -- This matches the frontend behavior in useAvivarScheduleConfig.ts
    WHILE v_current_time <= v_hours.end_time LOOP
      v_slot_end := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
      
      -- Check if slot end exceeds period end (allow last slot to start at end_time)
      IF v_slot_end > v_hours.end_time + (p_duration_minutes || ' minutes')::INTERVAL THEN
        EXIT;
      END IF;
      
      RETURN QUERY
      SELECT 
        v_current_time,
        v_slot_end,
        -- Check availability considering buffer for conflicts
        NOT EXISTS (
          SELECT 1 FROM avivar_appointments a
          WHERE (a.agenda_id = p_agenda_id OR (p_agenda_id IS NULL AND a.user_id = p_user_id))
            AND a.appointment_date = p_date
            AND a.status NOT IN ('cancelled')
            AND (
              -- Check if appointment overlaps with slot (including buffer)
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
      
      -- INCREMENT BY DURATION ONLY - not duration + buffer
      -- Buffer affects availability check, not slot generation
      v_current_time := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
    END LOOP;
  END LOOP;
END;
$function$;