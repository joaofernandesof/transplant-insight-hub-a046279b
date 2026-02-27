
-- 1) Table to track per-state daily releases
CREATE TABLE IF NOT EXISTS public.lead_release_daily_state (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  release_date date NOT NULL,
  state text NOT NULL,
  target_count int NOT NULL DEFAULT 3,
  released_count int NOT NULL DEFAULT 0,
  last_released_at timestamptz,
  UNIQUE(release_date, state)
);

-- RLS: only service role accesses this
ALTER TABLE public.lead_release_daily_state ENABLE ROW LEVEL SECURITY;

-- Admin setting for per-state default limit
INSERT INTO public.admin_settings (key, value, description)
VALUES ('hotleads_release_per_state_limit', '3', 'Limite diário de liberação de leads por estado')
ON CONFLICT (key) DO NOTHING;

-- 2) Rewrite the release function with state-based queues
CREATE OR REPLACE FUNCTION public.release_random_queued_lead(p_mode text DEFAULT 'auto')
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
  v_global_target int := 80;
  v_global_released int;
  v_per_state_limit int;
  v_lock_acquired boolean;
  v_priority_used text := 'fallback';
  v_webhook_url text := 'https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead';
  v_last_cities text[];
  v_target_state text;
  v_state_released int;
  v_candidate_state record;
