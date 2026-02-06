
-- FASE 1: MULTI-TENANT AVIVAR (fix3: patient_journeys com user_id NULL)

CREATE TYPE public.avivar_account_role AS ENUM ('owner', 'admin', 'coordenador', 'sdr', 'atendente');

CREATE TABLE public.avivar_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL, slug VARCHAR(100) UNIQUE NOT NULL,
  owner_user_id UUID NOT NULL, plan VARCHAR(50) DEFAULT 'free',
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.avivar_account_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.avivar_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, role public.avivar_account_role NOT NULL DEFAULT 'atendente',
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(account_id, user_id)
);

ALTER TABLE public.avivar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avivar_account_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_avivar_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT _user_id = '00294ac4-0194-47bc-95ef-6efb83c316f7'::uuid $$;

CREATE OR REPLACE FUNCTION public.get_user_avivar_account_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT account_id FROM public.avivar_account_members WHERE user_id = _user_id AND is_active = true LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.get_user_avivar_account_role(_user_id UUID)
RETURNS public.avivar_account_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.avivar_account_members WHERE user_id = _user_id AND is_active = true LIMIT 1 $$;

CREATE POLICY "sa_all" ON public.avivar_accounts FOR ALL USING (public.is_avivar_super_admin(auth.uid()));
CREATE POLICY "members_view" ON public.avivar_accounts FOR SELECT USING (id = public.get_user_avivar_account_id(auth.uid()));
CREATE POLICY "owner_update" ON public.avivar_accounts FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "sa_all" ON public.avivar_account_members FOR ALL USING (public.is_avivar_super_admin(auth.uid()));
CREATE POLICY "members_view" ON public.avivar_account_members FOR SELECT USING (account_id = public.get_user_avivar_account_id(auth.uid()));
CREATE POLICY "owner_manage" ON public.avivar_account_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.avivar_account_members am WHERE am.account_id = avivar_account_members.account_id AND am.user_id = auth.uid() AND am.role IN ('owner', 'admin') AND am.is_active = true)
);

-- Add account_id to 28 tables
ALTER TABLE public.avivar_agendas ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_agents ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_appointments ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_column_checklists ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_contacts ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_conversas ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_followup_executions ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_followup_metrics ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_followup_rules ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_followup_templates ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_kanban_columns ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_kanban_leads ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_kanbans ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_knowledge_chunks ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_knowledge_documents ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_mensagens ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_onboarding_progress ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_patient_journeys ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_products ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_schedule_blocks ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_schedule_config ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_schedule_hours ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_team_members ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_tutorials ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_uazapi_instances ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_whatsapp_contacts ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_whatsapp_messages ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);
ALTER TABLE public.avivar_whatsapp_sessions ADD COLUMN account_id UUID REFERENCES public.avivar_accounts(id);

-- Create accounts
INSERT INTO public.avivar_accounts (id, name, slug, owner_user_id) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'ByNeofolic', 'byneofolic', '00294ac4-0194-47bc-95ef-6efb83c316f7'),
  ('a0000001-0000-0000-0000-000000000002', 'Lucas Araujo', 'lucas-araujo', '860ae553-aa79-4e54-af98-a90dd8317c15'),
  ('a0000001-0000-0000-0000-000000000003', 'TI Neo Folic', 'ti-neo-folic', '1b58da47-d988-4f96-9847-ed2d8939505e'),
  ('a0000001-0000-0000-0000-000000000004', 'Conta Legada', 'conta-legada', '8d4b2850-cbba-4c17-a0df-ada596846b87');

INSERT INTO public.avivar_account_members (account_id, user_id, role) VALUES
  ('a0000001-0000-0000-0000-000000000001', '00294ac4-0194-47bc-95ef-6efb83c316f7', 'owner'),
  ('a0000001-0000-0000-0000-000000000002', '860ae553-aa79-4e54-af98-a90dd8317c15', 'owner'),
  ('a0000001-0000-0000-0000-000000000003', '1b58da47-d988-4f96-9847-ed2d8939505e', 'owner'),
  ('a0000001-0000-0000-0000-000000000004', '8d4b2850-cbba-4c17-a0df-ada596846b87', 'owner');

INSERT INTO public.avivar_account_members (account_id, user_id, role)
SELECT (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = tm.owner_user_id LIMIT 1),
  tm.member_user_id, tm.role::text::public.avivar_account_role
