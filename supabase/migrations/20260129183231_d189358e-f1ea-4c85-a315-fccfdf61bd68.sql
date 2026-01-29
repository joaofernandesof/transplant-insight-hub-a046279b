-- SEC-FIX-001: Drop overly permissive leads SELECT policy
-- The old policy allows ANY authenticated user to see unclaimed leads
-- The new role-based policy "Staff can view leads based on role" already provides proper protection

DROP POLICY IF EXISTS "Users can view available or own leads" ON public.leads;