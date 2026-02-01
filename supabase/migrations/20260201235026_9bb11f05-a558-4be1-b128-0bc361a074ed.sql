-- Create table to track leads in kanban columns
CREATE TABLE public.avivar_kanban_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kanban_id UUID NOT NULL REFERENCES public.avivar_kanbans(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES public.avivar_kanban_columns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT DEFAULT 'import',
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avivar_kanban_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own leads"
  ON public.avivar_kanban_leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON public.avivar_kanban_leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.avivar_kanban_leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.avivar_kanban_leads FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_avivar_kanban_leads_kanban ON public.avivar_kanban_leads(kanban_id);
CREATE INDEX idx_avivar_kanban_leads_column ON public.avivar_kanban_leads(column_id);
CREATE INDEX idx_avivar_kanban_leads_user ON public.avivar_kanban_leads(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_avivar_kanban_leads_updated_at
  BEFORE UPDATE ON public.avivar_kanban_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_avivar_journey_updated_at();