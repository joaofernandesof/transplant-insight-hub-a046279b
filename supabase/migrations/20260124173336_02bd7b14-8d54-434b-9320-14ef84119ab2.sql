-- Allow anonymous users to validate referral codes by reading only referral_code and full_name from neohub_users
CREATE POLICY "Anonymous users can validate referral codes" 
ON public.neohub_users 
FOR SELECT 
TO anon
USING (referral_code IS NOT NULL);

-- Allow anonymous users to validate referral codes from profiles
CREATE POLICY "Anonymous users can validate referral codes from profiles" 
ON public.profiles 
FOR SELECT 
TO anon
USING (referral_code IS NOT NULL);