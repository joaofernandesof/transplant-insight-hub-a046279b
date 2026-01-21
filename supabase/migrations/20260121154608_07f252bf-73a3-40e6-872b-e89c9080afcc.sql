-- 1. Add new access profiles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'colaborador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'paciente';

-- 2. Create table for module permissions persistence
CREATE TABLE IF NOT EXISTS public.module_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  module_category TEXT NOT NULL,
  profile TEXT NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module_code, profile)
);

-- Enable RLS on module_permissions
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for module_permissions (admin only)
CREATE POLICY "Admins can view module permissions"
ON public.module_permissions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert module permissions"
ON public.module_permissions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update module permissions"
ON public.module_permissions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete module permissions"
ON public.module_permissions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Create table for metric alerts configuration
CREATE TABLE IF NOT EXISTS public.metric_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  comparison_operator TEXT NOT NULL DEFAULT 'gt', -- 'gt', 'lt', 'gte', 'lte', 'eq'
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  is_active BOOLEAN DEFAULT true,
  email_recipients TEXT[] DEFAULT '{}',
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  cooldown_minutes INTEGER DEFAULT 60,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(metric_key)
);

-- Enable RLS on metric_alerts
ALTER TABLE public.metric_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for metric_alerts (admin only)
CREATE POLICY "Admins can view metric alerts"
ON public.metric_alerts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage metric alerts"
ON public.metric_alerts FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Create table for metric history tracking
CREATE TABLE IF NOT EXISTS public.metric_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on metric_history
ALTER TABLE public.metric_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for metric_history (admin only for viewing)
CREATE POLICY "Admins can view metric history"
ON public.metric_history FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert metric history"
ON public.metric_history FOR INSERT
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_metric_history_key_time ON public.metric_history(metric_key, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metric_history_recorded_at ON public.metric_history(recorded_at DESC);

-- 5. Create table for alert history/log
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID REFERENCES public.metric_alerts(id) ON DELETE SET NULL,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  severity TEXT NOT NULL,
  emails_sent_to TEXT[] DEFAULT '{}',
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on alert_history
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert_history
CREATE POLICY "Admins can view alert history"
ON public.alert_history FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create update timestamp trigger for new tables
CREATE OR REPLACE TRIGGER update_module_permissions_updated_at
BEFORE UPDATE ON public.module_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_metric_alerts_updated_at
BEFORE UPDATE ON public.metric_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Insert default permissions for all profiles
INSERT INTO public.module_permissions (module_code, module_name, module_category, profile, can_read, can_write, can_delete)
SELECT 
  m.code,
  m.name,
  m.category,
  p.profile,
  CASE 
    WHEN p.profile = 'admin' THEN true
    WHEN p.profile = 'licensee' AND m.category NOT IN ('Admin') THEN true
    WHEN p.profile = 'colaborador' AND m.category IN ('Dados', 'Gestão', 'Recursos') THEN true
    WHEN p.profile = 'aluno' AND m.category IN ('Formação', 'Social') THEN true
    WHEN p.profile = 'paciente' AND m.code IN ('community', 'sala_tecnica') THEN true
    ELSE false
  END as can_read,
  CASE 
    WHEN p.profile = 'admin' THEN true
    WHEN p.profile = 'licensee' AND m.category NOT IN ('Admin') THEN true
    WHEN p.profile = 'colaborador' AND m.category IN ('Dados', 'Gestão') THEN true
    ELSE false
  END as can_write,
  CASE 
    WHEN p.profile = 'admin' THEN true
    WHEN p.profile = 'licensee' AND m.category NOT IN ('Admin', 'Recursos') THEN true
    ELSE false
  END as can_delete
FROM (
  VALUES 
    ('dashboard', 'Dashboard de Métricas', 'Dados'),
    ('consolidated', 'Resultados Consolidados', 'Dados'),
    ('achievements', 'Conquistas', 'Dados'),
    ('surgery_schedule', 'Agenda de Cirurgias', 'Dados'),
    ('sala_tecnica', 'Sala Técnica', 'Dados'),
    ('university', 'Universidade ByNeofolic', 'Formação'),
    ('certificates', 'Certificados', 'Formação'),
    ('regularization', 'Regularização da Clínica', 'Formação'),
    ('materials', 'Central de Materiais', 'Recursos'),
    ('marketing', 'Central de Marketing', 'Recursos'),
    ('store', 'Loja Neo-Spa', 'Recursos'),
    ('partners', 'Vitrine de Parceiros', 'Recursos'),
    ('estrutura_neo', 'Estrutura NEO', 'Gestão'),
    ('hotleads', 'HotLeads', 'Gestão'),
    ('financial', 'Gestão Financeira', 'Gestão'),
    ('community', 'Comunidade', 'Social'),
    ('mentorship', 'Mentoria & Suporte', 'Suporte'),
    ('referral', 'Indique e Ganhe', 'Marketing'),
    ('marketplace', 'Marketplace', 'Marketplace'),
    ('admin_dashboard', 'Dashboard Admin', 'Admin'),
    ('licensees_panel', 'Gerenciar Licenciados', 'Admin'),
    ('user_monitoring', 'Monitoramento de Usuários', 'Admin'),
    ('system_metrics', 'Métricas do Sistema', 'Admin'),
    ('weekly_reports', 'Relatórios Semanais', 'Admin'),
    ('clinic_comparison', 'Comparar Clínicas', 'Admin'),
    ('admin_panel', 'Configurações do Sistema', 'Admin'),
    ('access_matrix', 'Matriz de Acessos', 'Admin')
) AS m(code, name, category)
CROSS JOIN (
  VALUES ('admin'), ('licensee'), ('colaborador'), ('aluno'), ('paciente')
) AS p(profile)
ON CONFLICT (module_code, profile) DO NOTHING;

-- 7. Insert default metric alert configurations
INSERT INTO public.metric_alerts (metric_key, metric_name, threshold_value, comparison_operator, severity, email_recipients) VALUES
  ('error_rate', 'Taxa de Erro', 5, 'gt', 'critical', '{}'),
  ('slow_queries', 'Queries Lentas', 10, 'gt', 'warning', '{}'),
  ('cache_hit_rate', 'Taxa de Cache', 50, 'lt', 'warning', '{}'),
  ('active_users_24h', 'Usuários Ativos (24h)', 0, 'eq', 'info', '{}'),
  ('avg_query_time', 'Tempo Médio de Query', 500, 'gt', 'critical', '{}')
ON CONFLICT (metric_key) DO NOTHING;