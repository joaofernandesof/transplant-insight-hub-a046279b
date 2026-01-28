-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'starter', 'professional', 'unlimited');

-- Create user credits table
CREATE TABLE public.user_scan_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  daily_credits INTEGER NOT NULL DEFAULT 3,
  credits_used_today INTEGER NOT NULL DEFAULT 0,
  credits_used_month INTEGER NOT NULL DEFAULT 0,
  last_daily_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_monthly_reset TIMESTAMP WITH TIME ZONE DEFAULT now(),
  plan_started_at TIMESTAMP WITH TIME ZONE,
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create credit transactions log
CREATE TABLE public.scan_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'scan_progression', 'scan_density', 'scan_newversion', 'daily_bonus', 'monthly_bonus', 'plan_upgrade'
  credits_change INTEGER NOT NULL, -- negative for usage, positive for additions
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_scan_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_scan_credits
CREATE POLICY "Users can view their own credits"
  ON public.user_scan_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_scan_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits"
  ON public.user_scan_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for scan_credit_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.scan_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.scan_credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to get or create user credits
CREATE OR REPLACE FUNCTION public.get_or_create_user_scan_credits(_user_id UUID)
RETURNS public.user_scan_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.user_scan_credits;
BEGIN
  SELECT * INTO result FROM public.user_scan_credits WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_scan_credits (user_id, plan, daily_credits, monthly_credits)
    VALUES (_user_id, 'free', 3, 0)
    RETURNING * INTO result;
  END IF;
  
  RETURN result;
END;
$$;

-- Function to check and reset daily credits
CREATE OR REPLACE FUNCTION public.check_and_reset_daily_credits(_user_id UUID)
RETURNS public.user_scan_credits
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.user_scan_credits;
  daily_limit INTEGER;
BEGIN
  SELECT * INTO result FROM public.user_scan_credits WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    result := public.get_or_create_user_scan_credits(_user_id);
  END IF;
  
  -- Check if we need to reset daily credits (new day)
  IF result.last_daily_reset::date < CURRENT_DATE THEN
    -- Determine daily credits based on plan
    daily_limit := CASE result.plan
      WHEN 'free' THEN 3
      WHEN 'starter' THEN 5
      WHEN 'professional' THEN 10
      WHEN 'unlimited' THEN 999
      ELSE 3
    END;
    
    UPDATE public.user_scan_credits
    SET credits_used_today = 0,
        daily_credits = daily_limit,
        last_daily_reset = now(),
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING * INTO result;
  END IF;
  
  -- Check if we need to reset monthly credits (new month)
  IF DATE_TRUNC('month', result.last_monthly_reset) < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE public.user_scan_credits
    SET credits_used_month = 0,
        last_monthly_reset = now(),
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING * INTO result;
  END IF;
  
  RETURN result;
END;
$$;

-- Function to consume a credit
CREATE OR REPLACE FUNCTION public.consume_scan_credit(_user_id UUID, _action TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_credits public.user_scan_credits;
  available_credits INTEGER;
  monthly_limit INTEGER;
BEGIN
  -- Get and reset credits if needed
  user_credits := public.check_and_reset_daily_credits(_user_id);
  
  -- Calculate available credits
  available_credits := user_credits.daily_credits - user_credits.credits_used_today;
  
  -- For paid plans, also add monthly credits
  IF user_credits.plan != 'free' THEN
    monthly_limit := CASE user_credits.plan
      WHEN 'starter' THEN 50
      WHEN 'professional' THEN 150
      WHEN 'unlimited' THEN 9999
      ELSE 0
    END;
    available_credits := available_credits + (monthly_limit - user_credits.credits_used_month);
  END IF;
  
  IF available_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_credits',
      'message', 'Você não tem créditos suficientes. Faça upgrade do seu plano!',
      'available_credits', 0
    );
  END IF;
  
  -- Consume credit (prefer daily first, then monthly)
  IF user_credits.credits_used_today < user_credits.daily_credits THEN
    UPDATE public.user_scan_credits
    SET credits_used_today = credits_used_today + 1,
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING * INTO user_credits;
  ELSE
    UPDATE public.user_scan_credits
    SET credits_used_month = credits_used_month + 1,
        updated_at = now()
    WHERE user_id = _user_id
    RETURNING * INTO user_credits;
  END IF;
  
  -- Log transaction
  INSERT INTO public.scan_credit_transactions (user_id, action, credits_change, credits_before, credits_after)
  VALUES (_user_id, _action, -1, available_credits, available_credits - 1);
  
  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', available_credits - 1,
    'plan', user_credits.plan
  );
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_user_scan_credits_updated_at
  BEFORE UPDATE ON public.user_scan_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();