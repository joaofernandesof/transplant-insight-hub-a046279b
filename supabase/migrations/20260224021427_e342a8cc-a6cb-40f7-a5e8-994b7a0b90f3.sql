-- Allow ipromed users to INSERT, UPDATE, DELETE on ipromed_legal_cases
CREATE POLICY "IPROMED users can insert legal cases"
ON public.ipromed_legal_cases
FOR INSERT
TO authenticated
WITH CHECK (has_neohub_profile(auth.uid(), 'ipromed'::neohub_profile) OR is_neohub_admin(auth.uid()));

CREATE POLICY "IPROMED users can update legal cases"
ON public.ipromed_legal_cases
FOR UPDATE
TO authenticated
USING (has_neohub_profile(auth.uid(), 'ipromed'::neohub_profile) OR is_neohub_admin(auth.uid()));

CREATE POLICY "IPROMED users can delete legal cases"
ON public.ipromed_legal_cases
FOR DELETE
TO authenticated
USING (has_neohub_profile(auth.uid(), 'ipromed'::neohub_profile) OR is_neohub_admin(auth.uid()));

CREATE POLICY "IPROMED users can view legal cases"
ON public.ipromed_legal_cases
FOR SELECT
TO authenticated
USING (has_neohub_profile(auth.uid(), 'ipromed'::neohub_profile) OR is_neohub_admin(auth.uid()));

-- Allow ipromed users to INSERT, UPDATE, DELETE on ipromed_legal_clients
CREATE POLICY "IPROMED users can insert clients"
ON public.ipromed_legal_clients
FOR INSERT
TO authenticated
WITH CHECK (has_neohub_profile(auth.uid(), 'ipromed'::neohub_profile) OR is_neohub_admin(auth.uid()));

CREATE POLICY "IPROMED users can update clients"
ON public.ipromed_legal_clients
FOR UPDATE
TO authenticated
USING (has_neohub_profile(auth.uid(), 'ipromed'::neohub_profile) OR is_neohub_admin(auth.uid()));

CREATE POLICY "IPROMED users can delete clients"
ON public.ipromed_legal_clients
FOR DELETE
TO authenticated
USING (has_neohub_profile(auth.uid(), 'ipromed'::neohub_profile) OR is_neohub_admin(auth.uid()));