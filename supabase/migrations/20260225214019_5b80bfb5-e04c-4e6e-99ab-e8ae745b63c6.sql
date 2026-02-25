-- Allow first member bootstrap when table is empty
CREATE OR REPLACE FUNCTION public.neoteam_is_empty()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM neoteam_team_members);
$$;

-- Add policy: any authenticated user can insert if no members exist
CREATE POLICY "Bootstrap first member when empty"
ON public.neoteam_team_members
FOR INSERT
TO authenticated
WITH CHECK (
  neoteam_is_empty() AND auth.uid() = user_id AND role = 'MASTER'
);

-- Also allow anyone authenticated to SELECT when empty (to detect empty state)
CREATE POLICY "Anyone can check empty state"
ON public.neoteam_team_members
FOR SELECT
TO authenticated
USING (
  neoteam_is_empty()
);