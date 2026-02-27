
CREATE OR REPLACE FUNCTION public.release_random_queued_lead(p_mode text DEFAULT 'scheduled')
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
  v_global_target int := 80;
  v_global_released int;
  v_lock_acquired boolean;
  v_priority_used text := 'round_robin';
  v_webhook_url text := 'https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead';
  v_target_state text;
  v_candidate record;
  v_licensee_states text[];
BEGIN
  -- MUTEX: Advisory lock
  v_lock_acquired := pg_try_advisory_xact_lock(8675309);
  IF NOT v_lock_acquired THEN
    RETURN jsonb_build_object('success', false, 'reason', 'release_in_progress');
  END IF;

  -- Get or create global daily record
  INSERT INTO public.lead_release_daily (release_date, target_count, released_count)
  VALUES (v_today, v_global_target, 0) ON CONFLICT (release_date) DO NOTHING;
  UPDATE public.lead_release_daily SET target_count = v_global_target WHERE release_date = v_today AND target_count != v_global_target;
  SELECT * INTO v_daily FROM public.lead_release_daily WHERE release_date = v_today;
  v_global_released := COALESCE(v_daily.released_count, 0);

  IF p_mode != 'manual_admin' AND v_global_released >= v_global_target THEN
    RETURN jsonb_build_object('success', false, 'reason', 'daily_limit_reached', 'released_today', v_global_released, 'target', v_global_target);
  END IF;

  -- Dynamically fetch states with active licensees
  v_licensee_states := public.get_licensee_states();

  -- ======= PRIORITIZED ROUND-ROBIN =======
  -- Priority 0: states with active licensees (round-robin within group)
  -- Priority 1: states without licensees (fallback, round-robin within group)
  FOR v_candidate IN (
    SELECT 
      q.state,
      q.queued_count,
      COALESCE(d.released_count, 0) as released_today,
      CASE WHEN q.state = ANY(v_licensee_states) THEN 0 ELSE 1 END as priority_group
    FROM (
      SELECT state, COUNT(*) as queued_count
      FROM public.leads
      WHERE release_status = 'queued' AND state IS NOT NULL
      GROUP BY state
    ) q
    LEFT JOIN public.lead_release_daily_state d
      ON d.release_date = v_today AND d.state = q.state
    ORDER BY 
      CASE WHEN q.state = ANY(v_licensee_states) THEN 0 ELSE 1 END ASC,  -- Licensee states first
      COALESCE(d.released_count, 0) ASC,  -- Round-robin within group
      random()                              -- Random tie-breaking
  ) LOOP
    -- Pick a random lead from this state
    SELECT id INTO v_lead_id
    FROM public.leads
    WHERE release_status = 'queued' AND state = v_candidate.state
    ORDER BY random() LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_lead_id IS NOT NULL THEN
      v_target_state := v_candidate.state;
      v_priority_used := CASE 
        WHEN v_candidate.priority_group = 0 THEN 'licensee_state'
        ELSE 'non_licensee_state'
      END;
      EXIT;
    END IF;
  END LOOP;

  -- FALLBACK: any queued lead
  IF v_lead_id IS NULL THEN
    SELECT id INTO v_lead_id
    FROM public.leads WHERE release_status = 'queued'
    ORDER BY random() LIMIT 1
    FOR UPDATE SKIP LOCKED;
    IF v_lead_id IS NOT NULL THEN
      v_priority_used := 'fallback_any';
    END IF;
  END IF;

  IF v_lead_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_queued_leads', 'released_today', v_global_released);
  END IF;

  -- Release the lead
  UPDATE public.leads
  SET release_status = 'available', available_at = now(), updated_at = now()
  WHERE id = v_lead_id
  RETURNING * INTO v_lead_record;

  -- Update global daily counter
  UPDATE public.lead_release_daily
  SET released_count = released_count + 1, last_released_at = now()
  WHERE release_date = v_today;

  -- Update per-state daily counter
  INSERT INTO public.lead_release_daily_state (release_date, state, target_count, released_count, last_released_at)
  VALUES (v_today, COALESCE(v_lead_record.state, 'N/A'), 999, 1, now())
  ON CONFLICT (release_date, state) DO UPDATE
  SET released_count = lead_release_daily_state.released_count + 1, last_released_at = now();

  -- Webhook
  BEGIN
    PERFORM net.http_post(
      url := v_webhook_url,
      body := jsonb_build_object(
        'event', 'lead_released',
        'lead', jsonb_build_object(
          'id', v_lead_record.id,
          'name', v_lead_record.name,
          'phone', v_lead_record.phone,
          'email', v_lead_record.email,
          'city', v_lead_record.city,
          'state', v_lead_record.state,
          'procedure_interest', v_lead_record.procedure_interest
        ),
        'mode', p_mode,
        'priority', v_priority_used,
        'released_today', v_global_released + 1,
        'target_state', v_target_state,
        'licensee_states', to_jsonb(v_licensee_states)
      ),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Webhook failed: %', SQLERRM;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_record.id,
    'name', v_lead_record.name,
    'city', v_lead_record.city,
    'state', v_lead_record.state,
    'priority', v_priority_used,
    'target_state', v_target_state,
    'released_today', v_global_released + 1,
    'mode', p_mode
  );
END;
$function$;
