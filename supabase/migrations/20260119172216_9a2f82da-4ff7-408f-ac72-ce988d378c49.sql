-- =============================================
-- PORTAL NEO FOLIC - ESTRUTURA DE DADOS (CORRIGIDO)
-- =============================================

-- 1. ENUM para roles do portal
CREATE TYPE public.portal_role AS ENUM (
  'patient',
  'doctor', 
  'admin',
  'financial',
  'reception',
  'inventory'
);

-- 2. Tabela de usuários do portal
CREATE TABLE public.portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cpf text,
  birth_date date,
  gender text,
  avatar_url text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zip text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de roles do portal
CREATE TABLE public.portal_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id uuid NOT NULL REFERENCES public.portal_users(id) ON DELETE CASCADE,
  role portal_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(portal_user_id, role)
);

-- 4. Tabela de médicos
CREATE TABLE public.portal_doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id uuid UNIQUE NOT NULL REFERENCES public.portal_users(id) ON DELETE CASCADE,
  crm text NOT NULL,
  crm_state text,
  specialty text,
  rqe text,
  consultation_duration_minutes integer DEFAULT 30,
  bio text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Tabela de pacientes
CREATE TABLE public.portal_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id uuid UNIQUE NOT NULL REFERENCES public.portal_users(id) ON DELETE CASCADE,
  medical_record_number text UNIQUE,
  blood_type text,
  allergies text[],
  emergency_contact_name text,
  emergency_contact_phone text,
  health_insurance text,
  health_insurance_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Salas e equipamentos
CREATE TABLE public.portal_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  room_type text DEFAULT 'consultation',
  capacity integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.portal_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  serial_number text,
  room_id uuid REFERENCES public.portal_rooms(id),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 7. Agendamentos
CREATE TABLE public.portal_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.portal_patients(id),
  doctor_id uuid REFERENCES public.portal_doctors(id),
  room_id uuid REFERENCES public.portal_rooms(id),
  appointment_type text NOT NULL,
  procedure_type text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  status text DEFAULT 'scheduled',
  check_in_at timestamptz,
  check_out_at timestamptz,
  notes text,
  cancellation_reason text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Prontuário eletrônico
CREATE TABLE public.portal_medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.portal_patients(id),
  doctor_id uuid REFERENCES public.portal_doctors(id),
  appointment_id uuid REFERENCES public.portal_appointments(id),
  record_type text NOT NULL,
  content jsonb DEFAULT '{}',
  content_html text,
  template_id uuid,
  is_signed boolean DEFAULT false,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. Anexos
CREATE TABLE public.portal_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.portal_patients(id),
  medical_record_id uuid REFERENCES public.portal_medical_records(id),
  file_name text NOT NULL,
  file_type text,
  file_size bigint,
  file_url text NOT NULL,
  category text,
  description text,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

-- 10. Faturas
CREATE TABLE public.portal_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.portal_patients(id),
  appointment_id uuid REFERENCES public.portal_appointments(id),
  invoice_number text UNIQUE,
  description text,
  amount numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  status text DEFAULT 'pending',
  due_date date,
  paid_at timestamptz,
  payment_method text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. Pagamentos
CREATE TABLE public.portal_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.portal_invoices(id),
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  payment_date timestamptz DEFAULT now(),
  transaction_id text,
  status text DEFAULT 'completed',
  notes text,
  received_by uuid,
  created_at timestamptz DEFAULT now()
);

-- 12. Fluxo de caixa
CREATE TABLE public.portal_cash_flow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  category text,
  description text,
  amount numeric NOT NULL,
  date date NOT NULL,
  payment_id uuid REFERENCES public.portal_payments(id),
  is_recurring boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- 13. Estoque - Fornecedores
CREATE TABLE public.portal_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  email text,
  phone text,
  contact_name text,
  address text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 14. Estoque - Itens
CREATE TABLE public.portal_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE,
  barcode text,
  category text,
  unit text DEFAULT 'un',
  min_stock integer DEFAULT 0,
  current_stock integer DEFAULT 0,
  average_cost numeric DEFAULT 0,
  sale_price numeric DEFAULT 0,
  location text,
  supplier_id uuid REFERENCES public.portal_suppliers(id),
  expiry_alert_days integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 15. Estoque - Movimentações
CREATE TABLE public.portal_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.portal_inventory_items(id),
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  unit_cost numeric,
  total_cost numeric,
  reason text,
  appointment_id uuid REFERENCES public.portal_appointments(id),
  batch_number text,
  expiry_date date,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- 16. Templates de mensagem
CREATE TABLE public.portal_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  subject text,
  content text NOT NULL,
  variables text[],
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- 17. Conversas WhatsApp
CREATE TABLE public.portal_whatsapp_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.portal_patients(id),
  phone text NOT NULL,
  status text DEFAULT 'active',
  last_message_at timestamptz,
  unread_count integer DEFAULT 0,
  assigned_to uuid,
  created_at timestamptz DEFAULT now()
);

