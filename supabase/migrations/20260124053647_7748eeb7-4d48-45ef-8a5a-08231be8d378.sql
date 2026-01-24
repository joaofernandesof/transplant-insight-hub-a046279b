-- Allow all authenticated users to view community members (basic info for networking)
CREATE POLICY "Authenticated users can view community members"
ON public.neohub_users
FOR SELECT
TO authenticated
USING (true);