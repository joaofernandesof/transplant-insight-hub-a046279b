
-- =============================================
-- KOMMO INTEGRATION: Cache & Sync Tables
-- =============================================

-- Sync configuration (connection settings per org)
CREATE TABLE public.kommo_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'pending',
  last_sync_error TEXT,
  sync_pipelines TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sync logs
CREATE TABLE public.kommo_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.kommo_sync_config(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  records_synced JSONB DEFAULT '{}',
  error_message TEXT,
  duration_ms INTEGER
);

-- Pipelines (funis)
CREATE TABLE public.kommo_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kommo_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  is_main BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  pipeline_type TEXT DEFAULT 'sales',
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline stages (etapas)
CREATE TABLE public.kommo_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kommo_id BIGINT NOT NULL UNIQUE,
  pipeline_kommo_id BIGINT NOT NULL REFERENCES public.kommo_pipelines(kommo_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  color TEXT,
  is_closed BOOLEAN DEFAULT false,
  close_type TEXT,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Users (vendedores/responsáveis)
CREATE TABLE public.kommo_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kommo_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT,
  is_active BOOLEAN DEFAULT true,
  neohub_user_id UUID,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE public.kommo_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kommo_id BIGINT NOT NULL UNIQUE,
  name TEXT,
  price NUMERIC DEFAULT 0,
  pipeline_kommo_id BIGINT,
  stage_kommo_id BIGINT,
  responsible_user_kommo_id BIGINT,
  status_id INTEGER,
  loss_reason TEXT,
  source TEXT,
  source_name TEXT,
  campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  tags TEXT[] DEFAULT '{}',
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  closed_at TIMESTAMPTZ,
  created_at_kommo TIMESTAMPTZ,
  updated_at_kommo TIMESTAMPTZ,
  first_contact_at TIMESTAMPTZ,
  custom_fields JSONB DEFAULT '{}',
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Contacts
CREATE TABLE public.kommo_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kommo_id BIGINT NOT NULL UNIQUE,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  responsible_user_kommo_id BIGINT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks
CREATE TABLE public.kommo_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kommo_id BIGINT NOT NULL UNIQUE,
  lead_kommo_id BIGINT,
  responsible_user_kommo_id BIGINT,
  task_type TEXT,
  text TEXT,
  is_completed BOOLEAN DEFAULT false,
  result_text TEXT,
  duration INTEGER,
  complete_till TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at_kommo TIMESTAMPTZ,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Custom field definitions (metadados dos campos)
CREATE TABLE public.kommo_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kommo_id BIGINT NOT NULL,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  field_type TEXT,
  enums JSONB,
  is_active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kommo_id, entity_type)
);

-- Lead-Contact relationship
CREATE TABLE public.kommo_lead_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_kommo_id BIGINT NOT NULL,
  contact_kommo_id BIGINT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  UNIQUE(lead_kommo_id, contact_kommo_id)
);

-- Sources mapping
CREATE TABLE public.kommo_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key TEXT NOT NULL UNIQUE,
  source_name TEXT NOT NULL,
  channel TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Loss reasons mapping
CREATE TABLE public.kommo_loss_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kommo_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.kommo_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_lead_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kommo_loss_reasons ENABLE ROW LEVEL SECURITY;

-- RLS Policies: authenticated users can read all kommo data
CREATE POLICY "Authenticated users can read kommo_pipelines" ON public.kommo_pipelines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_pipeline_stages" ON public.kommo_pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_users" ON public.kommo_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_leads" ON public.kommo_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_contacts" ON public.kommo_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_tasks" ON public.kommo_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_custom_fields" ON public.kommo_custom_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_lead_contacts" ON public.kommo_lead_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_sources" ON public.kommo_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_loss_reasons" ON public.kommo_loss_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_sync_config" ON public.kommo_sync_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read kommo_sync_logs" ON public.kommo_sync_logs FOR SELECT TO authenticated USING (true);

-- Service role policies for edge function writes
CREATE POLICY "Service role can manage kommo_pipelines" ON public.kommo_pipelines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_pipeline_stages" ON public.kommo_pipeline_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_users" ON public.kommo_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_leads" ON public.kommo_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_contacts" ON public.kommo_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_tasks" ON public.kommo_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_custom_fields" ON public.kommo_custom_fields FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_lead_contacts" ON public.kommo_lead_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_sources" ON public.kommo_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_loss_reasons" ON public.kommo_loss_reasons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_sync_config" ON public.kommo_sync_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage kommo_sync_logs" ON public.kommo_sync_logs FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_kommo_leads_pipeline ON public.kommo_leads(pipeline_kommo_id);
CREATE INDEX idx_kommo_leads_stage ON public.kommo_leads(stage_kommo_id);
CREATE INDEX idx_kommo_leads_responsible ON public.kommo_leads(responsible_user_kommo_id);
CREATE INDEX idx_kommo_leads_status ON public.kommo_leads(is_won, is_lost);
CREATE INDEX idx_kommo_leads_created ON public.kommo_leads(created_at_kommo);
CREATE INDEX idx_kommo_leads_source ON public.kommo_leads(source);
CREATE INDEX idx_kommo_tasks_lead ON public.kommo_tasks(lead_kommo_id);
CREATE INDEX idx_kommo_tasks_responsible ON public.kommo_tasks(responsible_user_kommo_id);
CREATE INDEX idx_kommo_tasks_completed ON public.kommo_tasks(is_completed);
CREATE INDEX idx_kommo_stages_pipeline ON public.kommo_pipeline_stages(pipeline_kommo_id);
