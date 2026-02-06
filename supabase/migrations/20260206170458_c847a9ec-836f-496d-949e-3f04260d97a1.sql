
-- =============================================
-- Lead Release Queue System
-- =============================================

-- 1. Add release_status to leads table for queue management
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS release_status text DEFAULT 'available';

-- Update existing planilha leads that are NOT claimed to be 'available' (backward compat)
-- New imports will come as 'queued'

-- 2. Daily release tracking table
CREATE TABLE public.lead_release_daily (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  release_date date NOT NULL DEFAULT CURRENT_DATE,
  released_count integer NOT NULL DEFAULT 0,
  target_count integer NOT NULL DEFAULT 50,
  next_release_at timestamptz,
  last_release_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(release_date)
);

ALTER TABLE public.lead_release_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage daily release" ON public.lead_release_daily
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can read daily release" ON public.lead_release_daily
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Webhook outbox for reliability
CREATE TABLE public.lead_webhook_outbox (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'lead.available',
  payload jsonb NOT NULL,
  webhook_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  last_attempt_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_webhook_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhook outbox" ON public.lead_webhook_outbox
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. RPC: Atomically release one random queued lead
CREATE OR REPLACE FUNCTION public.release_random_queued_lead(p_mode text DEFAULT 'scheduled')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
  v_lead_record record;
  v_today date := CURRENT_DATE;
  v_daily record;
  v_new_count integer;
BEGIN
  -- Get or create daily record
  INSERT INTO lead_release_daily (release_date, released_count, target_count)
  VALUES (v_today, 0, 50)
  ON CONFLICT (release_date) DO NOTHING;

  SELECT * INTO v_daily FROM lead_release_daily WHERE release_date = v_today FOR UPDATE;

  -- Check daily limit (skip for manual_admin - still counts but doesn't block)
  IF p_mode = 'scheduled' AND v_daily.released_count >= v_daily.target_count THEN
    RETURN jsonb_build_object('success', false, 'reason', 'daily_limit_reached', 'released_count', v_daily.released_count);
  END IF;

  -- Pick one random queued lead (source=planilha) atomically
  UPDATE leads
  SET release_status = 'available',
      status = COALESCE(status, 'new'),
      available_at = now(),
      updated_at = now()
  WHERE id = (
    SELECT id FROM leads
    WHERE source = 'planilha'
      AND release_status = 'queued'
      AND claimed_by IS NULL
    ORDER BY random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id INTO v_lead_id;

  IF v_lead_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_queued_leads');
  END IF;

  -- Get lead details
  SELECT id, name, phone, email, source, city, state INTO v_lead_record
  FROM leads WHERE id = v_lead_id;

  -- Update daily counter
  v_new_count := v_daily.released_count + 1;
  UPDATE lead_release_daily
  SET released_count = v_new_count,
      last_release_at = now(),
      updated_at = now()
  WHERE release_date = v_today;

  -- Insert webhook outbox entry
  INSERT INTO lead_webhook_outbox (lead_id, event_type, payload, webhook_url)
  VALUES (
    v_lead_id,
    'lead.available',
    jsonb_build_object(
      'event', 'lead.available',
      'timestamp', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'lead', jsonb_build_object(
        'id', v_lead_record.id,
        'name', v_lead_record.name,
        'phone', v_lead_record.phone,
        'email', v_lead_record.email,
        'source', v_lead_record.source
      ),
      'release', jsonb_build_object(
        'mode', p_mode,
        'dailyCountAfterRelease', v_new_count
      )
    ),
    'https://n8n-n8n-start.bym1io.easypanel.host/webhook/lead'
  );

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'lead_name', v_lead_record.name,
    'daily_released', v_new_count,
    'mode', p_mode
  );
END;
$$;

-- 5. RPC: Get next release info for UI
CREATE OR REPLACE FUNCTION public.get_lead_release_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_daily record;
  v_queued_count bigint;
  v_next_lead record;
BEGIN
  -- Get daily record
  SELECT * INTO v_daily FROM lead_release_daily WHERE release_date = v_today;

  -- Count queued
  SELECT count(*) INTO v_queued_count FROM leads WHERE source = 'planilha' AND release_status = 'queued';

  -- Preview next lead (masked)
  SELECT id, 
    LEFT(name, 3) || '***' as masked_name, 
    city, state
  INTO v_next_lead
  FROM leads 
  WHERE source = 'planilha' AND release_status = 'queued'
  ORDER BY random()
  LIMIT 1;

  RETURN jsonb_build_object(
    'daily_released', COALESCE(v_daily.released_count, 0),
    'daily_target', COALESCE(v_daily.target_count, 50),
    'next_release_at', v_daily.next_release_at,
    'last_release_at', v_daily.last_release_at,
    'queued_count', v_queued_count,
    'next_lead_preview', CASE WHEN v_next_lead.id IS NOT NULL THEN
      jsonb_build_object('id', v_next_lead.id, 'masked_name', v_next_lead.masked_name, 'city', v_next_lead.city, 'state', v_next_lead.state)
    ELSE NULL END
  );
END;
$$;

-- 6. Enable realtime for lead_release_daily
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_release_daily;
