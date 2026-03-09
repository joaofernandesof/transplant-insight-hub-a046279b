DROP POLICY IF EXISTS "Staff and NeoTeam can view patients" ON public.clinic_patients;

CREATE POLICY "Staff and NeoTeam can view patients"
ON public.clinic_patients FOR SELECT TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid() AND sp.is_active = true
  ))
  OR has_neohub_profile(auth.uid(), 'administrador'::neohub_profile)
  OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile)
  OR has_neohub_profile(auth.uid(), 'medico'::neohub_profile)
  OR is_active_neoteam_member(auth.uid())
);