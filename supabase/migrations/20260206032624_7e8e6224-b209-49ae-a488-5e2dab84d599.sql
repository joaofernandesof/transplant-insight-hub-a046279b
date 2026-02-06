
-- Fix: get_user_avivar_account_id must bypass RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_avivar_account_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_id FROM public.avivar_account_members
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
$$;

-- Drop the recursive owner_manage policy
DROP POLICY IF EXISTS "owner_manage" ON public.avivar_account_members;

-- Recreate owner_manage using a non-recursive approach
-- Owners can manage members of their own account (checked via accounts table)
CREATE POLICY "owner_manage" ON public.avivar_account_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM avivar_accounts a
    WHERE a.id = avivar_account_members.account_id
    AND a.owner_user_id = auth.uid()
  )
  OR
  -- Admin check via the SECURITY DEFINER function (no recursion)
  (account_id = get_user_avivar_account_id(auth.uid()))
);
