-- Create branches configuration table
CREATE TABLE IF NOT EXISTS public.neoteam_branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.neoteam_branches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view branches" 
ON public.neoteam_branches FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage branches" 
ON public.neoteam_branches FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert default branches
INSERT INTO public.neoteam_branches (code, name, address) VALUES
  ('fortaleza', 'Filial Fortaleza', 'Fortaleza - CE'),
  ('juazeiro', 'Filial Juazeiro', 'Juazeiro do Norte - CE'),
  ('recife', 'Filial Recife', 'Recife - PE')
ON CONFLICT (code) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_neoteam_branches_updated_at
BEFORE UPDATE ON public.neoteam_branches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();