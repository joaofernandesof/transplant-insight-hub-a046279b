
CREATE TABLE public.bot_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  seq text NOT NULL,
  chip text NOT NULL DEFAULT 'API',
  funnel text,
  bot_name text NOT NULL,
  concatenated text,
  message text,
  media_url text,
  script text,
  -- checklist fields
  template_approved text DEFAULT '',
  bot_updated text DEFAULT '',
  confirmed_joao text DEFAULT '',
  correct_variable text DEFAULT '',
  optin_initial text DEFAULT '',
  correct_chip_bot text DEFAULT '',
  correct_chip_template text DEFAULT '',
  correct_variables text DEFAULT '',
  tested_our_number text DEFAULT '',
  -- metadata
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.bot_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bot_controls"
  ON public.bot_controls FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert bot_controls"
  ON public.bot_controls FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update bot_controls"
  ON public.bot_controls FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bot_controls"
  ON public.bot_controls FOR DELETE TO authenticated USING (true);
