
-- Function to get table/column info from information_schema
CREATE OR REPLACE FUNCTION public.get_system_tables_info()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_agg(row_data)
  FROM (
    SELECT jsonb_build_object(
      'table_name', c.table_name,
      'column_name', c.column_name,
      'data_type', c.data_type,
      'is_nullable', c.is_nullable,
      'column_default', c.column_default
    ) AS row_data
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  ) sub;
$$;

-- Function to get RLS policies
CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_agg(row_data)
  FROM (
    SELECT jsonb_build_object(
      'table_name', schemaname || '.' || tablename,
      'policy_name', policyname,
      'command', cmd,
      'permissive', permissive,
      'roles', roles,
      'expression', qual,
      'with_check', with_check
    ) AS row_data
    FROM pg_policies
    WHERE schemaname = 'public'
  ) sub;
$$;
