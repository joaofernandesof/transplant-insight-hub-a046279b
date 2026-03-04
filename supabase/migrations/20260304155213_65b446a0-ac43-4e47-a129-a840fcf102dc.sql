
-- Fix: check BOTH direct auth.uid match AND neohub_users join
CREATE OR REPLACE FUNCTION public.is_active_neoteam_member(_auth_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM neoteam_team_members ntm
    WHERE ntm.is_active = true
      AND (
        -- Direct match: user_id stores auth.uid()
        ntm.user_id = _auth_uid
        OR
        -- Indirect match: user_id stores neohub_users.id
        EXISTS (
          SELECT 1 FROM neohub_users nu 
          WHERE nu.id = ntm.user_id AND nu.user_id = _auth_uid
        )
      )
  )
$$;
