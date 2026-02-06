
CREATE OR REPLACE FUNCTION public.release_random_queued_lead(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_lead_record record;
  v_today date := current_date;
  v_daily_count int;
  v_daily_limit int := 50;
  v_result jsonb;
  v_webhook_url text := 'https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead';
BEGIN
  -- Check daily limit
  SELECT count(*) INTO v_daily_count
  FROM leads
  WHERE acquired_by = p_user_id
    AND acquired_at::date = v_today;

  IF v_daily_count >= v_daily_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'daily_limit_reached',
      'message', format('Limite diário de %s leads atingido', v_daily_limit)
    );
  END IF;

  -- Pick a random queued lead
  SELECT id INTO v_lead_id
  FROM leads
  WHERE status = 'queued'
    AND acquired_by IS NULL
  ORDER BY random()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_lead_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_leads_available',
      'message', 'Nenhum lead disponível na fila'
    );
  END IF;

  -- Mark as available
  UPDATE leads
  SET status = 'available',
      acquired_by = p_user_id,
      acquired_at = now(),
      updated_at = now()
  WHERE id = v_lead_id;

  -- Get lead data
  SELECT id, name, phone, email, source, city, state INTO v_lead_record
  FROM leads WHERE id = v_lead_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'lead', jsonb_build_object(
      'id', v_lead_record.id,
      'name', v_lead_record.name,
      'phone', v_lead_record.phone,
      'email', v_lead_record.email,
      'source', v_lead_record.source,
      'city', v_lead_record.city,
      'state', v_lead_record.state
    ),
    'remaining_today', v_daily_limit - v_daily_count - 1
  );

  -- Insert into webhook outbox
  INSERT INTO lead_webhook_outbox (lead_id, webhook_url, payload)
  VALUES (
    v_lead_id,
    v_webhook_url,
    jsonb_build_object(
      'event', 'lead.available',
      'timestamp', now(),
      'lead', jsonb_build_object(
        'id', v_lead_record.id,
        'name', v_lead_record.name,
        'phone', v_lead_record.phone,
        'email', v_lead_record.email,
        'source', v_lead_record.source,
        'city', v_lead_record.city,
        'state', v_lead_record.state
      ),
      'release_mode', 'manual',
      'acquired_by', p_user_id
    )
  );

  RETURN v_result;
END;
$$;
