-- Create table for student referrals
CREATE TABLE public.student_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_name TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  referred_has_crm BOOLEAN DEFAULT false,
  referred_crm TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  commission_rate NUMERIC(5,2) DEFAULT 5.00,
  commission_paid BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_referrals ENABLE ROW LEVEL SECURITY;

-- Policies for student referrals
CREATE POLICY "Users can view their own referrals"
ON public.student_referrals
FOR SELECT
USING (auth.uid() = referrer_user_id);

CREATE POLICY "Anyone can create referrals (for landing page)"
ON public.student_referrals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own referrals"
ON public.student_referrals
FOR UPDATE
USING (auth.uid() = referrer_user_id);

-- Admin policy using neohub_user_profiles
CREATE POLICY "Admins can manage all referrals"
ON public.student_referrals
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.neohub_user_profiles nup
    WHERE nup.neohub_user_id = auth.uid()
    AND nup.profile = 'administrador'
    AND nup.is_active = true
  )
);

-- Create index for faster lookups
CREATE INDEX idx_student_referrals_referrer ON public.student_referrals(referrer_user_id);
CREATE INDEX idx_student_referrals_code ON public.student_referrals(referral_code);
CREATE INDEX idx_student_referrals_status ON public.student_referrals(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_student_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_student_referrals_updated_at
BEFORE UPDATE ON public.student_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_student_referrals_updated_at();