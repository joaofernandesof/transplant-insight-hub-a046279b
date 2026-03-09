DROP POLICY IF EXISTS "Staff can update patients" ON public.clinic_patients;

CREATE POLICY "Authenticated users can update patients"
ON public.clinic_patients
FOR UPDATE
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid() AND sp.is_active = true
    AND sp.role = ANY (ARRAY['admin'::clinic_staff_role, 'gestao'::clinic_staff_role, 'comercial'::clinic_staff_role, 'operacao'::clinic_staff_role, 'recepcao'::clinic_staff_role])
  ))
  OR has_neohub_profile(auth.uid(), 'administrador'::neohub_profile)
  OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile)
  OR has_neohub_profile(auth.uid(), 'medico'::neohub_profile)
  OR (EXISTS (
    SELECT 1 FROM neoteam_team_members ntm
    WHERE ntm.user_id = auth.uid() AND ntm.is_active = true
  ))
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid() AND sp.is_active = true
    AND sp.role = ANY (ARRAY['admin'::clinic_staff_role, 'gestao'::clinic_staff_role, 'comercial'::clinic_staff_role, 'operacao'::clinic_staff_role, 'recepcao'::clinic_staff_role])
  ))
  OR has_neohub_profile(auth.uid(), 'administrador'::neohub_profile)
  OR has_neohub_profile(auth.uid(), 'colaborador'::neohub_profile)
  OR has_neohub_profile(auth.uid(), 'medico'::neohub_profile)
  OR (EXISTS (
    SELECT 1 FROM neoteam_team_members ntm
    WHERE ntm.user_id = auth.uid() AND ntm.is_active = true
  ))
);