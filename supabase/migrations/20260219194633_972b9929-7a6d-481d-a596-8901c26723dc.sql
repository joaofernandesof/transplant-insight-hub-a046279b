
-- Add target kanban/column destination to API tokens
ALTER TABLE public.avivar_api_tokens
  ADD COLUMN target_kanban_id UUID REFERENCES public.avivar_kanbans(id) ON DELETE SET NULL,
  ADD COLUMN target_column_id UUID REFERENCES public.avivar_kanban_columns(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_avivar_api_tokens_target_kanban ON public.avivar_api_tokens(target_kanban_id);