FROM public.avivar_team_members tm WHERE tm.is_active = true AND tm.member_user_id != tm.owner_user_id
ON CONFLICT (account_id, user_id) DO NOTHING;

-- Fill account_id
UPDATE public.avivar_agendas SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_agendas.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_agents SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_agents.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_appointments SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_appointments.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_contacts SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_contacts.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_conversas SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_conversas.user_id::uuid AND am.is_active = true LIMIT 1);
UPDATE public.avivar_followup_executions SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_followup_executions.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_followup_metrics SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_followup_metrics.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_followup_rules SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_followup_rules.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_followup_templates SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_followup_templates.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_kanbans SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_kanbans.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_kanban_leads SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_kanban_leads.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_knowledge_documents SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_knowledge_documents.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_onboarding_progress SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_onboarding_progress.user_id AND am.is_active = true LIMIT 1);
-- patient_journeys: fix NULL user_id -> assign to default account
UPDATE public.avivar_patient_journeys SET account_id = COALESCE(
  (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_patient_journeys.user_id AND am.is_active = true LIMIT 1),
  'a0000001-0000-0000-0000-000000000001'
);
UPDATE public.avivar_products SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_products.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_schedule_config SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_schedule_config.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_team_members SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_team_members.owner_user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_uazapi_instances SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_uazapi_instances.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_whatsapp_contacts SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_whatsapp_contacts.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_whatsapp_sessions SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_whatsapp_sessions.user_id AND am.is_active = true LIMIT 1);
UPDATE public.avivar_whatsapp_messages SET account_id = (SELECT am.account_id FROM public.avivar_account_members am WHERE am.user_id = avivar_whatsapp_messages.user_id AND am.is_active = true LIMIT 1);

-- Child tables
UPDATE public.avivar_kanban_columns SET account_id = (SELECT k.account_id FROM public.avivar_kanbans k WHERE k.id = avivar_kanban_columns.kanban_id);
UPDATE public.avivar_column_checklists SET account_id = (SELECT kc.account_id FROM public.avivar_kanban_columns kc WHERE kc.id = avivar_column_checklists.column_id);
UPDATE public.avivar_mensagens SET account_id = (SELECT c.account_id FROM public.avivar_conversas c WHERE c.id = avivar_mensagens.conversa_id);
UPDATE public.avivar_knowledge_chunks SET account_id = (SELECT d.account_id FROM public.avivar_knowledge_documents d WHERE d.id = avivar_knowledge_chunks.document_id);
UPDATE public.avivar_schedule_blocks SET account_id = (SELECT sc.account_id FROM public.avivar_schedule_config sc WHERE sc.id = avivar_schedule_blocks.schedule_config_id);
UPDATE public.avivar_schedule_hours SET account_id = (SELECT sc.account_id FROM public.avivar_schedule_config sc WHERE sc.id = avivar_schedule_hours.schedule_config_id);

-- Tutorials + orphans fallback
UPDATE public.avivar_tutorials SET account_id = 'a0000001-0000-0000-0000-000000000001' WHERE account_id IS NULL;

-- NOT NULL (all 28)
ALTER TABLE public.avivar_agendas ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_agents ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_appointments ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_column_checklists ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_contacts ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_conversas ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_followup_executions ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_followup_metrics ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_followup_rules ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_followup_templates ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_kanban_columns ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_kanban_leads ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_kanbans ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_knowledge_chunks ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_knowledge_documents ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_mensagens ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_onboarding_progress ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_patient_journeys ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_products ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_schedule_blocks ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_schedule_config ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_schedule_hours ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_team_members ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_tutorials ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_uazapi_instances ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_whatsapp_contacts ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_whatsapp_messages ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.avivar_whatsapp_sessions ALTER COLUMN account_id SET NOT NULL;

