
-- ====================================================================
-- AVIVAR AI QUEUE - Queue Mode (inspired by n8n BullMQ)
-- ====================================================================

-- Main queue table
CREATE TABLE public.avivar_ai_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.avivar_accounts(id),
  conversation_id UUID,
  lead_id UUID,
  user_id UUID NOT NULL,
  
  -- Job definition
  job_type TEXT NOT NULL DEFAULT 'ai_response',  -- ai_response, followup, automation
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Priority (1 = highest, 10 = lowest)
  priority INTEGER NOT NULL DEFAULT 5,
  
  -- Status machine: waiting → active → completed | failed | stalled
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'active', 'completed', 'failed', 'stalled', 'delayed')),
  
  -- Retry logic
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  backoff_ms INTEGER NOT NULL DEFAULT 3000,
  
  -- Worker tracking
  worker_id TEXT,
  locked_at TIMESTAMPTZ,
  stall_interval_ms INTEGER NOT NULL DEFAULT 60000,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  delay_until TIMESTAMPTZ,
  
  -- Results
  error_message TEXT,
  result JSONB,
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient job picking
CREATE INDEX idx_avivar_ai_queue_status_priority 
  ON public.avivar_ai_queue (status, priority, created_at) 
  WHERE status = 'waiting';

CREATE INDEX idx_avivar_ai_queue_stalled 
  ON public.avivar_ai_queue (status, locked_at) 
  WHERE status = 'active';

CREATE INDEX idx_avivar_ai_queue_delayed 
  ON public.avivar_ai_queue (status, delay_until) 
  WHERE status = 'delayed';

CREATE INDEX idx_avivar_ai_queue_conversation 
  ON public.avivar_ai_queue (conversation_id, status);

CREATE INDEX idx_avivar_ai_queue_account 
  ON public.avivar_ai_queue (account_id, status);

-- Queue metrics/stats table for monitoring
CREATE TABLE public.avivar_queue_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.avivar_accounts(id),
  metric_type TEXT NOT NULL, -- jobs_processed, avg_processing_time, error_rate, queue_depth
  metric_value NUMERIC NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_avivar_queue_metrics_type_period 
  ON public.avivar_queue_metrics (metric_type, period_start);

-- Function to pick next job (atomic, skip locked)
CREATE OR REPLACE FUNCTION public.avivar_queue_pick_job(
  p_worker_id TEXT,
  p_job_types TEXT[] DEFAULT ARRAY['ai_response'],
  p_max_jobs INTEGER DEFAULT 1
)
RETURNS SETOF public.avivar_ai_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First, recover stalled jobs
  UPDATE public.avivar_ai_queue
  SET status = 'waiting',
      worker_id = NULL,
      locked_at = NULL,
      updated_at = now()
  WHERE status = 'active'
    AND locked_at < now() - (stall_interval_ms || ' milliseconds')::INTERVAL;

  -- Move delayed jobs that are ready
  UPDATE public.avivar_ai_queue
  SET status = 'waiting',
      updated_at = now()
  WHERE status = 'delayed'
    AND delay_until <= now();

  -- Pick jobs atomically
  RETURN QUERY
  UPDATE public.avivar_ai_queue q
  SET status = 'active',
      worker_id = p_worker_id,
      locked_at = now(),
      started_at = COALESCE(started_at, now()),
      attempts = attempts + 1,
      updated_at = now()
  FROM (
    SELECT id
    FROM public.avivar_ai_queue
    WHERE status = 'waiting'
      AND job_type = ANY(p_job_types)
    ORDER BY priority ASC, created_at ASC
    LIMIT p_max_jobs
    FOR UPDATE SKIP LOCKED
  ) sub
  WHERE q.id = sub.id
  RETURNING q.*;
END;
$$;

-- Function to complete a job
CREATE OR REPLACE FUNCTION public.avivar_queue_complete_job(
  p_job_id UUID,
  p_worker_id TEXT,
  p_result JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_started TIMESTAMPTZ;
BEGIN
  SELECT started_at INTO v_started
  FROM public.avivar_ai_queue
  WHERE id = p_job_id AND worker_id = p_worker_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE public.avivar_ai_queue
  SET status = 'completed',
      completed_at = now(),
      result = p_result,
      processing_time_ms = EXTRACT(EPOCH FROM (now() - v_started))::INTEGER * 1000,
      updated_at = now()
  WHERE id = p_job_id;

  RETURN TRUE;
END;
$$;

-- Function to fail a job (with retry logic)
CREATE OR REPLACE FUNCTION public.avivar_queue_fail_job(
  p_job_id UUID,
  p_worker_id TEXT,
  p_error TEXT
)
RETURNS TEXT -- returns new status: 'waiting' (retry), 'failed' (permanent)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_job public.avivar_ai_queue;
  v_new_status TEXT;
BEGIN
  SELECT * INTO v_job
  FROM public.avivar_ai_queue
  WHERE id = p_job_id AND worker_id = p_worker_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- Check if we should retry
  IF v_job.attempts < v_job.max_attempts THEN
    -- Retry with exponential backoff
    v_new_status := 'delayed';
    UPDATE public.avivar_ai_queue
    SET status = v_new_status,
        worker_id = NULL,
        locked_at = NULL,
        error_message = p_error,
        delay_until = now() + ((v_job.backoff_ms * POWER(2, v_job.attempts - 1)) || ' milliseconds')::INTERVAL,
        updated_at = now()
    WHERE id = p_job_id;
  ELSE
    -- Permanent failure
    v_new_status := 'failed';
    UPDATE public.avivar_ai_queue
    SET status = v_new_status,
        failed_at = now(),
        error_message = p_error,
        processing_time_ms = EXTRACT(EPOCH FROM (now() - v_job.started_at))::INTEGER * 1000,
        updated_at = now()
    WHERE id = p_job_id;
  END IF;

  RETURN v_new_status;
END;
$$;

-- Function to get queue stats
CREATE OR REPLACE FUNCTION public.avivar_queue_stats(p_account_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'waiting', COUNT(*) FILTER (WHERE status = 'waiting'),
    'active', COUNT(*) FILTER (WHERE status = 'active'),
    'delayed', COUNT(*) FILTER (WHERE status = 'delayed'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > now() - INTERVAL '1 hour'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed' AND failed_at > now() - INTERVAL '1 hour'),
    'stalled', COUNT(*) FILTER (WHERE status = 'stalled'),
    'total_today', COUNT(*) FILTER (WHERE created_at > CURRENT_DATE),
    'avg_processing_ms', ROUND(AVG(processing_time_ms) FILTER (WHERE status = 'completed' AND completed_at > now() - INTERVAL '1 hour')),
    'throughput_per_min', COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > now() - INTERVAL '5 minutes') / 5.0
  ) INTO v_result
  FROM public.avivar_ai_queue
  WHERE (p_account_id IS NULL OR account_id = p_account_id);

  RETURN v_result;
END;
$$;

-- RLS policies
ALTER TABLE public.avivar_ai_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_queue_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access queue" ON public.avivar_ai_queue
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access metrics" ON public.avivar_queue_metrics
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for queue monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.avivar_ai_queue;
