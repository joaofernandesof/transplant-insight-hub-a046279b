
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert availability" ON surgery_agenda_availability;
DROP POLICY IF EXISTS "Admins can update availability" ON surgery_agenda_availability;
DROP POLICY IF EXISTS "Admins can delete availability" ON surgery_agenda_availability;

-- Recreate with broader access (admin + colaborador)
CREATE POLICY "Staff can insert availability" ON surgery_agenda_availability
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'colaborador'::app_role)
  );

CREATE POLICY "Staff can update availability" ON surgery_agenda_availability
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'colaborador'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'colaborador'::app_role)
  );

CREATE POLICY "Staff can delete availability" ON surgery_agenda_availability
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    public.has_role(auth.uid(), 'colaborador'::app_role)
  );
