-- Drop the current insert policy and recreate with proper anonymous access
DROP POLICY IF EXISTS "Anyone can create referrals (for landing page)" ON public.student_referrals;

-- Create policy that explicitly allows anonymous users to insert
CREATE POLICY "Allow anonymous referral submissions"
ON public.student_referrals
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Also ensure anon role has INSERT permission on the table
GRANT INSERT ON public.student_referrals TO anon;