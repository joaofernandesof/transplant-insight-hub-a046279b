
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  seq TEXT NOT NULL,
  category TEXT,
  template_name TEXT NOT NULL,
  message_content TEXT,
  media_url TEXT,
  variables_used TEXT,
  notes TEXT,
  -- Checklist fields (same pattern as bot_controls)
  template_approved TEXT DEFAULT '',
  content_reviewed TEXT DEFAULT '',
  variables_correct TEXT DEFAULT '',
  tested TEXT DEFAULT '',
  approved_compliance TEXT DEFAULT '',
  media_attached TEXT DEFAULT '',
  published TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read message_templates"
  ON public.message_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert message_templates"
  ON public.message_templates FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update message_templates"
  ON public.message_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete message_templates"
  ON public.message_templates FOR DELETE TO authenticated USING (true);
