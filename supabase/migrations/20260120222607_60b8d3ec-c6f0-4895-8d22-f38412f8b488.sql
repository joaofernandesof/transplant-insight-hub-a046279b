-- Drop overly permissive policies and recreate with proper restrictions
DROP POLICY IF EXISTS "Staff can create patients" ON public.clinic_patients;
DROP POLICY IF EXISTS "Staff can update patients" ON public.clinic_patients;
DROP POLICY IF EXISTS "Staff can view patients" ON public.clinic_patients;

-- Recreate with proper role-based checks
CREATE POLICY "Staff can view patients"
  ON public.clinic_patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
        AND sp.is_active = true
    )
  );

-- Only recepcao, comercial, operacao, gestao, admin can create patients
CREATE POLICY "Staff can create patients"
  ON public.clinic_patients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
        AND sp.is_active = true
        AND sp.role IN ('admin', 'gestao', 'comercial', 'operacao', 'recepcao')
    )
    AND created_by = auth.uid()
  );

-- Only specific roles can update patients
CREATE POLICY "Staff can update patients"
  ON public.clinic_patients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
        AND sp.is_active = true
        AND sp.role IN ('admin', 'gestao', 'comercial', 'operacao', 'recepcao')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
        AND sp.is_active = true
        AND sp.role IN ('admin', 'gestao', 'comercial', 'operacao', 'recepcao')
    )
  );

-- Drop and recreate sales policies with proper branch + role checks
DROP POLICY IF EXISTS "Staff can create sales in their branch" ON public.clinic_sales;
DROP POLICY IF EXISTS "Staff can update sales in their branch" ON public.clinic_sales;

-- Only comercial, gestao, admin can create sales
CREATE POLICY "Staff can create sales in their branch"
  ON public.clinic_sales FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_branch(auth.uid(), branch)
    AND EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
        AND sp.is_active = true
        AND sp.role IN ('admin', 'gestao', 'comercial')
    )
    AND created_by = auth.uid()
  );

-- Only comercial, gestao, admin can update sales
CREATE POLICY "Staff can update sales in their branch"
  ON public.clinic_sales FOR UPDATE
  TO authenticated
  USING (
    public.can_access_branch(auth.uid(), branch)
    AND EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
        AND sp.is_active = true
        AND sp.role IN ('admin', 'gestao', 'comercial')
    )
  );

-- Drop and recreate surgeries policies with proper branch + role checks
DROP POLICY IF EXISTS "Staff can create surgeries in their branch" ON public.clinic_surgeries;
DROP POLICY IF EXISTS "Staff can update surgeries in their branch" ON public.clinic_surgeries;

-- Only operacao, gestao, admin can create surgeries
CREATE POLICY "Staff can create surgeries in their branch"
  ON public.clinic_surgeries FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_access_branch(auth.uid(), branch)
    AND EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
        AND sp.is_active = true
        AND sp.role IN ('admin', 'gestao', 'operacao', 'comercial')
    )
    AND created_by = auth.uid()
  );

-- Only operacao, gestao, admin can update surgeries
CREATE POLICY "Staff can update surgeries in their branch"
  ON public.clinic_surgeries FOR UPDATE
  TO authenticated
  USING (
    public.can_access_branch(auth.uid(), branch)
    AND EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() 
        AND sp.is_active = true
        AND sp.role IN ('admin', 'gestao', 'operacao', 'comercial', 'recepcao')
    )
  );