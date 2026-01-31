-- Drop and recreate the function with correct return type
DROP FUNCTION IF EXISTS get_avivar_agendas_for_ai(uuid);

CREATE FUNCTION get_avivar_agendas_for_ai(p_user_id uuid)
RETURNS TABLE(
  agenda_id uuid,
  agenda_name text,
  professional_name text,
  city text,
  address text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id as agenda_id, name as agenda_name, professional_name, city, address
  FROM avivar_agendas
  WHERE user_id = p_user_id AND is_active = true
  ORDER BY name;
$$;

-- Create a more flexible get_available_slots function that can work without agenda_id
CREATE OR REPLACE FUNCTION get_available_slots_flexible(
  p_user_id uuid,
  p_agenda_id uuid DEFAULT NULL,
  p_date date DEFAULT CURRENT_DATE + 1,
  p_duration_minutes integer DEFAULT 30
)
RETURNS TABLE(slot_start time, slot_end time, is_available boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_config avivar_schedule_config%ROWTYPE;
  v_hours RECORD;
  v_current_time TIME;
  v_slot_end TIME;
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
    
    -- Generate slots for this period
    WHILE v_current_time <= v_hours.end_time LOOP
      v_slot_end := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
      
      -- Check if slot end exceeds period end
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
              (a.start_time::time <= v_current_time AND a.end_time::time > v_current_time)
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
      
      v_current_time := v_current_time + (p_duration_minutes + COALESCE(v_config.buffer_between, 0) || ' minutes')::INTERVAL;
    END LOOP;
  END LOOP;
END;
$$;