-- Indexes
CREATE INDEX idx_avivar_agendas_acct ON public.avivar_agendas(account_id);
CREATE INDEX idx_avivar_agents_acct ON public.avivar_agents(account_id);
CREATE INDEX idx_avivar_appointments_acct ON public.avivar_appointments(account_id);
CREATE INDEX idx_avivar_checklists_acct ON public.avivar_column_checklists(account_id);
CREATE INDEX idx_avivar_contacts_acct ON public.avivar_contacts(account_id);
CREATE INDEX idx_avivar_conversas_acct ON public.avivar_conversas(account_id);
CREATE INDEX idx_avivar_fexec_acct ON public.avivar_followup_executions(account_id);
CREATE INDEX idx_avivar_fmetrics_acct ON public.avivar_followup_metrics(account_id);
CREATE INDEX idx_avivar_frules_acct ON public.avivar_followup_rules(account_id);
CREATE INDEX idx_avivar_ftemplates_acct ON public.avivar_followup_templates(account_id);
CREATE INDEX idx_avivar_kcols_acct ON public.avivar_kanban_columns(account_id);
CREATE INDEX idx_avivar_kleads_acct ON public.avivar_kanban_leads(account_id);
CREATE INDEX idx_avivar_kanbans_acct ON public.avivar_kanbans(account_id);
CREATE INDEX idx_avivar_kchunks_acct ON public.avivar_knowledge_chunks(account_id);
CREATE INDEX idx_avivar_kdocs_acct ON public.avivar_knowledge_documents(account_id);
CREATE INDEX idx_avivar_msgs_acct ON public.avivar_mensagens(account_id);
CREATE INDEX idx_avivar_onboard_acct ON public.avivar_onboarding_progress(account_id);
CREATE INDEX idx_avivar_journeys_acct ON public.avivar_patient_journeys(account_id);
CREATE INDEX idx_avivar_products_acct ON public.avivar_products(account_id);
CREATE INDEX idx_avivar_sblocks_acct ON public.avivar_schedule_blocks(account_id);
CREATE INDEX idx_avivar_sconfig_acct ON public.avivar_schedule_config(account_id);
CREATE INDEX idx_avivar_shours_acct ON public.avivar_schedule_hours(account_id);
CREATE INDEX idx_avivar_team_acct ON public.avivar_team_members(account_id);
CREATE INDEX idx_avivar_tutorials_acct ON public.avivar_tutorials(account_id);
CREATE INDEX idx_avivar_uazapi_acct ON public.avivar_uazapi_instances(account_id);
CREATE INDEX idx_avivar_wcontacts_acct ON public.avivar_whatsapp_contacts(account_id);
CREATE INDEX idx_avivar_wmessages_acct ON public.avivar_whatsapp_messages(account_id);
CREATE INDEX idx_avivar_wsessions_acct ON public.avivar_whatsapp_sessions(account_id);
CREATE INDEX idx_avivar_acctmembers_user ON public.avivar_account_members(user_id);
CREATE INDEX idx_avivar_acctmembers_acct ON public.avivar_account_members(account_id);

