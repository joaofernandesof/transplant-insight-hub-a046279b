-- Allow patients to update (cancel) their own appointments
CREATE POLICY "portal_appointments_patient_update" 
ON public.portal_appointments 
FOR UPDATE 
USING (
  patient_id IN (
    SELECT pp.id 
    FROM portal_patients pp 
    WHERE pp.portal_user_id = get_portal_user_id(auth.uid())
  )
)
WITH CHECK (
  patient_id IN (
    SELECT pp.id 
    FROM portal_patients pp 
    WHERE pp.portal_user_id = get_portal_user_id(auth.uid())
  )
);