-- 18. Mensagens
CREATE TABLE public.portal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.portal_whatsapp_chats(id),
  direction text NOT NULL,
  content text,
  media_url text,
  media_type text,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 19. Automações
CREATE TABLE public.portal_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL,
  trigger_timing text,
  template_id uuid REFERENCES public.portal_message_templates(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 20. Campanhas
CREATE TABLE public.portal_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_criteria jsonb DEFAULT '{}',
  template_id uuid REFERENCES public.portal_message_templates(id),
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text DEFAULT 'draft',
  total_recipients integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- 21. Pesquisas e NPS
CREATE TABLE public.portal_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  questions jsonb DEFAULT '[]',
  is_nps boolean DEFAULT false,
  trigger_type text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.portal_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.portal_surveys(id),
  patient_id uuid REFERENCES public.portal_patients(id),
  doctor_id uuid REFERENCES public.portal_doctors(id),
  appointment_id uuid REFERENCES public.portal_appointments(id),
  answers jsonb DEFAULT '{}',
  nps_score integer,
  created_at timestamptz DEFAULT now()
);

-- 22. Teleconsulta
CREATE TABLE public.portal_teleconsultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid UNIQUE NOT NULL REFERENCES public.portal_appointments(id),
  room_url text,
  patient_joined_at timestamptz,
  doctor_joined_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  recording_url text,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

-- 23. Auditoria
CREATE TABLE public.portal_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 24. LGPD - Consentimentos
CREATE TABLE public.portal_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.portal_patients(id),
  consent_type text NOT NULL,
  version text,
  accepted boolean DEFAULT false,
  accepted_at timestamptz,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_portal_role(_auth_user_id uuid, _role portal_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.portal_user_roles pur
    JOIN public.portal_users pu ON pu.id = pur.portal_user_id
    WHERE pu.user_id = _auth_user_id
      AND pur.role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_portal_user_id(_auth_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pu.id FROM public.portal_users pu WHERE pu.user_id = _auth_user_id LIMIT 1
$$;

-- Triggers
CREATE TRIGGER update_portal_users_updated_at
  BEFORE UPDATE ON public.portal_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portal_appointments_updated_at
  BEFORE UPDATE ON public.portal_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ENABLE RLS
-- =============================================

ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_teleconsultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_consents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- portal_users
CREATE POLICY "portal_users_select" ON public.portal_users FOR SELECT
  USING (user_id = auth.uid() OR has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'reception'));
CREATE POLICY "portal_users_update" ON public.portal_users FOR UPDATE
  USING (user_id = auth.uid() OR has_portal_role(auth.uid(), 'admin'));
CREATE POLICY "portal_users_insert" ON public.portal_users FOR INSERT
  WITH CHECK (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'reception') OR user_id = auth.uid());

-- portal_user_roles
CREATE POLICY "portal_roles_admin" ON public.portal_user_roles FOR ALL
  USING (has_portal_role(auth.uid(), 'admin'));
CREATE POLICY "portal_roles_view_own" ON public.portal_user_roles FOR SELECT
  USING (portal_user_id = get_portal_user_id(auth.uid()));

-- portal_doctors
CREATE POLICY "portal_doctors_admin" ON public.portal_doctors FOR ALL
  USING (has_portal_role(auth.uid(), 'admin'));
CREATE POLICY "portal_doctors_view" ON public.portal_doctors FOR SELECT
  USING (portal_user_id = get_portal_user_id(auth.uid()) OR has_portal_role(auth.uid(), 'reception'));

-- portal_patients
CREATE POLICY "portal_patients_admin" ON public.portal_patients FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'reception'));
CREATE POLICY "portal_patients_view_own" ON public.portal_patients FOR SELECT
  USING (portal_user_id = get_portal_user_id(auth.uid()));

-- portal_rooms
CREATE POLICY "portal_rooms_all" ON public.portal_rooms FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'reception'));
CREATE POLICY "portal_rooms_view" ON public.portal_rooms FOR SELECT
  USING (has_portal_role(auth.uid(), 'doctor'));

-- portal_equipment
CREATE POLICY "portal_equipment_all" ON public.portal_equipment FOR ALL
  USING (has_portal_role(auth.uid(), 'admin'));
CREATE POLICY "portal_equipment_view" ON public.portal_equipment FOR SELECT
  USING (has_portal_role(auth.uid(), 'doctor') OR has_portal_role(auth.uid(), 'reception'));

-- portal_appointments
CREATE POLICY "portal_appointments_staff" ON public.portal_appointments FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'doctor') OR has_portal_role(auth.uid(), 'reception'));
CREATE POLICY "portal_appointments_patient" ON public.portal_appointments FOR SELECT
  USING (patient_id IN (SELECT pp.id FROM public.portal_patients pp WHERE pp.portal_user_id = get_portal_user_id(auth.uid())));
CREATE POLICY "portal_appointments_patient_insert" ON public.portal_appointments FOR INSERT
  WITH CHECK (patient_id IN (SELECT pp.id FROM public.portal_patients pp WHERE pp.portal_user_id = get_portal_user_id(auth.uid())));

