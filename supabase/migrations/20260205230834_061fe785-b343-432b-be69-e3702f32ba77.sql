
-- Add policy for licensed users to see available leads and their own claimed leads
-- This does NOT affect existing admin/staff policies
DROP POLICY IF EXISTS "Authenticated users can view available and own leads" ON public.leads;

CREATE POLICY "Authenticated users can view available and own leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  claimed_by IS NULL
  OR claimed_by = auth.uid()
);
