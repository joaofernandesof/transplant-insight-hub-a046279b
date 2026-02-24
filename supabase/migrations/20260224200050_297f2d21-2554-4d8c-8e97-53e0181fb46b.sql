
-- Create a helper function that returns states with active licensees
CREATE OR REPLACE FUNCTION public.get_licensee_states()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(array_agg(DISTINCT nu.address_state), ARRAY[]::text[])
  FROM neohub_users nu
  JOIN neohub_user_profiles nup ON nup.neohub_user_id = nu.id
  WHERE nup.profile = 'licenciado'
    AND nup.is_active = true
    AND nu.is_active = true
    AND nu.address_state IS NOT NULL
$$;

-- Replace release_random_queued_lead to prioritize licensee states
CREATE OR REPLACE FUNCTION public.release_random_queued_lead(p_mode text DEFAULT 'auto')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_lead_id uuid;
  v_lead_record record;
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_daily record;
  v_target int := 50;
  v_released int;
  v_target_state text;
  v_lock_acquired boolean;
  v_licensee_states text[];
BEGIN
  -- MUTEX: Advisory lock to ensure only ONE lead is released at a time globally
  v_lock_acquired := pg_try_advisory_xact_lock(8675309);
  
  IF NOT v_lock_acquired THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'release_in_progress',
      'message', 'Outra liberação está em andamento. Aguarde.'
    );
  END IF;

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

  -- Get states where licensees are active
  v_licensee_states := public.get_licensee_states();

  -- PRIORITY 1: Pick from LICENSEE STATES first (states with active licensees)
  -- Among licensee states, pick the one with fewest available/claimed leads (equalized)
  IF array_length(v_licensee_states, 1) > 0 THEN
    SELECT l.state INTO v_target_state
    FROM leads l
    WHERE l.release_status = 'queued'
      AND l.state IS NOT NULL
      AND l.state = ANY(v_licensee_states)
    GROUP BY l.state
    ORDER BY (
      SELECT COUNT(*) FROM leads l2 
      WHERE l2.state = l.state 
        AND l2.release_status IN ('available', 'CLAIMED')
    ) ASC,
    COUNT(*) DESC,
    random()
    LIMIT 1;
  END IF;

  -- PRIORITY 2: If no queued leads in licensee states, fall back to equalized distribution across ALL states
  IF v_target_state IS NULL THEN
    SELECT l.state INTO v_target_state
    FROM leads l
    WHERE l.release_status = 'queued'
      AND l.state IS NOT NULL
    GROUP BY l.state
    ORDER BY (
      SELECT COUNT(*) FROM leads l2 
      WHERE l2.state = l.state 
        AND l2.release_status IN ('available', 'CLAIMED')
    ) ASC,
    COUNT(*) DESC,
    random()
    LIMIT 1;
  END IF;

  -- Pick a random queued lead from the target state (with row lock)
  IF v_target_state IS NOT NULL THEN
    SELECT id INTO v_lead_id
    FROM leads
    WHERE release_status = 'queued'
      AND state = v_target_state
    ORDER BY random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  -- Fallback: if no lead found, pick any queued lead
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
    'mode', p_mode,
    'priority', CASE WHEN v_lead_record.state = ANY(v_licensee_states) THEN 'licensee_state' ELSE 'other_state' END
  );
END;
$$;