-- portal_medical_records
CREATE POLICY "portal_records_doctor" ON public.portal_medical_records FOR ALL
  USING (has_portal_role(auth.uid(), 'doctor') OR has_portal_role(auth.uid(), 'admin'));
CREATE POLICY "portal_records_patient" ON public.portal_medical_records FOR SELECT
  USING (patient_id IN (SELECT pp.id FROM public.portal_patients pp WHERE pp.portal_user_id = get_portal_user_id(auth.uid())));

-- portal_attachments
CREATE POLICY "portal_attachments_staff" ON public.portal_attachments FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'doctor'));
CREATE POLICY "portal_attachments_patient" ON public.portal_attachments FOR SELECT
  USING (patient_id IN (SELECT pp.id FROM public.portal_patients pp WHERE pp.portal_user_id = get_portal_user_id(auth.uid())));

-- portal_invoices
CREATE POLICY "portal_invoices_staff" ON public.portal_invoices FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'financial') OR has_portal_role(auth.uid(), 'reception'));
CREATE POLICY "portal_invoices_patient" ON public.portal_invoices FOR SELECT
  USING (patient_id IN (SELECT pp.id FROM public.portal_patients pp WHERE pp.portal_user_id = get_portal_user_id(auth.uid())));

-- portal_payments
CREATE POLICY "portal_payments_staff" ON public.portal_payments FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'financial'));

-- portal_cash_flow
CREATE POLICY "portal_cash_flow_staff" ON public.portal_cash_flow FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'financial'));

-- portal_inventory_items
CREATE POLICY "portal_inventory_manage" ON public.portal_inventory_items FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'inventory'));
CREATE POLICY "portal_inventory_view" ON public.portal_inventory_items FOR SELECT
  USING (has_portal_role(auth.uid(), 'doctor') OR has_portal_role(auth.uid(), 'reception'));

-- portal_stock_movements
CREATE POLICY "portal_stock_manage" ON public.portal_stock_movements FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'inventory'));

-- portal_suppliers
CREATE POLICY "portal_suppliers_manage" ON public.portal_suppliers FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'inventory'));

-- portal_message_templates
CREATE POLICY "portal_templates_admin" ON public.portal_message_templates FOR ALL
  USING (has_portal_role(auth.uid(), 'admin'));
CREATE POLICY "portal_templates_view" ON public.portal_message_templates FOR SELECT
  USING (has_portal_role(auth.uid(), 'reception'));

-- portal_whatsapp_chats
CREATE POLICY "portal_chats_staff" ON public.portal_whatsapp_chats FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'reception'));

-- portal_messages
CREATE POLICY "portal_messages_staff" ON public.portal_messages FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'reception'));

-- portal_automations
CREATE POLICY "portal_automations_admin" ON public.portal_automations FOR ALL
  USING (has_portal_role(auth.uid(), 'admin'));

-- portal_campaigns
CREATE POLICY "portal_campaigns_admin" ON public.portal_campaigns FOR ALL
  USING (has_portal_role(auth.uid(), 'admin'));

-- portal_surveys
CREATE POLICY "portal_surveys_admin" ON public.portal_surveys FOR ALL
  USING (has_portal_role(auth.uid(), 'admin'));
CREATE POLICY "portal_surveys_view" ON public.portal_surveys FOR SELECT
  USING (is_active = true);

-- portal_survey_responses
CREATE POLICY "portal_responses_admin" ON public.portal_survey_responses FOR SELECT
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'doctor'));
CREATE POLICY "portal_responses_insert" ON public.portal_survey_responses FOR INSERT
  WITH CHECK (true);

-- portal_teleconsultations
CREATE POLICY "portal_teleconsult_staff" ON public.portal_teleconsultations FOR ALL
  USING (has_portal_role(auth.uid(), 'admin') OR has_portal_role(auth.uid(), 'doctor'));
CREATE POLICY "portal_teleconsult_patient" ON public.portal_teleconsultations FOR SELECT
  USING (appointment_id IN (
    SELECT pa.id FROM public.portal_appointments pa 
    WHERE pa.patient_id IN (SELECT pp.id FROM public.portal_patients pp WHERE pp.portal_user_id = get_portal_user_id(auth.uid()))
  ));

-- portal_audit_logs
CREATE POLICY "portal_audit_admin" ON public.portal_audit_logs FOR SELECT
  USING (has_portal_role(auth.uid(), 'admin'));
CREATE POLICY "portal_audit_insert" ON public.portal_audit_logs FOR INSERT
  WITH CHECK (true);

-- portal_consents
CREATE POLICY "portal_consents_admin" ON public.portal_consents FOR SELECT
  USING (has_portal_role(auth.uid(), 'admin'));
CREATE POLICY "portal_consents_patient" ON public.portal_consents FOR SELECT
  USING (patient_id IN (SELECT pp.id FROM public.portal_patients pp WHERE pp.portal_user_id = get_portal_user_id(auth.uid())));
CREATE POLICY "portal_consents_insert" ON public.portal_consents FOR INSERT
  WITH CHECK (true);