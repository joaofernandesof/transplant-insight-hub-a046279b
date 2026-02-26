
-- Add sale details columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sold_procedure text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sold_value numeric;

-- Create table for admin sale notifications (realtime)
CREATE TABLE IF NOT EXISTS public.hotlead_sale_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id),
  lead_name text NOT NULL,
  licensee_name text,
  procedure_name text,
  sale_value numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  seen_by text[] DEFAULT '{}'
);

ALTER TABLE public.hotlead_sale_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read sale notifications"
  ON public.hotlead_sale_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert sale notifications"
  ON public.hotlead_sale_notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update sale notifications"
  ON public.hotlead_sale_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.hotlead_sale_notifications;
