
-- Table to store lawyer role/function assignments
CREATE TABLE public.ipromed_lawyer_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lawyer_name TEXT NOT NULL,
  lawyer_user_id UUID,
  category TEXT NOT NULL DEFAULT 'geral',
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ipromed_lawyer_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CPG users can view lawyer functions"
  ON public.ipromed_lawyer_functions FOR SELECT
  USING (
    public.has_neohub_profile(auth.uid(), 'ipromed') 
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "CPG users can insert lawyer functions"
  ON public.ipromed_lawyer_functions FOR INSERT
  WITH CHECK (
    public.has_neohub_profile(auth.uid(), 'ipromed') 
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "CPG users can update lawyer functions"
  ON public.ipromed_lawyer_functions FOR UPDATE
  USING (
    public.has_neohub_profile(auth.uid(), 'ipromed') 
    OR public.is_neohub_admin(auth.uid())
  );

CREATE POLICY "CPG users can delete lawyer functions"
  ON public.ipromed_lawyer_functions FOR DELETE
  USING (
    public.has_neohub_profile(auth.uid(), 'ipromed') 
    OR public.is_neohub_admin(auth.uid())
  );

CREATE TRIGGER update_ipromed_lawyer_functions_updated_at
  BEFORE UPDATE ON public.ipromed_lawyer_functions
  FOR EACH ROW EXECUTE FUNCTION public.update_followup_updated_at();
