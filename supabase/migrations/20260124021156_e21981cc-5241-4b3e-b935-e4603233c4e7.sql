-- Add policy to allow colaboradores to view all day1 satisfaction surveys
CREATE POLICY "Colaboradores can view all day1 surveys"
ON public.day1_satisfaction_surveys
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM neohub_user_profiles nup
    WHERE nup.neohub_user_id = (
      SELECT nu.id FROM neohub_users nu WHERE nu.user_id = auth.uid()
    )
    AND nup.profile = 'colaborador'
    AND nup.is_active = true
  )
);