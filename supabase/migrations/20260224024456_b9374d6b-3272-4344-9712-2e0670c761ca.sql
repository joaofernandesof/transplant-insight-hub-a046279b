-- Allow ipromed profile users to manage legal tasks
CREATE POLICY "Ipromed users can manage legal tasks"
ON public.ipromed_legal_tasks
FOR ALL
TO authenticated
USING (
  public.has_neohub_profile(auth.uid(), 'ipromed')
)
WITH CHECK (
  public.has_neohub_profile(auth.uid(), 'ipromed')
);