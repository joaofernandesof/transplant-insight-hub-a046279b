
-- Create table for licensee onboarding checklists
CREATE TABLE public.licensee_onboarding_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  licensee_user_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES public.neohub_users(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(licensee_user_id)
);

-- Create table for onboarding checklist items (the actual tasks)
CREATE TABLE public.licensee_onboarding_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.licensee_onboarding_checklists(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  phase TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  guidance TEXT NOT NULL,
  subtopics TEXT[],
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.neohub_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_onboarding_items_checklist ON public.licensee_onboarding_items(checklist_id);
CREATE INDEX idx_onboarding_checklists_licensee ON public.licensee_onboarding_checklists(licensee_user_id);

-- Enable RLS
ALTER TABLE public.licensee_onboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licensee_onboarding_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for checklists
CREATE POLICY "Admins can manage all onboarding checklists"
ON public.licensee_onboarding_checklists
FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Licensees can view their own onboarding"
ON public.licensee_onboarding_checklists
FOR SELECT
TO authenticated
USING (
  licensee_user_id IN (
    SELECT id FROM public.neohub_users WHERE user_id = auth.uid()
  )
);

-- RLS policies for items
CREATE POLICY "Admins can manage all onboarding items"
ON public.licensee_onboarding_items
FOR ALL
TO authenticated
USING (public.is_neohub_admin(auth.uid()))
WITH CHECK (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Licensees can view their own onboarding items"
ON public.licensee_onboarding_items
FOR SELECT
TO authenticated
USING (
  checklist_id IN (
    SELECT id FROM public.licensee_onboarding_checklists
    WHERE licensee_user_id IN (
      SELECT id FROM public.neohub_users WHERE user_id = auth.uid()
    )
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_licensee_onboarding_checklists_updated_at
BEFORE UPDATE ON public.licensee_onboarding_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
