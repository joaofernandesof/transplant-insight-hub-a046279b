-- Allow test lead creation for specific permitted users
-- These are non-admin users who should be able to create test leads
CREATE OR REPLACE FUNCTION is_test_lead_creator(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = uid 
    AND email IN ('nicholas.barreto@neofolic.com.br')
  )
  OR has_role(uid, 'admin'::app_role);
$$;

-- Policy to allow test lead creators to insert leads without account_id
CREATE POLICY "test_lead_creators_insert"
ON public.leads
FOR INSERT
WITH CHECK (
  account_id IS NULL 
  AND is_test_lead_creator(auth.uid())
);
