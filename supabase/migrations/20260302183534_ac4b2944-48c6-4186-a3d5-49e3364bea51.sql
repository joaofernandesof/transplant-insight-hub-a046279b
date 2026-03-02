-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Staff and NeoTeam can view patients" ON public.clinic_patients;

-- Create updated SELECT policy that includes NeoTeam members
CREATE POLICY "Staff and NeoTeam can view patients"
ON public.clinic_patients
FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid() AND sp.is_active = true
  ))
  OR has_neohub_profile(auth.uid(), 'administrador'::neohub_profile)
  OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile)
  OR has_neohub_profile(auth.uid(), 'medico'::neohub_profile)
  OR (EXISTS (
    SELECT 1 FROM neoteam_team_members ntm
    WHERE ntm.user_id = auth.uid() AND ntm.is_active = true
  ))
);