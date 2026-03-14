
-- Kommo Alerts Configuration Table
CREATE TABLE IF NOT EXISTS public.kommo_alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  alert_type text NOT NULL DEFAULT 'threshold',
  metric_key text NOT NULL,
  condition text NOT NULL DEFAULT 'gt',
  threshold_value numeric NOT NULL DEFAULT 0,
  severity text NOT NULL DEFAULT 'warning',
  is_active boolean NOT NULL DEFAULT true,
  notify_in_app boolean NOT NULL DEFAULT true,
  check_interval_minutes integer NOT NULL DEFAULT 60,
  last_triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kommo_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read kommo alert rules"
  ON public.kommo_alert_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage kommo alert rules"
  ON public.kommo_alert_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Kommo Notifications Table
CREATE TABLE IF NOT EXISTS public.kommo_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id uuid REFERENCES public.kommo_alert_rules(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  metric_key text,
  metric_value numeric,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kommo_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read kommo notifications"
  ON public.kommo_notifications FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update kommo notifications"
  ON public.kommo_notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Add auto-sync columns to sync_config
ALTER TABLE public.kommo_sync_config 
  ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_sync_interval_minutes integer NOT NULL DEFAULT 60;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.kommo_notifications;
