
CREATE OR REPLACE FUNCTION public.release_random_queued_lead(p_mode text DEFAULT 'manual_admin')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead_id uuid;
  v_lead_record record;
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_daily record;
  v_target int := 50;
  v_released int;
  v_last_state text;
BEGIN
  -- Get or create daily record (BRT date)
  INSERT INTO lead_release_daily (release_date, target_count, released_count)
  VALUES (v_today, v_target, 0)
  ON CONFLICT (release_date) DO NOTHING;

  SELECT * INTO v_daily FROM lead_release_daily WHERE release_date = v_today;
  v_released := COALESCE(v_daily.released_count, 0);

  -- Check daily limit (skip for manual_admin)
  IF p_mode != 'manual_admin' AND v_released >= v_target THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'daily_limit_reached',
      'released_today', v_released,
      'target', v_target
    );
  END IF;

  -- Get the state of the last released lead to avoid consecutive same-state releases
  SELECT state INTO v_last_state
  FROM leads
  WHERE release_status = 'available'
    AND source IN ('planilha', 'n8n')
    AND available_at IS NOT NULL
  ORDER BY available_at DESC
  LIMIT 1;

  -- Try to pick a lead from a DIFFERENT state first
  IF v_last_state IS NOT NULL THEN
    SELECT id INTO v_lead_id
    FROM leads
    WHERE release_status = 'queued'
      AND (state IS NULL OR state != v_last_state)
    ORDER BY random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  -- Fallback: if no lead from a different state, pick any queued lead
  IF v_lead_id IS NULL THEN
    SELECT id INTO v_lead_id
    FROM leads
    WHERE release_status = 'queued'
    ORDER BY random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  IF v_lead_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'no_queued_leads',
      'released_today', v_released
    );
  END IF;

  -- Release the lead
  UPDATE leads
  SET release_status = 'available',
      available_at = now(),
      updated_at = now()
  WHERE id = v_lead_id
  RETURNING * INTO v_lead_record;

  -- Update daily counter
  UPDATE lead_release_daily
  SET released_count = released_count + 1,
      last_released_at = now()
  WHERE release_date = v_today;

  -- Insert webhook outbox
  INSERT INTO lead_webhook_outbox (
    lead_id, event_type, payload, webhook_url, status, attempts, max_attempts
  ) VALUES (
    v_lead_id,
    'lead.available',
    jsonb_build_object(
      'event', 'lead.available',
      'timestamp', now(),
      'mode', p_mode,
      'lead', jsonb_build_object(
        'id', v_lead_record.id,
        'name', v_lead_record.name,
        'phone', v_lead_record.phone,
        'email', v_lead_record.email,
        'source', v_lead_record.source,
        'city', v_lead_record.city,
        'state', v_lead_record.state
      )
    ),
    'https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead',
    'pending',
    0,
    3
  );

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'lead_name', v_lead_record.name,
    'lead_state', v_lead_record.state,
    'released_today', v_released + 1,
    'mode', p_mode
  );
END;
$function$;
