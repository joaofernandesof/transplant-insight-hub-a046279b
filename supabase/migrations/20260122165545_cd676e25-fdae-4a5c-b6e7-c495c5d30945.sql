-- Tabela para armazenar banners do carrossel
CREATE TABLE public.carousel_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  highlight TEXT,
  bg_color TEXT,
  bg_image_url TEXT,
  text_position TEXT DEFAULT 'left' CHECK (text_position IN ('left', 'center', 'right')),
  route TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela para registrar cliques individuais (métricas detalhadas)
CREATE TABLE public.banner_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id UUID NOT NULL REFERENCES public.carousel_banners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT
);

-- Índices para performance
CREATE INDEX idx_carousel_banners_active_order ON public.carousel_banners(is_active, display_order);
CREATE INDEX idx_banner_clicks_banner_id ON public.banner_clicks(banner_id);
CREATE INDEX idx_banner_clicks_clicked_at ON public.banner_clicks(clicked_at);

-- Enable RLS
ALTER TABLE public.carousel_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_clicks ENABLE ROW LEVEL SECURITY;

-- Políticas para banners
CREATE POLICY "Banners ativos são visíveis para todos autenticados" 
ON public.carousel_banners 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins podem ver todos os banners" 
ON public.carousel_banners 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins podem criar banners" 
ON public.carousel_banners 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins podem editar banners" 
ON public.carousel_banners 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins podem deletar banners" 
ON public.carousel_banners 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Políticas para cliques
CREATE POLICY "Usuários podem registrar cliques" 
ON public.banner_clicks 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem ver cliques" 
ON public.banner_clicks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Função para incrementar contador de cliques
CREATE OR REPLACE FUNCTION public.increment_banner_click(banner_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.carousel_banners 
  SET click_count = click_count + 1, updated_at = now()
  WHERE id = banner_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para updated_at
CREATE TRIGGER update_carousel_banners_updated_at
BEFORE UPDATE ON public.carousel_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir banners iniciais
INSERT INTO public.carousel_banners (title, subtitle, highlight, bg_color, text_position, route, display_order) VALUES
('Aprenda a escalar sua clínica', 'Conheça a', 'Universidade ByNeofolic', 'bg-gradient-to-r from-[#1e3a5f] via-[#2d5a87] to-[#1e3a5f]', 'left', '/university', 1),
('Indique colegas e ganhe', 'Programa de indicação', '5% de comissão', 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600', 'left', '/indique-e-ganhe', 2),
('Participe dos eventos exclusivos', 'Mentorias, workshops e encontros', 'Agenda do Licenciado', 'bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700', 'left', '/sala-tecnica', 3),
('Leads qualificados para você', 'Acompanhe em tempo real', 'HotLeads', 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600', 'left', '/hotleads', 4);