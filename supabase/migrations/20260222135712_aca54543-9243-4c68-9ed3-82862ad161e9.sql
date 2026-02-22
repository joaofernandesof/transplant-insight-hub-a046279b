
DROP TABLE IF EXISTS public.referral_commission_demands CASCADE;

CREATE TABLE public.referral_commission_demands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES public.student_referrals(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL,
  referred_name TEXT NOT NULL,
  contract_value NUMERIC,
  commission_rate NUMERIC NOT NULL DEFAULT 5,
  commission_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending_review',
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_commission_demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view own demands" ON public.referral_commission_demands
  FOR SELECT USING (referrer_user_id = auth.uid());

CREATE POLICY "Staff can view all demands" ON public.referral_commission_demands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.role IN ('admin', 'gestao') AND sp.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_user_profiles nup
      JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
      WHERE nu.user_id = auth.uid() AND nup.profile = 'administrador' AND nup.is_active = true
    )
  );

CREATE POLICY "Staff can update demands" ON public.referral_commission_demands
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.role IN ('admin', 'gestao') AND sp.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.neohub_user_profiles nup
      JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
      WHERE nu.user_id = auth.uid() AND nup.profile = 'administrador' AND nup.is_active = true
    )
  );

CREATE POLICY "Anyone can insert demands" ON public.referral_commission_demands
  FOR INSERT WITH CHECK (true);

ALTER TABLE public.student_referrals 
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ DEFAULT NULL;

DROP TRIGGER IF EXISTS trg_create_commission_demand ON public.student_referrals;
DROP TRIGGER IF EXISTS trg_create_commission_demand_insert ON public.student_referrals;
DROP TRIGGER IF EXISTS trg_sync_commission_status ON public.referral_commission_demands;

CREATE OR REPLACE FUNCTION public.create_commission_demand_on_settled()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_commission_value NUMERIC;
BEGIN
  IF NEW.status = 'settled' AND (OLD.status IS NULL OR OLD.status != 'settled') THEN
    v_commission_value := COALESCE(NEW.contract_value, 0) * COALESCE(NEW.commission_rate, 5) / 100;
    IF NOT EXISTS (SELECT 1 FROM referral_commission_demands WHERE referral_id = NEW.id) THEN
      INSERT INTO referral_commission_demands (referral_id, referrer_user_id, referred_name, contract_value, commission_rate, commission_value, status)
      VALUES (NEW.id, NEW.referrer_user_id, NEW.referred_name, NEW.contract_value, COALESCE(NEW.commission_rate, 5), v_commission_value, 'pending_review');
      NEW.payment_status := 'pending_review';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_create_commission_demand BEFORE UPDATE ON public.student_referrals FOR EACH ROW EXECUTE FUNCTION public.create_commission_demand_on_settled();
CREATE TRIGGER trg_create_commission_demand_insert BEFORE INSERT ON public.student_referrals FOR EACH ROW EXECUTE FUNCTION public.create_commission_demand_on_settled();

CREATE OR REPLACE FUNCTION public.sync_commission_status_to_referral()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE student_referrals SET payment_status = 'approved', payment_approved_at = now(), updated_at = now() WHERE id = NEW.referral_id;
  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    UPDATE student_referrals SET payment_status = 'rejected', payment_rejection_reason = NEW.rejection_reason, updated_at = now() WHERE id = NEW.referral_id;
  ELSIF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE student_referrals SET payment_status = 'paid', payment_completed_at = now(), commission_paid = true, updated_at = now() WHERE id = NEW.referral_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_sync_commission_status AFTER UPDATE ON public.referral_commission_demands FOR EACH ROW EXECUTE FUNCTION public.sync_commission_status_to_referral();

ALTER PUBLICATION supabase_realtime ADD TABLE public.referral_commission_demands;
