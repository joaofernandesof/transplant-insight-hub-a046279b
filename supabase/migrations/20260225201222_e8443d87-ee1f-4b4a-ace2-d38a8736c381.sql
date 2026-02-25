
CREATE OR REPLACE FUNCTION public.release_random_queued_lead(p_mode text DEFAULT 'scheduled')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  v_priority_used text := 'fallback';
  v_webhook_url text := 'https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead';
  v_last_city text;
  v_last_state text;
BEGIN
  -- MUTEX: Advisory lock
  v_lock_acquired := pg_try_advisory_xact_lock(8675309);
  IF NOT v_lock_acquired THEN
    RETURN jsonb_build_object('success', false, 'reason', 'release_in_progress', 'message', 'Outra liberação está em andamento. Aguarde.');
  END IF;

  -- Get or create daily record
  INSERT INTO public.lead_release_daily (release_date, target_count, released_count)
  VALUES (v_today, v_target, 0) ON CONFLICT (release_date) DO NOTHING;

  SELECT * INTO v_daily FROM public.lead_release_daily WHERE release_date = v_today;
  v_released := COALESCE(v_daily.released_count, 0);

  -- Check daily limit (skip for manual_admin)
  IF p_mode != 'manual_admin' AND v_released >= v_target THEN
    RETURN jsonb_build_object('success', false, 'reason', 'daily_limit_reached', 'released_today', v_released, 'target', v_target);
  END IF;

  -- ======= ANTI-DUPLICATE LOCALITY: get last released lead's city/state =======
  SELECT city, state INTO v_last_city, v_last_state
  FROM public.leads
  WHERE release_status = 'available'
    AND available_at > now() - interval '10 minutes'
    AND source IN ('planilha', 'n8n')
    AND city IS NOT NULL AND state IS NOT NULL
  ORDER BY available_at DESC
  LIMIT 1;

  -- ======= PRIORITY 0: Cities within 100km of licensees (avoid last city+state) =======
  IF v_last_city IS NOT NULL THEN
    SELECT l.id INTO v_lead_id
    FROM public.leads l
    JOIN public.get_priority_cities_near_licensees(100.0) pc
      ON l.city = pc.city AND l.state = pc.state
    WHERE l.release_status = 'queued'
      AND NOT (l.city = v_last_city AND l.state = v_last_state)
    ORDER BY pc.distance_km ASC, random()
    LIMIT 1
    FOR UPDATE OF l SKIP LOCKED;
  END IF;

  -- If nothing found avoiding duplicates, try without filter
  IF v_lead_id IS NULL THEN
    SELECT l.id INTO v_lead_id
    FROM public.leads l
    JOIN public.get_priority_cities_near_licensees(100.0) pc
      ON l.city = pc.city AND l.state = pc.state
    WHERE l.release_status = 'queued'
    ORDER BY pc.distance_km ASC, random()
    LIMIT 1
    FOR UPDATE OF l SKIP LOCKED;
  END IF;

  IF v_lead_id IS NOT NULL THEN
    v_priority_used := 'proximity_100km';
  END IF;

  -- ======= PRIORITY 1: Licensee states (proportional) - avoid last city+state =======
  IF v_lead_id IS NULL THEN
    v_licensee_states := public.get_licensee_states();
    IF array_length(v_licensee_states, 1) > 0 THEN
      SELECT l.state INTO v_target_state
      FROM public.leads l
      JOIN public.get_licensee_count_by_state() lc ON lc.state = l.state
      WHERE l.release_status = 'queued'
        AND l.state IS NOT NULL
        AND l.state = ANY(v_licensee_states)
        AND (v_last_state IS NULL OR l.state != v_last_state)
      GROUP BY l.state, lc.licensee_count
      ORDER BY 
        lc.licensee_count::float / GREATEST(1, (
          SELECT COUNT(*) FROM public.leads l2
          WHERE l2.state = l.state 
            AND l2.release_status = 'available' 
            AND l2.claimed_by IS NULL
        )) DESC,
        COUNT(*) DESC,
        random()
      LIMIT 1;

      -- Fallback: if all queued are from the same state, allow it
      IF v_target_state IS NULL THEN
        SELECT l.state INTO v_target_state
        FROM public.leads l
        JOIN public.get_licensee_count_by_state() lc ON lc.state = l.state
        WHERE l.release_status = 'queued'
          AND l.state IS NOT NULL
          AND l.state = ANY(v_licensee_states)
        GROUP BY l.state, lc.licensee_count
        ORDER BY 
          lc.licensee_count::float / GREATEST(1, (
            SELECT COUNT(*) FROM public.leads l2
            WHERE l2.state = l.state 
              AND l2.release_status = 'available' 
              AND l2.claimed_by IS NULL
          )) DESC,
          COUNT(*) DESC,
          random()
        LIMIT 1;
      END IF;

      IF v_target_state IS NOT NULL THEN
        -- Try to pick a different city within the state
        IF v_last_city IS NOT NULL AND v_target_state = v_last_state THEN
          SELECT id INTO v_lead_id
          FROM public.leads
          WHERE release_status = 'queued' AND state = v_target_state
            AND city != v_last_city
          ORDER BY random() LIMIT 1
          FOR UPDATE SKIP LOCKED;
        END IF;

        -- Fallback: any lead from that state
        IF v_lead_id IS NULL THEN
          SELECT id INTO v_lead_id
          FROM public.leads
          WHERE release_status = 'queued' AND state = v_target_state
          ORDER BY random() LIMIT 1
          FOR UPDATE SKIP LOCKED;
        END IF;

        IF v_lead_id IS NOT NULL THEN
          v_priority_used := 'licensee_state_proportional';
        END IF;
      END IF;
    END IF;
  END IF;

  -- ======= PRIORITY 2: Any state (equalized) - avoid last state =======
  IF v_lead_id IS NULL THEN
    SELECT l.state INTO v_target_state
    FROM public.leads l
    WHERE l.release_status = 'queued' AND l.state IS NOT NULL
      AND (v_last_state IS NULL OR l.state != v_last_state)
    GROUP BY l.state
    ORDER BY (
      SELECT COUNT(*) FROM public.leads l2
      WHERE l2.state = l.state AND l2.release_status IN ('available', 'CLAIMED')
    ) ASC, COUNT(*) DESC, random()
    LIMIT 1;

    -- Fallback if all from same state
    IF v_target_state IS NULL THEN
      SELECT l.state INTO v_target_state
      FROM public.leads l
      WHERE l.release_status = 'queued' AND l.state IS NOT NULL
      GROUP BY l.state
      ORDER BY (
        SELECT COUNT(*) FROM public.leads l2
        WHERE l2.state = l.state AND l2.release_status IN ('available', 'CLAIMED')
      ) ASC, COUNT(*) DESC, random()
      LIMIT 1;
    END IF;

    IF v_target_state IS NOT NULL THEN
      SELECT id INTO v_lead_id
      FROM public.leads
      WHERE release_status = 'queued' AND state = v_target_state
      ORDER BY random() LIMIT 1
      FOR UPDATE SKIP LOCKED;
      IF v_lead_id IS NOT NULL THEN
        v_priority_used := 'equalized_all';
      END IF;
    END IF;
  END IF;

  -- ======= FALLBACK: any queued lead =======
  IF v_lead_id IS NULL THEN
    SELECT id INTO v_lead_id
    FROM public.leads WHERE release_status = 'queued'
    ORDER BY random() LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  IF v_lead_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_queued_leads', 'released_today', v_released);
  END IF;

  -- Release
  UPDATE public.leads
  SET release_status = 'available', available_at = now(), updated_at = now()
  WHERE id = v_lead_id
  RETURNING * INTO v_lead_record;

  UPDATE public.lead_release_daily
  SET released_count = released_count + 1, last_released_at = now()
  WHERE release_date = v_today;

  -- Webhook outbox
  INSERT INTO public.lead_webhook_outbox (
    lead_id, event_type, payload, webhook_url, status, attempts, max_attempts
  ) VALUES (
    v_lead_id, 'lead.available',
    jsonb_build_object(
      'event', 'lead.available', 'timestamp', now(), 'mode', p_mode,
      'lead', jsonb_build_object(
        'id', v_lead_record.id, 'name', v_lead_record.name,
        'phone', v_lead_record.phone, 'email', v_lead_record.email,
        'city', v_lead_record.city, 'state', v_lead_record.state,
        'source', v_lead_record.source
      )
    ),
    v_webhook_url, 'pending', 0, 5
  );

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'state', v_lead_record.state,
    'city', v_lead_record.city,
    'priority', v_priority_used,
    'released_today', v_released + 1,
    'target', v_target
  );
END;
$$;
