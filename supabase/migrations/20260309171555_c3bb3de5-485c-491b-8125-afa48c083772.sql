
CREATE TABLE public.neoteam_portal_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  sector TEXT NOT NULL DEFAULT 'geral',
  icon TEXT DEFAULT 'Link',
  color TEXT DEFAULT 'blue',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.neoteam_portal_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active links"
ON public.neoteam_portal_links
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage links"
ON public.neoteam_portal_links
FOR ALL
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'admin'
);
