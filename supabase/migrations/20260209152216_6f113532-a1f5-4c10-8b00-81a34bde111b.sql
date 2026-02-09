
DROP POLICY IF EXISTS "cpg_select_leads" ON public.leads;

CREATE POLICY "cpg_select_leads" ON public.leads
FOR SELECT USING (
  account_id IS NULL
  AND (
    is_neohub_admin(auth.uid())
    OR has_staff_role(auth.uid(), 'admin'::clinic_staff_role)
    OR has_staff_role(auth.uid(), 'gestao'::clinic_staff_role)
    OR has_staff_role(auth.uid(), 'comercial'::clinic_staff_role)
    OR claimed_by IS NULL
    OR claimed_by = auth.uid()
    OR (claimed_by IS NOT NULL AND source IN ('planilha', 'n8n'))
  )
);
