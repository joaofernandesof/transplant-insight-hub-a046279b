-- Criar tabela para armazenar propostas comerciais
CREATE TABLE public.ipromed_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_code TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  plan_name TEXT NOT NULL,
  plan_subtitle TEXT,
  monthly_value NUMERIC NOT NULL DEFAULT 0,
  conditions TEXT[] DEFAULT '{}',
  custom_conditions TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  documents TEXT[] DEFAULT '{}',
  documents_included TEXT NOT NULL DEFAULT 'full',
  intro_message TEXT,
  closing_message TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.ipromed_proposals ENABLE ROW LEVEL SECURITY;

-- Policies for ipromed users
CREATE POLICY "Ipromed users can view all proposals"
  ON public.ipromed_proposals
  FOR SELECT
  USING (true);

CREATE POLICY "Ipromed users can create proposals"
  ON public.ipromed_proposals
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Ipromed users can update proposals"
  ON public.ipromed_proposals
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Ipromed users can delete proposals"
  ON public.ipromed_proposals
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_ipromed_proposals_updated_at
  BEFORE UPDATE ON public.ipromed_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_ipromed_proposals_status ON public.ipromed_proposals(status);
CREATE INDEX idx_ipromed_proposals_created_at ON public.ipromed_proposals(created_at DESC);
CREATE INDEX idx_ipromed_proposals_client_name ON public.ipromed_proposals(client_name);

-- Comment
COMMENT ON TABLE public.ipromed_proposals IS 'Propostas comerciais do CPG Advocacia Médica';