-- Drop old RLS
DROP POLICY IF EXISTS "Users can delete own agendas" ON public.avivar_agendas;
DROP POLICY IF EXISTS "Users can insert own agendas" ON public.avivar_agendas;
DROP POLICY IF EXISTS "Users can update own agendas" ON public.avivar_agendas;
DROP POLICY IF EXISTS "Users can view own agendas" ON public.avivar_agendas;
DROP POLICY IF EXISTS "Users can create agents" ON public.avivar_agents;
DROP POLICY IF EXISTS "Users can delete their agents" ON public.avivar_agents;
DROP POLICY IF EXISTS "Users can update their agents" ON public.avivar_agents;
DROP POLICY IF EXISTS "Users can view agents from their account" ON public.avivar_agents;
DROP POLICY IF EXISTS "Users manage own appointments" ON public.avivar_appointments;
DROP POLICY IF EXISTS "Users can manage column checklists" ON public.avivar_column_checklists;
DROP POLICY IF EXISTS "Users can view column checklists" ON public.avivar_column_checklists;
DROP POLICY IF EXISTS "Users can create their own contacts" ON public.avivar_contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.avivar_contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.avivar_contacts;
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.avivar_contacts;
DROP POLICY IF EXISTS "Service role full access conversas" ON public.avivar_conversas;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.avivar_conversas;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.avivar_conversas;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.avivar_conversas;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.avivar_conversas;
DROP POLICY IF EXISTS "Users can create own followup executions" ON public.avivar_followup_executions;
DROP POLICY IF EXISTS "Users can delete own followup executions" ON public.avivar_followup_executions;
DROP POLICY IF EXISTS "Users can update own followup executions" ON public.avivar_followup_executions;
DROP POLICY IF EXISTS "Users can view own followup executions" ON public.avivar_followup_executions;
DROP POLICY IF EXISTS "Users can manage own followup metrics" ON public.avivar_followup_metrics;
DROP POLICY IF EXISTS "Users can view own followup metrics" ON public.avivar_followup_metrics;
DROP POLICY IF EXISTS "Users can create own followup rules" ON public.avivar_followup_rules;
DROP POLICY IF EXISTS "Users can delete own followup rules" ON public.avivar_followup_rules;
DROP POLICY IF EXISTS "Users can update own followup rules" ON public.avivar_followup_rules;
DROP POLICY IF EXISTS "Users can view own followup rules" ON public.avivar_followup_rules;
DROP POLICY IF EXISTS "Users can create own followup templates" ON public.avivar_followup_templates;
DROP POLICY IF EXISTS "Users can delete own followup templates" ON public.avivar_followup_templates;
DROP POLICY IF EXISTS "Users can update own followup templates" ON public.avivar_followup_templates;
DROP POLICY IF EXISTS "Users can view own followup templates" ON public.avivar_followup_templates;
DROP POLICY IF EXISTS "Users can create columns in their kanbans" ON public.avivar_kanban_columns;
DROP POLICY IF EXISTS "Users can delete columns of their kanbans" ON public.avivar_kanban_columns;
DROP POLICY IF EXISTS "Users can update columns of their kanbans" ON public.avivar_kanban_columns;
DROP POLICY IF EXISTS "Users can view columns of their kanbans" ON public.avivar_kanban_columns;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.avivar_kanban_leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.avivar_kanban_leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.avivar_kanban_leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.avivar_kanban_leads;
DROP POLICY IF EXISTS "Users can create their own kanbans" ON public.avivar_kanbans;
DROP POLICY IF EXISTS "Users can delete their own kanbans" ON public.avivar_kanbans;
DROP POLICY IF EXISTS "Users can update their own kanbans" ON public.avivar_kanbans;
DROP POLICY IF EXISTS "Users can view their own kanbans" ON public.avivar_kanbans;
DROP POLICY IF EXISTS "Users can manage chunks of their documents" ON public.avivar_knowledge_chunks;
DROP POLICY IF EXISTS "Users can view chunks of their documents" ON public.avivar_knowledge_chunks;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.avivar_knowledge_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.avivar_knowledge_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.avivar_knowledge_documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.avivar_knowledge_documents;
DROP POLICY IF EXISTS "Service role full access mensagens" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can delete messages in own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can insert messages to own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON public.avivar_mensagens;
DROP POLICY IF EXISTS "Users can insert own onboarding progress" ON public.avivar_onboarding_progress;
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.avivar_onboarding_progress;
DROP POLICY IF EXISTS "Users can view own onboarding progress" ON public.avivar_onboarding_progress;
DROP POLICY IF EXISTS "Users can manage own patient journeys" ON public.avivar_patient_journeys;
DROP POLICY IF EXISTS "Users can view own patient journeys" ON public.avivar_patient_journeys;
DROP POLICY IF EXISTS "Users can create own products" ON public.avivar_products;
DROP POLICY IF EXISTS "Users can delete own products" ON public.avivar_products;
DROP POLICY IF EXISTS "Users can update own products" ON public.avivar_products;
DROP POLICY IF EXISTS "Users can view own products" ON public.avivar_products;
DROP POLICY IF EXISTS "Users can manage own schedule blocks" ON public.avivar_schedule_blocks;
DROP POLICY IF EXISTS "Users can view own schedule blocks" ON public.avivar_schedule_blocks;
DROP POLICY IF EXISTS "Users can manage own schedule config" ON public.avivar_schedule_config;
DROP POLICY IF EXISTS "Users can view own schedule config" ON public.avivar_schedule_config;
DROP POLICY IF EXISTS "Users can manage own schedule hours" ON public.avivar_schedule_hours;
DROP POLICY IF EXISTS "Users can view own schedule hours" ON public.avivar_schedule_hours;
DROP POLICY IF EXISTS "Owner can manage team members" ON public.avivar_team_members;
DROP POLICY IF EXISTS "Team members can view their team" ON public.avivar_team_members;
DROP POLICY IF EXISTS "Members can view own team data" ON public.avivar_team_members;
DROP POLICY IF EXISTS "Owners can manage their team" ON public.avivar_team_members;
DROP POLICY IF EXISTS "Admin can manage tutorials" ON public.avivar_tutorials;
DROP POLICY IF EXISTS "Users can view tutorials" ON public.avivar_tutorials;
DROP POLICY IF EXISTS "Users can manage own uazapi instances" ON public.avivar_uazapi_instances;
DROP POLICY IF EXISTS "Users can view own uazapi instances" ON public.avivar_uazapi_instances;
DROP POLICY IF EXISTS "Users can manage own whatsapp contacts" ON public.avivar_whatsapp_contacts;
DROP POLICY IF EXISTS "Users can view own whatsapp contacts" ON public.avivar_whatsapp_contacts;
DROP POLICY IF EXISTS "Users can manage own whatsapp messages" ON public.avivar_whatsapp_messages;
DROP POLICY IF EXISTS "Users can view own whatsapp messages" ON public.avivar_whatsapp_messages;
DROP POLICY IF EXISTS "Users can manage own whatsapp sessions" ON public.avivar_whatsapp_sessions;
DROP POLICY IF EXISTS "Users can view own whatsapp sessions" ON public.avivar_whatsapp_sessions;

