-- Add referral code to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate a unique 8-character referral code based on user_id
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.user_id::text || NOW()::text) FROM 1 FOR 8));
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate referral code on profile insert
DROP TRIGGER IF EXISTS generate_referral_code_trigger ON public.profiles;
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.generate_referral_code();

-- Update existing profiles with referral codes
UPDATE public.profiles
SET referral_code = UPPER(SUBSTRING(MD5(user_id::text || NOW()::text || id::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Create referral leads table
CREATE TABLE IF NOT EXISTS public.referral_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text,
  state text,
  interest text,
  status text DEFAULT 'pending',
  converted_at timestamp with time zone,
  converted_value numeric DEFAULT 0,
  commission_value numeric DEFAULT 0,
  commission_paid boolean DEFAULT false,
  commission_paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_leads
CREATE POLICY "Users can view their own referrals"
ON public.referral_leads FOR SELECT
USING (referrer_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert referral leads"
ON public.referral_leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update referral leads"
ON public.referral_leads FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete referral leads"
ON public.referral_leads FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_referral_leads_updated_at
BEFORE UPDATE ON public.referral_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();