-- ====================================
-- System Sentinel - Tabelas de Monitoramento
-- ====================================

-- Tabela de sistemas monitorados
CREATE TABLE public.monitored_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('webhook', 'api', 'domain', 'integration')),
  url TEXT,
  description TEXT,
  check_interval_seconds INTEGER DEFAULT 60,
  timeout_ms INTEGER DEFAULT 5000,
  expected_status_codes INTEGER[] DEFAULT ARRAY[200, 201, 204],
  headers JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de status dos sistemas (última verificação)
CREATE TABLE public.system_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.monitored_systems(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de alertas do sistema
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.monitored_systems(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  type TEXT NOT NULL CHECK (type IN ('downtime', 'ssl', 'webhook_fail', 'slow_response', 'error')),
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  notified_via TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Configuração WhatsApp (Uazapi)
CREATE TABLE public.sentinel_whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_url TEXT NOT NULL,
  api_token TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  last_test_at TIMESTAMP WITH TIME ZONE,
  notify_high BOOLEAN DEFAULT true,
  notify_medium BOOLEAN DEFAULT true,
  notify_low BOOLEAN DEFAULT false,
  notify_daily_summary BOOLEAN DEFAULT true,
  daily_summary_hour INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Destinatários de alertas
CREATE TABLE public.sentinel_alert_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  receive_whatsapp BOOLEAN DEFAULT true,
  receive_email BOOLEAN DEFAULT true,
  severity_filter TEXT[] DEFAULT ARRAY['high', 'medium'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Métricas agregadas por dia
CREATE TABLE public.system_metrics_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id UUID NOT NULL REFERENCES public.monitored_systems(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_checks INTEGER DEFAULT 0,
  successful_checks INTEGER DEFAULT 0,
  failed_checks INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  uptime_percentage NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(system_id, date)
);

-- Índices para performance
CREATE INDEX idx_health_checks_system_id ON public.system_health_checks(system_id);
CREATE INDEX idx_health_checks_checked_at ON public.system_health_checks(checked_at DESC);
CREATE INDEX idx_system_alerts_system_id ON public.system_alerts(system_id);
CREATE INDEX idx_system_alerts_created_at ON public.system_alerts(created_at DESC);
CREATE INDEX idx_system_alerts_resolved ON public.system_alerts(resolved);
CREATE INDEX idx_metrics_daily_system_date ON public.system_metrics_daily(system_id, date DESC);

-- Enable RLS
ALTER TABLE public.monitored_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentinel_whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentinel_alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Apenas admins podem acessar
CREATE POLICY "Admins can manage monitored_systems"
  ON public.monitored_systems FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view health_checks"
  ON public.system_health_checks FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage system_alerts"
  ON public.system_alerts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage whatsapp_config"
  ON public.sentinel_whatsapp_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage alert_recipients"
  ON public.sentinel_alert_recipients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view metrics_daily"
  ON public.system_metrics_daily FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Triggers para updated_at
CREATE TRIGGER update_monitored_systems_updated_at
  BEFORE UPDATE ON public.monitored_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sentinel_whatsapp_config_updated_at
  BEFORE UPDATE ON public.sentinel_whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Dados iniciais de exemplo
INSERT INTO public.monitored_systems (name, type, url, description) VALUES
  ('Neo Folic API', 'api', 'https://api.neofolic.com/health', 'API principal do sistema'),
  ('Kommo CRM', 'integration', 'https://neofolic.kommo.com', 'CRM de vendas'),
  ('Zapier Workflows', 'webhook', 'https://hooks.zapier.com/status', 'Automações Zapier'),
  ('SSL neofolic.com', 'domain', 'neofolic.com', 'Certificado SSL do domínio principal'),
  ('n8n Automations', 'webhook', 'https://n8n.neofolic.com/healthz', 'Automações n8n'),
  ('ClickUp Tasks', 'integration', 'https://api.clickup.com/api/v2/user', 'Gestão de tarefas'),
  ('SSL ibramec.com.br', 'domain', 'ibramec.com.br', 'Certificado SSL IBRAMEC'),
  ('Panda Video', 'api', 'https://api.pandavideo.com.br/status', 'Plataforma de vídeos');

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_alerts;