-- New RLS via DO block
DO $$ 
DECLARE tbl TEXT;
  tables TEXT[] := ARRAY['avivar_agendas','avivar_agents','avivar_appointments','avivar_column_checklists','avivar_contacts','avivar_conversas','avivar_followup_executions','avivar_followup_metrics','avivar_followup_rules','avivar_followup_templates','avivar_kanban_columns','avivar_kanban_leads','avivar_kanbans','avivar_knowledge_chunks','avivar_knowledge_documents','avivar_mensagens','avivar_onboarding_progress','avivar_patient_journeys','avivar_products','avivar_schedule_blocks','avivar_schedule_config','avivar_schedule_hours','avivar_team_members','avivar_tutorials','avivar_uazapi_instances','avivar_whatsapp_contacts','avivar_whatsapp_messages','avivar_whatsapp_sessions'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY "sa_all" ON public.%I FOR ALL USING (public.is_avivar_super_admin(auth.uid()))', tbl);
    EXECUTE format('CREATE POLICY "acct_s" ON public.%I FOR SELECT USING (account_id = public.get_user_avivar_account_id(auth.uid()))', tbl);
    EXECUTE format('CREATE POLICY "acct_i" ON public.%I FOR INSERT WITH CHECK (account_id = public.get_user_avivar_account_id(auth.uid()))', tbl);
    EXECUTE format('CREATE POLICY "acct_u" ON public.%I FOR UPDATE USING (account_id = public.get_user_avivar_account_id(auth.uid()))', tbl);
    EXECUTE format('CREATE POLICY "acct_d" ON public.%I FOR DELETE USING (account_id = public.get_user_avivar_account_id(auth.uid()))', tbl);
  END LOOP;
END $$;

-- Updated RPCs
CREATE OR REPLACE FUNCTION public.create_default_avivar_kanbans(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_comercial_id UUID; v_pos_venda_id UUID; v_account_id UUID;
BEGIN
  v_account_id := public.get_user_avivar_account_id(p_user_id);
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'Usuário sem conta Avivar'; END IF;
  IF EXISTS (SELECT 1 FROM avivar_kanbans WHERE account_id = v_account_id) THEN RETURN; END IF;
  INSERT INTO avivar_kanbans (user_id, account_id, name, description, icon, color, order_index) VALUES (p_user_id, v_account_id, 'Comercial', 'Funil de vendas', 'briefcase', 'from-blue-500 to-indigo-600', 0) RETURNING id INTO v_comercial_id;
  INSERT INTO avivar_kanban_columns (kanban_id, account_id, name, color, order_index) VALUES
    (v_comercial_id, v_account_id, 'Lead de Entrada', 'from-gray-500 to-gray-600', 0),(v_comercial_id, v_account_id, 'Triagem', 'from-yellow-500 to-amber-600', 1),(v_comercial_id, v_account_id, 'Tentando Agendar', 'from-orange-500 to-orange-600', 2),(v_comercial_id, v_account_id, 'Reagendamento', 'from-pink-500 to-rose-600', 3),(v_comercial_id, v_account_id, 'Agendado', 'from-blue-500 to-blue-600', 4),(v_comercial_id, v_account_id, 'Follow Up', 'from-purple-500 to-purple-600', 5),(v_comercial_id, v_account_id, 'Cliente', 'from-emerald-500 to-green-600', 6),(v_comercial_id, v_account_id, 'Desqualificados', 'from-red-500 to-red-600', 7);
  INSERT INTO avivar_kanbans (user_id, account_id, name, description, icon, color, order_index) VALUES (p_user_id, v_account_id, 'Pós-Venda', 'Acompanhamento pós-procedimento', 'heart-pulse', 'from-emerald-500 to-teal-600', 1) RETURNING id INTO v_pos_venda_id;
  INSERT INTO avivar_kanban_columns (kanban_id, account_id, name, color, order_index) VALUES
    (v_pos_venda_id, v_account_id, 'Onboarding', 'from-cyan-500 to-cyan-600', 0),(v_pos_venda_id, v_account_id, 'Cobrando Assinatura de Contrato', 'from-amber-500 to-orange-600', 1),(v_pos_venda_id, v_account_id, 'Contrato Assinado', 'from-emerald-500 to-green-600', 2);
END; $$;

CREATE OR REPLACE FUNCTION public.get_or_create_avivar_conversa(p_user_id uuid, p_numero varchar, p_conversa_id varchar DEFAULT NULL, p_nome_contato varchar DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_conversa_id UUID; v_account_id UUID;
BEGIN
  v_account_id := public.get_user_avivar_account_id(p_user_id);
  SELECT id INTO v_conversa_id FROM public.avivar_conversas WHERE account_id = v_account_id AND numero = p_numero LIMIT 1;
  IF v_conversa_id IS NULL THEN
    INSERT INTO public.avivar_conversas (user_id, account_id, numero, nome_contato, conversa_id, status) VALUES (p_user_id::text, v_account_id, p_numero, p_nome_contato, p_conversa_id, 'ativa') RETURNING id INTO v_conversa_id;
  ELSE UPDATE public.avivar_conversas SET nome_contato = COALESCE(p_nome_contato, nome_contato), updated_at = now() WHERE id = v_conversa_id;
  END IF;
  RETURN v_conversa_id;
END; $$;

CREATE OR REPLACE FUNCTION public.get_or_create_avivar_contact(p_user_id uuid, p_phone varchar, p_name varchar DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contact_id UUID; v_account_id UUID;
BEGIN
  v_account_id := public.get_user_avivar_account_id(p_user_id);
  SELECT id INTO v_contact_id FROM public.avivar_contacts WHERE account_id = v_account_id AND phone = p_phone LIMIT 1;
  IF v_contact_id IS NULL THEN
    INSERT INTO public.avivar_contacts (user_id, account_id, phone, name, source) VALUES (p_user_id, v_account_id, p_phone, p_name, 'whatsapp') RETURNING id INTO v_contact_id;
  ELSE UPDATE public.avivar_contacts SET last_contact_at = now(), name = COALESCE(p_name, name), updated_at = now() WHERE id = v_contact_id;
  END IF;
  RETURN v_contact_id;
END; $$;

CREATE OR REPLACE FUNCTION public.create_lead_from_contact(p_contact_id uuid, p_kanban_id uuid, p_column_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contact RECORD; v_lead_id UUID;
BEGIN
  SELECT * INTO v_contact FROM public.avivar_contacts WHERE id = p_contact_id;
  IF v_contact IS NULL THEN RAISE EXCEPTION 'Contact not found'; END IF;
  INSERT INTO public.avivar_kanban_leads (user_id, account_id, kanban_id, column_id, contact_id, name, phone, email, source)
  VALUES (v_contact.user_id, v_contact.account_id, p_kanban_id, p_column_id, p_contact_id, COALESCE(v_contact.name, 'Novo Lead'), v_contact.phone, v_contact.email, 'whatsapp_auto')
  RETURNING id INTO v_lead_id;
  RETURN v_lead_id;
END; $$;

CREATE TRIGGER update_avivar_accounts_updated_at BEFORE UPDATE ON public.avivar_accounts FOR EACH ROW EXECUTE FUNCTION public.update_followup_updated_at();
CREATE TRIGGER update_avivar_account_members_updated_at BEFORE UPDATE ON public.avivar_account_members FOR EACH ROW EXECUTE FUNCTION public.update_followup_updated_at();
