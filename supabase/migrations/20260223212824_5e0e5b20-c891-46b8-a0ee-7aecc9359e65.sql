-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Staff can view surgeries" ON public.clinic_surgeries;

-- Create a permissive SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can view surgeries"
  ON public.clinic_surgeries
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Also allow authenticated users to insert/update/delete for now
DROP POLICY IF EXISTS "Admin/gestao can insert surgeries" ON public.clinic_surgeries;
DROP POLICY IF EXISTS "Admin/gestao can update surgeries" ON public.clinic_surgeries;
DROP POLICY IF EXISTS "Admin can delete surgeries" ON public.clinic_surgeries;

CREATE POLICY "Authenticated users can insert surgeries"
  ON public.clinic_surgeries
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update surgeries"
  ON public.clinic_surgeries
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete surgeries"
  ON public.clinic_surgeries
  FOR DELETE
  USING (auth.uid() IS NOT NULL);