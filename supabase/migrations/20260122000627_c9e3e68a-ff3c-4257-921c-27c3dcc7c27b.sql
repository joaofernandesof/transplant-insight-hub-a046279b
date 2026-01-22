-- Fix overly permissive RLS policies

-- 1. admin_settings: Restrict to admin users only
DROP POLICY IF EXISTS "All authenticated users can read settings" ON admin_settings;
CREATE POLICY "Only admins can read settings"
ON admin_settings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 2. metric_history: Restrict INSERT to authenticated users (not public with true)
DROP POLICY IF EXISTS "Service role can insert metric history" ON metric_history;
CREATE POLICY "Authenticated users can insert metric history"
ON metric_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. neoteam_whatsapp_logs: Restrict INSERT to authenticated/admin users
DROP POLICY IF EXISTS "Service role can insert logs" ON neoteam_whatsapp_logs;
CREATE POLICY "Admins can insert whatsapp logs"
ON neoteam_whatsapp_logs
FOR INSERT
TO authenticated
WITH CHECK (is_neohub_admin(auth.uid()));

-- 4. portal_audit_logs: Restrict INSERT to authenticated users
DROP POLICY IF EXISTS "portal_audit_insert" ON portal_audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON portal_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. portal_consents: Restrict INSERT to authenticated users
DROP POLICY IF EXISTS "portal_consents_insert" ON portal_consents;
CREATE POLICY "Authenticated users can insert consents"
ON portal_consents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 6. portal_survey_responses: Restrict INSERT to authenticated users
DROP POLICY IF EXISTS "portal_responses_insert" ON portal_survey_responses;
CREATE POLICY "Authenticated users can insert survey responses"
ON portal_survey_responses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 7. referral_leads: Keep public insert but add basic validation
-- This is intentionally public for referral tracking but we add a rate check via the app
DROP POLICY IF EXISTS "Anyone can insert referral leads" ON referral_leads;
CREATE POLICY "Public can insert referral leads"
ON referral_leads
FOR INSERT
TO public
WITH CHECK (
  -- Basic validation: name and phone must be present
  name IS NOT NULL AND 
  length(name) >= 2 AND 
  length(name) <= 100 AND
  phone IS NOT NULL AND 
  length(phone) >= 10
);