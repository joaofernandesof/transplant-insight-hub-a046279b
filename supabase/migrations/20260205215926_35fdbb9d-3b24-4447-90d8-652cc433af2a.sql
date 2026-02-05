-- Fix RLS policy to allow authenticated users to see available leads (not claimed)
-- Keep existing logic for admins and claimed leads

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Staff can view leads based on role" ON leads;

-- Create new policy that allows:
-- 1. Admins/staff see everything
-- 2. Regular users see available leads (claimed_by IS NULL) 
-- 3. Users see their own claimed leads
CREATE POLICY "Users can view available and owned leads"
ON leads FOR SELECT TO authenticated
USING (
  is_neohub_admin(auth.uid()) 
  OR has_staff_role(auth.uid(), 'admin'::clinic_staff_role)
  OR has_staff_role(auth.uid(), 'gestao'::clinic_staff_role) 
  OR has_staff_role(auth.uid(), 'comercial'::clinic_staff_role)
  OR claimed_by IS NULL
  OR claimed_by = auth.uid()
);