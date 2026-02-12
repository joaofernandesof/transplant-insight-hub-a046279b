
-- =============================================
-- FIX 1: neohub_users - Remove overly permissive community SELECT
-- The "Authenticated users can view community members" policy exposes ALL user PII.
-- Users already have "Users can view own data" and admins have their policies.
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view community members" ON public.neohub_users;

-- Add a limited community view: only id, full_name, avatar_url (no PII)
CREATE POLICY "Authenticated users can view basic community info"
ON public.neohub_users
FOR SELECT
TO authenticated
USING (true);

-- Wait - this is the same problem. Instead, let's rely on existing policies:
-- "Users can view own data" (user_id = auth.uid())
-- "Admins can view all users" / "Neohub admins can view all users"
-- "Users can view own data or admins all"
-- For community features that need to list other users (e.g., referrals, team),
-- we should use a security definer function instead.

DROP POLICY IF EXISTS "Authenticated users can view basic community info" ON public.neohub_users;

-- =============================================
-- FIX 2: ipromed_proposals - Restrict to IPROMED users and admins
-- =============================================
DROP POLICY IF EXISTS "Ipromed users can view all proposals" ON public.ipromed_proposals;
DROP POLICY IF EXISTS "Ipromed users can create proposals" ON public.ipromed_proposals;
DROP POLICY IF EXISTS "Ipromed users can update proposals" ON public.ipromed_proposals;
DROP POLICY IF EXISTS "Ipromed users can delete proposals" ON public.ipromed_proposals;

CREATE POLICY "Ipromed users can view proposals"
ON public.ipromed_proposals FOR SELECT
TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'ipromed')
);

CREATE POLICY "Ipromed users can create proposals"
ON public.ipromed_proposals FOR INSERT
TO authenticated
WITH CHECK (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'ipromed')
);

CREATE POLICY "Ipromed users can update proposals"
ON public.ipromed_proposals FOR UPDATE
TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'ipromed')
);

CREATE POLICY "Ipromed users can delete proposals"
ON public.ipromed_proposals FOR DELETE
TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'ipromed')
);

-- =============================================
-- FIX 3: ipromed_client_onboarding - Restrict to IPROMED users and admins
-- =============================================
DROP POLICY IF EXISTS "Users can view all onboardings" ON public.ipromed_client_onboarding;
DROP POLICY IF EXISTS "Users can insert onboardings" ON public.ipromed_client_onboarding;
DROP POLICY IF EXISTS "Users can update onboardings" ON public.ipromed_client_onboarding;
DROP POLICY IF EXISTS "Users can delete onboardings" ON public.ipromed_client_onboarding;

CREATE POLICY "Ipromed users can view onboardings"
ON public.ipromed_client_onboarding FOR SELECT
TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'ipromed')
);

CREATE POLICY "Ipromed users can insert onboardings"
ON public.ipromed_client_onboarding FOR INSERT
TO authenticated
WITH CHECK (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'ipromed')
);

CREATE POLICY "Ipromed users can update onboardings"
ON public.ipromed_client_onboarding FOR UPDATE
TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'ipromed')
);

CREATE POLICY "Ipromed users can delete onboardings"
ON public.ipromed_client_onboarding FOR DELETE
TO authenticated
USING (
  public.is_neohub_admin(auth.uid())
  OR public.can_access_module(auth.uid(), 'ipromed')
);

-- =============================================
-- FIX 4: referral_clicks_summary view - Add security_invoker
-- =============================================
ALTER VIEW public.referral_clicks_summary SET (security_invoker = true);
