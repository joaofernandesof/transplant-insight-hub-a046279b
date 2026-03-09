
CREATE OR REPLACE FUNCTION public.is_neoacademy_admin(_user_id uuid, _account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.neoacademy_account_members
    WHERE user_id = _user_id AND account_id = _account_id 
      AND role IN ('owner', 'admin') AND is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM public.neoacademy_accounts
    WHERE id = _account_id AND owner_user_id = _user_id
  )
  OR public.is_neohub_admin(_user_id)
$$;
