
-- Allow NeoTeam admin+ members to search neohub_users for adding team members
CREATE POLICY "NeoTeam admins can search users"
ON public.neohub_users
FOR SELECT
TO authenticated
USING (is_neoteam_admin_or_above(auth.uid()));
