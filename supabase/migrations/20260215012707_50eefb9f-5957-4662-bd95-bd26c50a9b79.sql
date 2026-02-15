
CREATE OR REPLACE FUNCTION public.get_hotleads_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSON;
BEGIN
  WITH lead_data AS (
    SELECT 
      COALESCE(state, 'N/A') as state,
      COALESCE(city, 'N/A') as city,
      release_status,
      claimed_by,
      created_at,
      claimed_at
    FROM public.leads
    WHERE source IN ('planilha', 'n8n')
  ),
  totals AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE release_status = 'queued') as queued,
      COUNT(*) FILTER (WHERE release_status = 'available' AND claimed_by IS NULL) as available,
      COUNT(*) FILTER (WHERE claimed_by IS NOT NULL) as claimed
    FROM lead_data
  ),
  by_state AS (
    SELECT 
      state,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE release_status = 'available' AND claimed_by IS NULL) as available,
      COUNT(*) FILTER (WHERE claimed_by IS NOT NULL) as claimed,
      COUNT(*) FILTER (WHERE release_status = 'queued') as queued
    FROM lead_data
    GROUP BY state
    ORDER BY COUNT(*) DESC
  ),
  by_city AS (
    SELECT 
      city,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE release_status = 'available' AND claimed_by IS NULL) as available,
      COUNT(*) FILTER (WHERE claimed_by IS NOT NULL) as claimed
    FROM lead_data
    GROUP BY city
    ORDER BY COUNT(*) DESC
    LIMIT 20
  ),
  by_day AS (
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE claimed_by IS NOT NULL) as claimed
    FROM lead_data
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date
  ),
  claim_stats AS (
    SELECT 
      claimed_by as user_id,
      COUNT(*) as total_claimed,
      MIN(COALESCE(claimed_at, created_at)) as first_claim,
      MAX(COALESCE(claimed_at, created_at)) as last_claim
    FROM lead_data
    WHERE claimed_by IS NOT NULL
    GROUP BY claimed_by
  )
  SELECT json_build_object(
    'total', (SELECT total FROM totals),
    'queued', (SELECT queued FROM totals),
    'available', (SELECT available FROM totals),
    'claimed', (SELECT claimed FROM totals),
    'byState', (SELECT COALESCE(json_agg(json_build_object('state', state, 'total', total, 'available', available, 'claimed', claimed, 'queued', queued)), '[]'::json) FROM by_state),
    'byCity', (SELECT COALESCE(json_agg(json_build_object('city', city, 'total', total, 'available', available, 'claimed', claimed)), '[]'::json) FROM by_city),
    'byDay', (SELECT COALESCE(json_agg(json_build_object('date', date, 'total', total, 'claimed', claimed)), '[]'::json) FROM by_day),
    'claimStats', (SELECT COALESCE(json_agg(json_build_object('user_id', user_id, 'total_claimed', total_claimed, 'first_claim', first_claim, 'last_claim', last_claim)), '[]'::json) FROM claim_stats)
  ) INTO result;
  
  RETURN result;
END;
$$;
