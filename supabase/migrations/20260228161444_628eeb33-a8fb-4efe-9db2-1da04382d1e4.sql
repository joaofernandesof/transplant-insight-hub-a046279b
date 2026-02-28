
-- Tabela para armazenar formulários de onboarding dos clientes médicos
CREATE TABLE public.ipromed_onboarding_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, submitted
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Dados pessoais
  doctor_name TEXT,
  birth_date DATE,
  
  -- CLÍNICA
  doc_entity_type VARCHAR(20), -- pessoa_fisica, pessoa_juridica
  cnpj VARCHAR(20),
  clinic_address TEXT,
  
  -- POLÍTICA DE CANCELAMENTO
  cancel_min_hours INTEGER,
  cancel_has_fine BOOLEAN,
  cancel_fine_detail TEXT,
  noshow_full_charge BOOLEAN,
  noshow_reschedule_policy TEXT,
  cancel_medical_emergency TEXT,
  
  -- SINAL / RESERVA DE AGENDA
  deposit_required BOOLEAN,
  deposit_amount TEXT,
  deposit_refundable BOOLEAN,
  deposit_convertible BOOLEAN,
  late_tolerance_minutes INTEGER,
  
  -- ATRASOS E PONTUALIDADE
  late_limit_minutes INTEGER,
  late_policy TEXT, -- cancelada, reduzida
  late_fit_in BOOLEAN,
  
  -- RETORNO E CONTINUIDADE
  has_followup BOOLEAN,
  followup_days INTEGER,
  followup_modality TEXT, -- presencial, online, ambos
  followup_scope TEXT, -- avaliacao, ajustes
  followup_expired_policy TEXT,
  
  -- CONFIRMAÇÃO E COMUNICAÇÃO
  confirmation_attempts INTEGER,
  no_response_auto_cancel BOOLEAN,
  official_channel TEXT, -- whatsapp, email, phone
  uses_auto_messages BOOLEAN,
  
  -- CONSULTA ONLINE
  has_teleconsultation BOOLEAN,
  teleconsultation_platform TEXT,
  
  -- DOCUMENTAÇÃO E PREPARO
  has_prior_instructions BOOLEAN,
  arrival_advance_minutes INTEGER,
  consultation_duration_minutes INTEGER,
  
  -- REGRAS FINANCEIRAS
  has_consultation_refund BOOLEAN,
  has_procedure_refund BOOLEAN,
  advance_payment_credit BOOLEAN,
  credit_validity_days INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX idx_onboarding_forms_client ON public.ipromed_onboarding_forms(client_id);
CREATE INDEX idx_onboarding_forms_token ON public.ipromed_onboarding_forms(token);

-- RLS
ALTER TABLE public.ipromed_onboarding_forms ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados do NeoHub podem ler/criar
CREATE POLICY "NeoHub users can manage onboarding forms"
  ON public.ipromed_onboarding_forms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: acesso público para preenchimento via token (anon pode ler e atualizar pelo token)
CREATE POLICY "Public can read form by token"
  ON public.ipromed_onboarding_forms
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can submit form by token"
  ON public.ipromed_onboarding_forms
  FOR UPDATE
  TO anon
  USING (status = 'pending')
  WITH CHECK (status = 'submitted');
