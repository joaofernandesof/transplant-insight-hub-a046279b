
-- 1) Reference table for city coordinates
CREATE TABLE IF NOT EXISTS public.city_geocodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(city, state)
);

ALTER TABLE public.city_geocodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read city_geocodes" ON public.city_geocodes FOR SELECT USING (true);

-- 2) Haversine distance function (returns km)
CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) RETURNS double precision
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT 6371.0 * 2 * asin(sqrt(
    sin(radians(lat2 - lat1) / 2) ^ 2 +
    cos(radians(lat1)) * cos(radians(lat2)) *
    sin(radians(lng2 - lng1) / 2) ^ 2
  ))
$$;

-- 3) Function to get priority cities within radius of licensees
CREATE OR REPLACE FUNCTION public.get_priority_cities_near_licensees(p_radius_km double precision DEFAULT 100.0)
RETURNS TABLE(city text, state text, distance_km double precision)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (lg.city, lg.state)
    lg.city,
    lg.state,
    public.haversine_km(lic_geo.lat, lic_geo.lng, lg.lat, lg.lng) as distance_km
  FROM (
    SELECT DISTINCT nu.address_city, nu.address_state
    FROM neohub_users nu
    JOIN neohub_user_profiles nup ON nup.neohub_user_id = nu.id
    WHERE nup.profile = 'licenciado' AND nup.is_active = true AND nu.is_active = true
      AND nu.address_city IS NOT NULL AND nu.address_state IS NOT NULL
  ) lic
  JOIN city_geocodes lic_geo ON lic_geo.city = lic.address_city AND lic_geo.state = lic.address_state
  CROSS JOIN city_geocodes lg
  WHERE public.haversine_km(lic_geo.lat, lic_geo.lng, lg.lat, lg.lng) <= p_radius_km
  ORDER BY lg.city, lg.state, public.haversine_km(lic_geo.lat, lic_geo.lng, lg.lat, lg.lng)
$$;

-- 4) Update release function with PRIORITY 0: cities near licensees
CREATE OR REPLACE FUNCTION public.release_random_queued_lead(p_mode text DEFAULT 'auto')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

  -- ======= PRIORITY 0: Cities within 100km of licensees =======
  SELECT l.id INTO v_lead_id
  FROM public.leads l
  JOIN public.get_priority_cities_near_licensees(100.0) pc
    ON l.city = pc.city AND l.state = pc.state
  WHERE l.release_status = 'queued'
  ORDER BY pc.distance_km ASC, random()
  LIMIT 1
  FOR UPDATE OF l SKIP LOCKED;

  IF v_lead_id IS NOT NULL THEN
    v_priority_used := 'proximity_100km';
  END IF;

  -- ======= PRIORITY 1: Licensee states (equalized) =======
  IF v_lead_id IS NULL THEN
    v_licensee_states := public.get_licensee_states();
    IF array_length(v_licensee_states, 1) > 0 THEN
      SELECT l.state INTO v_target_state
      FROM public.leads l
      WHERE l.release_status = 'queued'
        AND l.state IS NOT NULL
        AND l.state = ANY(v_licensee_states)
      GROUP BY l.state
      ORDER BY (
        SELECT COUNT(*) FROM public.leads l2
        WHERE l2.state = l.state AND l2.release_status IN ('available', 'CLAIMED')
      ) ASC, COUNT(*) DESC, random()
      LIMIT 1;

      IF v_target_state IS NOT NULL THEN
        SELECT id INTO v_lead_id
        FROM public.leads
        WHERE release_status = 'queued' AND state = v_target_state
        ORDER BY random() LIMIT 1
        FOR UPDATE SKIP LOCKED;
        IF v_lead_id IS NOT NULL THEN
          v_priority_used := 'licensee_state';
        END IF;
      END IF;
    END IF;
  END IF;

  -- ======= PRIORITY 2: Any state (equalized) =======
  IF v_lead_id IS NULL THEN
    SELECT l.state INTO v_target_state
    FROM public.leads l
    WHERE l.release_status = 'queued' AND l.state IS NOT NULL
    GROUP BY l.state
    ORDER BY (
      SELECT COUNT(*) FROM public.leads l2
      WHERE l2.state = l.state AND l2.release_status IN ('available', 'CLAIMED')
    ) ASC, COUNT(*) DESC, random()
    LIMIT 1;

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
        'source', v_lead_record.source, 'city', v_lead_record.city,
        'state', v_lead_record.state
      )
    ),
    'https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead',
    'pending', 0, 3
  );

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_record.id,
    'lead_name', v_lead_record.name,
    'lead_city', v_lead_record.city,
    'lead_state', v_lead_record.state,
    'released_today', v_released + 1,
    'target', v_target,
    'priority', v_priority_used
  );
END;
$$;
