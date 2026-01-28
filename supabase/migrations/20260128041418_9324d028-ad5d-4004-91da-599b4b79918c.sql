-- Tabela para rastrear cliques nos links de indicação
CREATE TABLE public.referral_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code TEXT NOT NULL,
  referrer_user_id UUID NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  referer_url TEXT
);

-- Índices para performance
CREATE INDEX idx_referral_clicks_code ON public.referral_link_clicks(referral_code);
CREATE INDEX idx_referral_clicks_user ON public.referral_link_clicks(referrer_user_id);
CREATE INDEX idx_referral_clicks_date ON public.referral_link_clicks(clicked_at DESC);

-- Enable RLS
ALTER TABLE public.referral_link_clicks ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios cliques
CREATE POLICY "Users can view their own referral clicks" 
ON public.referral_link_clicks 
FOR SELECT 
USING (auth.uid() = referrer_user_id);

-- Política: Qualquer um pode inserir (anônimo para tracking)
CREATE POLICY "Anyone can insert referral clicks" 
ON public.referral_link_clicks 
FOR INSERT 
WITH CHECK (true);

-- View para agregar cliques por código
CREATE OR REPLACE VIEW public.referral_clicks_summary AS
SELECT 
  referral_code,
  referrer_user_id,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT DATE(clicked_at)) as unique_days,
  MAX(clicked_at) as last_click_at,
  COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '7 days') as clicks_last_7_days,
  COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '30 days') as clicks_last_30_days
FROM public.referral_link_clicks
GROUP BY referral_code, referrer_user_id;