
-- Tabela para armazenar dados de custo de campanhas (Meta Ads + Google Ads)
CREATE TABLE public.campaign_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'other')),
  account_id TEXT, -- Meta Ad Account ID ou Google Customer ID
  campaign_id TEXT, -- ID da campanha na plataforma
  campaign_name TEXT NOT NULL,
  adset_name TEXT, -- Conjunto de anúncio (Meta) ou Ad Group (Google)
  ad_name TEXT, -- Nome do criativo/anúncio
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  cpc NUMERIC(8,4) GENERATED ALWAYS AS (CASE WHEN clicks > 0 THEN spend / clicks ELSE 0 END) STORED,
  ctr NUMERIC(8,4) GENERATED ALWAYS AS (CASE WHEN impressions > 0 THEN (clicks::NUMERIC / impressions) * 100 ELSE 0 END) STORED,
  cpl NUMERIC(8,4) GENERATED ALWAYS AS (CASE WHEN conversions > 0 THEN spend / conversions ELSE 0 END) STORED,
  -- Campos para matching com UTMs do Kommo
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  raw_data JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, campaign_id, adset_name, ad_name, date)
);

-- Índices para performance
CREATE INDEX idx_campaign_costs_platform_date ON public.campaign_costs(platform, date);
CREATE INDEX idx_campaign_costs_utm_campaign ON public.campaign_costs(utm_campaign);
CREATE INDEX idx_campaign_costs_campaign_name ON public.campaign_costs(campaign_name);

-- Tabela para armazenar configs de integração de ads
CREATE TABLE public.ads_integration_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_from_date DATE DEFAULT (CURRENT_DATE - INTERVAL '90 days')::DATE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, account_id)
);

-- RLS
ALTER TABLE public.campaign_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_integration_config ENABLE ROW LEVEL SECURITY;

-- Policies - acesso autenticado
CREATE POLICY "Authenticated users can read campaign_costs" ON public.campaign_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert campaign_costs" ON public.campaign_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update campaign_costs" ON public.campaign_costs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete campaign_costs" ON public.campaign_costs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage ads_integration_config" ON public.ads_integration_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
