
-- =============================================
-- 1. Sucesso do Paciente: Protocolos de Retenção
-- =============================================
CREATE TABLE public.neoteam_retention_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.neoteam_branches(id),
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL DEFAULT 'manual', -- manual, no_show, churn_risk, nps_low
  trigger_days_inactive int, -- dias sem retorno para disparar
  actions jsonb DEFAULT '[]'::jsonb, -- lista de ações automáticas
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.neoteam_retention_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view retention protocols"
  ON public.neoteam_retention_protocols FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));
CREATE POLICY "Members manage retention protocols"
  ON public.neoteam_retention_protocols FOR ALL TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()))
  WITH CHECK (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE TABLE public.neoteam_churn_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.neoteam_branches(id),
  patient_id uuid,
  patient_name text NOT NULL,
  patient_phone text,
  risk_level text NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  reason text, -- no_show, inactive, nps_detractor, complaint
  last_visit_at timestamptz,
  days_inactive int,
  protocol_id uuid REFERENCES public.neoteam_retention_protocols(id),
  status text NOT NULL DEFAULT 'open', -- open, contacted, recovered, lost
  notes text,
  assigned_to uuid,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.neoteam_churn_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view churn alerts"
  ON public.neoteam_churn_alerts FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));
CREATE POLICY "Members manage churn alerts"
  ON public.neoteam_churn_alerts FOR ALL TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()))
  WITH CHECK (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

-- =============================================
-- 2. Jurídico: Gestão de Contratos
-- =============================================
CREATE TABLE public.neoteam_legal_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.neoteam_branches(id),
  title text NOT NULL,
  contract_type text NOT NULL DEFAULT 'service', -- service, rental, employment, supplier, partnership
  party_name text NOT NULL,
  party_document text, -- CPF/CNPJ
  start_date date NOT NULL,
  end_date date,
  renewal_date date,
  value numeric(12,2),
  recurrence text DEFAULT 'monthly', -- once, monthly, yearly
  status text NOT NULL DEFAULT 'active', -- draft, active, expiring, expired, cancelled
  file_url text,
  notes text,
  alert_days_before int DEFAULT 30, -- dias antes do vencimento para alertar
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.neoteam_legal_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view legal contracts"
  ON public.neoteam_legal_contracts FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));
CREATE POLICY "Members manage legal contracts"
  ON public.neoteam_legal_contracts FOR ALL TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()))
  WITH CHECK (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

-- =============================================
-- 3. TI: Chamados Internos
-- =============================================
CREATE TABLE public.neoteam_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.neoteam_branches(id),
  ticket_number text NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general', -- general, hardware, software, network, access, other
  priority text NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status text NOT NULL DEFAULT 'open', -- open, in_progress, waiting, resolved, closed
  requester_id uuid NOT NULL,
  requester_name text NOT NULL,
  assigned_to uuid,
  assigned_name text,
  resolution_notes text,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.neoteam_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view tickets"
  ON public.neoteam_tickets FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));
CREATE POLICY "Members manage tickets"
  ON public.neoteam_tickets FOR ALL TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()))
  WITH CHECK (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

-- =============================================
-- 4. Marketing: Campanhas
-- =============================================
CREATE TABLE public.neoteam_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES public.neoteam_branches(id),
  name text NOT NULL,
  description text,
  campaign_type text NOT NULL DEFAULT 'social_media', -- social_media, email, sms, event, print, paid_ads
  channel text, -- instagram, facebook, google, whatsapp, etc
  status text NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  start_date date,
  end_date date,
  budget numeric(12,2),
  spent numeric(12,2) DEFAULT 0,
  reach int DEFAULT 0,
  leads_generated int DEFAULT 0,
  conversions int DEFAULT 0,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.neoteam_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view campaigns"
  ON public.neoteam_campaigns FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));
CREATE POLICY "Members manage campaigns"
  ON public.neoteam_campaigns FOR ALL TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()))
  WITH CHECK (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

-- Audit triggers
CREATE TRIGGER neoteam_audit_retention_protocols
  AFTER INSERT OR UPDATE OR DELETE ON public.neoteam_retention_protocols
  FOR EACH ROW EXECUTE FUNCTION public.neoteam_audit_trigger_fn();

CREATE TRIGGER neoteam_audit_churn_alerts
  AFTER INSERT OR UPDATE OR DELETE ON public.neoteam_churn_alerts
  FOR EACH ROW EXECUTE FUNCTION public.neoteam_audit_trigger_fn();

CREATE TRIGGER neoteam_audit_legal_contracts
  AFTER INSERT OR UPDATE OR DELETE ON public.neoteam_legal_contracts
  FOR EACH ROW EXECUTE FUNCTION public.neoteam_audit_trigger_fn();

CREATE TRIGGER neoteam_audit_tickets
  AFTER INSERT OR UPDATE OR DELETE ON public.neoteam_tickets
  FOR EACH ROW EXECUTE FUNCTION public.neoteam_audit_trigger_fn();

CREATE TRIGGER neoteam_audit_campaigns
  AFTER INSERT OR UPDATE OR DELETE ON public.neoteam_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.neoteam_audit_trigger_fn();
