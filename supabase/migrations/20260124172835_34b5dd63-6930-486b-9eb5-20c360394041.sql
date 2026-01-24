-- Remove the UNIQUE constraint from referral_code
-- This allows the same referrer code to be used multiple times (multiple referrals from same user)
ALTER TABLE public.student_referrals 
DROP CONSTRAINT student_referrals_referral_code_key;