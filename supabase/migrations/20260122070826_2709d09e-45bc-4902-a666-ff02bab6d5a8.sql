-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.clinic_patients ENABLE ROW LEVEL SECURITY;

-- Replace SELECT policy to include NeoHub staff profiles used by NeoTeam
DROP POLICY IF EXISTS "Staff can view patients" ON public.clinic_patients;

CREATE POLICY "Staff and NeoTeam can view patients"
ON public.clinic_patients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.is_active = true
  )
  OR public.has_neohub_profile(auth.uid(), 'administrador')
  OR public.has_neohub_profile(auth.uid(), 'colaborador')
  OR public.has_neohub_profile(auth.uid(), 'medico')
);
