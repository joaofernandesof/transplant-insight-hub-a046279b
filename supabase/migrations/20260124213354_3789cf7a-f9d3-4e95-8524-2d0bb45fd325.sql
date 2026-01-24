-- Fix admin visibility on student_referrals (policy was comparing neohub_user_id to auth.uid())
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.student_referrals;

CREATE POLICY "Admins can manage all student referrals"
ON public.student_referrals
FOR ALL
USING (
  public.is_neohub_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.is_neohub_admin(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);