BEGIN
  -- MUTEX: Advisory lock
  v_lock_acquired := pg_try_advisory_xact_lock(8675309);
  IF NOT v_lock_acquired THEN
    RETURN jsonb_build_object('success', false, 'reason', 'release_in_progress', 'message', 'Outra liberação está em andamento. Aguarde.');
  END IF;

  -- Get per-state limit from settings
  SELECT COALESCE((SELECT value::int FROM admin_settings WHERE key = 'hotleads_release_per_state_limit'), 3) INTO v_per_state_limit;

  -- Get or create global daily record
  INSERT INTO public.lead_release_daily (release_date, target_count, released_count)
  VALUES (v_today, v_global_target, 0) ON CONFLICT (release_date) DO NOTHING;
  UPDATE public.lead_release_daily SET target_count = v_global_target WHERE release_date = v_today AND target_count != v_global_target;
  SELECT * INTO v_daily FROM public.lead_release_daily WHERE release_date = v_today;
  v_global_released := COALESCE(v_daily.released_count, 0);

  IF p_mode != 'manual_admin' AND v_global_released >= v_global_target THEN
    RETURN jsonb_build_object('success', false, 'reason', 'daily_limit_reached', 'released_today', v_global_released, 'target', v_global_target);
  END IF;

  -- ANTI-DUPLICATE: get last 5 released leads' cities
  SELECT array_agg(DISTINCT city) FILTER (WHERE city IS NOT NULL)
  INTO v_last_cities
  FROM (
    SELECT city FROM public.leads
    WHERE release_status = 'available' AND source IN ('planilha', 'n8n')
      AND city IS NOT NULL AND available_at IS NOT NULL
    ORDER BY available_at DESC NULLS LAST
    LIMIT 5
  ) recent;

  -- ======= PRIORITY 0: Proximity (100km from licensees) with state quota check =======
  -- Try proximity first, but respect per-state limit
  FOR v_candidate_state IN (
    SELECT DISTINCT pc.state
    FROM public.leads l
    JOIN public.get_priority_cities_near_licensees(100.0) pc
      ON l.city = pc.city AND l.state = pc.state
    WHERE l.release_status = 'queued'
    ORDER BY pc.state
  ) LOOP
    -- Check state quota
    INSERT INTO public.lead_release_daily_state (release_date, state, target_count, released_count)
    VALUES (v_today, v_candidate_state.state, v_per_state_limit, 0) ON CONFLICT (release_date, state) DO NOTHING;

    SELECT released_count INTO v_state_released
    FROM public.lead_release_daily_state
    WHERE release_date = v_today AND state = v_candidate_state.state;

    IF p_mode != 'manual_admin' AND v_state_released >= v_per_state_limit THEN
      CONTINUE; -- State quota reached, try next
    END IF;

    -- Try with anti-duplicate (avoid last cities)
    IF v_last_cities IS NOT NULL AND array_length(v_last_cities, 1) > 0 THEN
      SELECT l.id INTO v_lead_id
      FROM public.leads l
      JOIN public.get_priority_cities_near_licensees(100.0) pc
        ON l.city = pc.city AND l.state = pc.state
      WHERE l.release_status = 'queued'
        AND l.state = v_candidate_state.state
        AND NOT (l.city = ANY(v_last_cities))
      ORDER BY pc.distance_km ASC, random()
      LIMIT 1
      FOR UPDATE OF l SKIP LOCKED;
    END IF;

    -- Fallback without anti-duplicate
    IF v_lead_id IS NULL THEN
      SELECT l.id INTO v_lead_id
      FROM public.leads l
      JOIN public.get_priority_cities_near_licensees(100.0) pc
        ON l.city = pc.city AND l.state = pc.state
      WHERE l.release_status = 'queued'
        AND l.state = v_candidate_state.state
      ORDER BY pc.distance_km ASC, random()
      LIMIT 1
      FOR UPDATE OF l SKIP LOCKED;
    END IF;

    IF v_lead_id IS NOT NULL THEN
      v_priority_used := 'proximity_100km';
      v_target_state := v_candidate_state.state;
      EXIT; -- Found a lead
    END IF;
  END LOOP;

  -- ======= PRIORITY 1: State queues ordered by demand ratio =======
  IF v_lead_id IS NULL THEN
    FOR v_candidate_state IN (
      SELECT l.state, COUNT(*) as queued_count
      FROM public.leads l
      WHERE l.release_status = 'queued'
        AND l.state IS NOT NULL
      GROUP BY l.state
      ORDER BY
        -- Prioritize states with licensees and higher demand
        CASE WHEN l.state = ANY(public.get_licensee_states()) THEN 0 ELSE 1 END,
        queued_count DESC,
        random()
    ) LOOP
      -- Check state quota
      INSERT INTO public.lead_release_daily_state (release_date, state, target_count, released_count)
      VALUES (v_today, v_candidate_state.state, v_per_state_limit, 0) ON CONFLICT (release_date, state) DO NOTHING;

      SELECT released_count INTO v_state_released
      FROM public.lead_release_daily_state
      WHERE release_date = v_today AND state = v_candidate_state.state;

      IF p_mode != 'manual_admin' AND v_state_released >= v_per_state_limit THEN
        CONTINUE; -- Skip, quota reached
      END IF;

      -- Try with anti-duplicate
      IF v_last_cities IS NOT NULL THEN
        SELECT id INTO v_lead_id
        FROM public.leads
        WHERE release_status = 'queued' AND state = v_candidate_state.state
          AND NOT (city = ANY(v_last_cities))
        ORDER BY random() LIMIT 1
        FOR UPDATE SKIP LOCKED;
      END IF;

      IF v_lead_id IS NULL THEN
        SELECT id INTO v_lead_id
        FROM public.leads
        WHERE release_status = 'queued' AND state = v_candidate_state.state
        ORDER BY random() LIMIT 1
        FOR UPDATE SKIP LOCKED;
      END IF;

      IF v_lead_id IS NOT NULL THEN
        v_priority_used := 'state_queue';
        v_target_state := v_candidate_state.state;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- ======= FALLBACK: any queued lead (ignoring state quotas) =======
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
  VALUES (v_today, COALESCE(v_lead_record.state, 'N/A'), v_per_state_limit, 1, now())
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
          'source', v_lead_record.source
        ),
        'released_today', v_global_released + 1,
        'target', v_global_target,
        'priority', v_priority_used,
        'state_queue', COALESCE(v_lead_record.state, 'N/A'),
        'released_at', now()
      ),
      headers := jsonb_build_object('Content-Type', 'application/json')
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_record.id,
    'name', v_lead_record.name,
    'city', v_lead_record.city,
    'state', v_lead_record.state,
    'released_today', v_global_released + 1,
    'target', v_global_target,
    'priority', v_priority_used,
    'state_queue', COALESCE(v_lead_record.state, 'N/A')
  );
END;
$$;
