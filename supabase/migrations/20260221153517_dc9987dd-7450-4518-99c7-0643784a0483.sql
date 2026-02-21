
CREATE OR REPLACE FUNCTION public.claim_pending_webhooks(p_limit int DEFAULT 10)
RETURNS SETOF lead_webhook_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  UPDATE lead_webhook_outbox
  SET status = 'processing',
      last_attempt_at = now()
  WHERE id IN (
    SELECT id FROM lead_webhook_outbox
    WHERE status = 'pending'
      AND attempts < max_attempts
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$function$;
