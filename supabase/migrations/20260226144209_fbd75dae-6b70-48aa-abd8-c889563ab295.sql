DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO v_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'release_random_queued_lead'
    AND pg_get_function_identity_arguments(p.oid) = 'p_mode text'
  LIMIT 1;

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'Function public.release_random_queued_lead(p_mode text) not found';
  END IF;

  v_def := regexp_replace(v_def, 'v_target int := [0-9]+;', 'v_target int := 80;', 'g');
  EXECUTE v_def;

  SELECT pg_get_functiondef(p.oid)
    INTO v_def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_lead_release_info'
    AND coalesce(pg_get_function_identity_arguments(p.oid), '') = ''
  LIMIT 1;

  IF v_def IS NULL THEN
    RAISE EXCEPTION 'Function public.get_lead_release_info() not found';
  END IF;

  v_def := regexp_replace(
    v_def,
    'COALESCE[(]v_daily[.]target_count, *[0-9]+[)]',
    'COALESCE(v_daily.target_count, 80)',
    'g'
  );
  EXECUTE v_def;
END $$;