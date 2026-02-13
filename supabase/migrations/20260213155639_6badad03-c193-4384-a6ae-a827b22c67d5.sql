-- Allow authenticated users to insert their own neohub_users record (for signup)
CREATE POLICY "Users can insert own record"
ON public.neohub_users
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
