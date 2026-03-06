
CREATE TABLE public.neoacademy_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  link_label TEXT DEFAULT 'Saiba Mais',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.neoacademy_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON public.neoacademy_banners
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage banners"
  ON public.neoacademy_banners
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
