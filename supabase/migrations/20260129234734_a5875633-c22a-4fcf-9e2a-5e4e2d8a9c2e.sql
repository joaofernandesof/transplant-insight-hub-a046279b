-- =============================================
-- NEOPAY - Sistema de Gateway de Pagamentos
-- =============================================

-- Enum para status de transação
CREATE TYPE neopay_transaction_status AS ENUM (
  'pending',
  'authorized',
  'captured',
  'cancelled',
  'failed',
  'refunded',
  'partially_refunded',
  'chargeback'
);

-- Enum para tipo de produto
CREATE TYPE neopay_product_type AS ENUM (
  'product',
  'service',
  'subscription',
  'plan'
);

-- Enum para método de pagamento
CREATE TYPE neopay_payment_method AS ENUM (
  'credit_card',
  'debit_card',
  'pix',
  'boleto',
  'payment_link'
);

-- Enum para status de split
CREATE TYPE neopay_split_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- Enum para status de inadimplência
CREATE TYPE neopay_delinquency_status AS ENUM (
  'current',
  'late',
  'delinquent',
  'blocked',
  'recovered'
);

-- =============================================
-- TABELA: Produtos e Serviços
-- =============================================
CREATE TABLE public.neopay_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type neopay_product_type NOT NULL DEFAULT 'product',
  price DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Para assinaturas/planos
  billing_interval TEXT, -- 'monthly', 'yearly', 'weekly'
  billing_interval_count INTEGER DEFAULT 1,
  trial_days INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  external_id TEXT, -- ID no gateway externo
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Clientes (para pagamentos)
-- =============================================
CREATE TABLE public.neopay_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  neohub_user_id UUID REFERENCES public.neohub_users(id),
  
  -- Dados do cliente
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  
  -- ID no gateway externo
  external_customer_id TEXT,
  
  -- Dados de cartão tokenizado (apenas referência)
  default_payment_method_id TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Cobranças
-- =============================================
CREATE TABLE public.neopay_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  customer_id UUID REFERENCES public.neopay_customers(id) NOT NULL,
  product_id UUID REFERENCES public.neopay_products(id),
  contract_id UUID, -- Referência para contratos existentes
  subscription_id UUID, -- Para cobranças recorrentes
  
  -- Valores
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  installments INTEGER DEFAULT 1,
  installment_amount DECIMAL(12,2),
  
  -- Método e status
  payment_method neopay_payment_method NOT NULL,
  status neopay_transaction_status NOT NULL DEFAULT 'pending',
  
  -- Datas
  due_date DATE,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Dados do pagamento
  payment_link TEXT,
  pix_code TEXT,
  pix_qr_code TEXT,
  boleto_url TEXT,
  boleto_barcode TEXT,
  
  -- Gateway
  external_id TEXT,
  gateway_response JSONB,
  
  -- Descrição
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Transações (histórico detalhado)
-- =============================================
CREATE TABLE public.neopay_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id UUID REFERENCES public.neopay_charges(id) NOT NULL,
  
  -- Tipo de operação
  operation TEXT NOT NULL, -- 'authorization', 'capture', 'cancel', 'refund'
  status neopay_transaction_status NOT NULL,
  
  -- Valores
  amount DECIMAL(12,2) NOT NULL,
  
  -- Gateway
  external_id TEXT,
  gateway_response JSONB,
  error_message TEXT,
  
  -- Auditoria
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Configuração de Split
-- =============================================
CREATE TABLE public.neopay_split_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pode ser vinculado a produto ou global
  product_id UUID REFERENCES public.neopay_products(id),
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Recebedores do Split
-- =============================================
CREATE TABLE public.neopay_split_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_rule_id UUID REFERENCES public.neopay_split_rules(id) ON DELETE CASCADE NOT NULL,
  
  -- Recebedor
  recipient_user_id UUID REFERENCES auth.users(id),
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  recipient_cpf_cnpj TEXT,
  
  -- Dados bancários (criptografados/tokenizados)
  bank_account_id TEXT,
  
  -- Configuração do split
  split_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' ou 'fixed'
  split_value DECIMAL(12,4) NOT NULL, -- % ou valor fixo
  
  -- Taxa administrativa retida
  admin_fee_percentage DECIMAL(5,2) DEFAULT 0,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Repasses (execução do split)
-- =============================================
CREATE TABLE public.neopay_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  charge_id UUID REFERENCES public.neopay_charges(id) NOT NULL,
  recipient_id UUID REFERENCES public.neopay_split_recipients(id) NOT NULL,
  
  -- Valores
  gross_amount DECIMAL(12,2) NOT NULL,
  admin_fee DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  
  status neopay_split_status NOT NULL DEFAULT 'pending',
  
  -- Datas
  scheduled_date DATE,
  transferred_at TIMESTAMPTZ,
  
  -- Gateway
  external_id TEXT,
  gateway_response JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Assinaturas
-- =============================================
CREATE TABLE public.neopay_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  customer_id UUID REFERENCES public.neopay_customers(id) NOT NULL,
  product_id UUID REFERENCES public.neopay_products(id) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'past_due'
  
  -- Período
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Cancelamento
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  
  -- Gateway
  external_id TEXT,
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Gestão de Inadimplência
-- =============================================
CREATE TABLE public.neopay_delinquency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  customer_id UUID REFERENCES public.neopay_customers(id) NOT NULL,
  charge_id UUID REFERENCES public.neopay_charges(id),
  subscription_id UUID REFERENCES public.neopay_subscriptions(id),
  
  status neopay_delinquency_status NOT NULL DEFAULT 'late',
  
  -- Valores em atraso
  overdue_amount DECIMAL(12,2) NOT NULL,
  days_overdue INTEGER NOT NULL DEFAULT 0,
  
  -- Tentativas de cobrança
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  -- Notificações enviadas
  notifications_sent INTEGER DEFAULT 0,
  last_notification_at TIMESTAMPTZ,
  
  -- Bloqueio
  access_blocked BOOLEAN DEFAULT false,
  blocked_at TIMESTAMPTZ,
  
  -- Resolução
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Reembolsos
-- =============================================
CREATE TABLE public.neopay_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  charge_id UUID REFERENCES public.neopay_charges(id) NOT NULL,
  transaction_id UUID REFERENCES public.neopay_transactions(id),
  
  -- Valores
  amount DECIMAL(12,2) NOT NULL,
  refund_type TEXT NOT NULL DEFAULT 'full', -- 'full' ou 'partial'
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
  
  -- Motivo
  reason TEXT NOT NULL,
  notes TEXT,
  
  -- Gateway
  external_id TEXT,
  gateway_response JSONB,
  
  -- Processamento
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Chargebacks
-- =============================================
CREATE TABLE public.neopay_chargebacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  charge_id UUID REFERENCES public.neopay_charges(id) NOT NULL,
  
  -- Valores
  amount DECIMAL(12,2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'won', 'lost'
  
  -- Detalhes
  reason_code TEXT,
  reason_description TEXT,
  
  -- Contestação
  dispute_deadline TIMESTAMPTZ,
  evidence_submitted BOOLEAN DEFAULT false,
  evidence_deadline TIMESTAMPTZ,
  
  -- Resolução
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  
  -- Gateway
  external_id TEXT,
  gateway_response JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Evidências de Chargeback
-- =============================================
CREATE TABLE public.neopay_chargeback_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  chargeback_id UUID REFERENCES public.neopay_chargebacks(id) ON DELETE CASCADE NOT NULL,
  
  -- Arquivo
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  
  -- Descrição
  description TEXT,
  evidence_type TEXT, -- 'receipt', 'contract', 'communication', 'delivery_proof', 'other'
  
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Automações
-- =============================================
CREATE TABLE public.neopay_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Trigger
  trigger_event TEXT NOT NULL, -- 'payment_approved', 'payment_failed', 'chargeback', 'delinquent'
  
  -- Ação
  action_type TEXT NOT NULL, -- 'grant_access', 'revoke_access', 'send_notification', 'block_user'
  action_config JSONB NOT NULL DEFAULT '{}',
  
  -- Condições
  conditions JSONB DEFAULT '{}',
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Logs de Automação
-- =============================================
CREATE TABLE public.neopay_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  automation_id UUID REFERENCES public.neopay_automations(id) NOT NULL,
  
  -- Contexto
  trigger_event TEXT NOT NULL,
  trigger_data JSONB,
  
  -- Resultado
  success BOOLEAN NOT NULL,
  result_message TEXT,
  error_message TEXT,
  
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- TABELA: Configurações do NeoPay
-- =============================================
CREATE TABLE public.neopay_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- RLS - Enable
-- =============================================
ALTER TABLE public.neopay_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_split_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_split_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_delinquency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_chargebacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_chargeback_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neopay_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies - Admin full access
-- =============================================

-- Products
CREATE POLICY "Admins can manage products" ON public.neopay_products
FOR ALL USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Authenticated can view active products" ON public.neopay_products
FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Customers
CREATE POLICY "Admins can manage customers" ON public.neopay_customers
FOR ALL USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Users can view own customer record" ON public.neopay_customers
FOR SELECT USING (user_id = auth.uid());

-- Charges
CREATE POLICY "Admins can manage charges" ON public.neopay_charges
FOR ALL USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Users can view own charges" ON public.neopay_charges
FOR SELECT USING (
  customer_id IN (SELECT id FROM public.neopay_customers WHERE user_id = auth.uid())
);

-- Transactions
CREATE POLICY "Admins can manage transactions" ON public.neopay_transactions
FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Split Rules
CREATE POLICY "Admins can manage split rules" ON public.neopay_split_rules
FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Split Recipients
CREATE POLICY "Admins can manage recipients" ON public.neopay_split_recipients
FOR ALL USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Recipients can view own data" ON public.neopay_split_recipients
FOR SELECT USING (recipient_user_id = auth.uid());

-- Transfers
CREATE POLICY "Admins can manage transfers" ON public.neopay_transfers
FOR ALL USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Recipients can view own transfers" ON public.neopay_transfers
FOR SELECT USING (
  recipient_id IN (SELECT id FROM public.neopay_split_recipients WHERE recipient_user_id = auth.uid())
);

-- Subscriptions
CREATE POLICY "Admins can manage subscriptions" ON public.neopay_subscriptions
FOR ALL USING (public.is_neohub_admin(auth.uid()));

CREATE POLICY "Users can view own subscriptions" ON public.neopay_subscriptions
FOR SELECT USING (
  customer_id IN (SELECT id FROM public.neopay_customers WHERE user_id = auth.uid())
);

-- Delinquency
CREATE POLICY "Admins can manage delinquency" ON public.neopay_delinquency
FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Refunds
CREATE POLICY "Admins can manage refunds" ON public.neopay_refunds
FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Chargebacks
CREATE POLICY "Admins can manage chargebacks" ON public.neopay_chargebacks
FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Chargeback Evidence
CREATE POLICY "Admins can manage evidence" ON public.neopay_chargeback_evidence
FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Automations
CREATE POLICY "Admins can manage automations" ON public.neopay_automations
FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Automation Logs
CREATE POLICY "Admins can view automation logs" ON public.neopay_automation_logs
FOR SELECT USING (public.is_neohub_admin(auth.uid()));

-- Settings
CREATE POLICY "Admins can manage settings" ON public.neopay_settings
FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_neopay_charges_customer ON public.neopay_charges(customer_id);
CREATE INDEX idx_neopay_charges_status ON public.neopay_charges(status);
CREATE INDEX idx_neopay_charges_due_date ON public.neopay_charges(due_date);
CREATE INDEX idx_neopay_transactions_charge ON public.neopay_transactions(charge_id);
CREATE INDEX idx_neopay_transfers_charge ON public.neopay_transfers(charge_id);
CREATE INDEX idx_neopay_transfers_status ON public.neopay_transfers(status);
CREATE INDEX idx_neopay_delinquency_customer ON public.neopay_delinquency(customer_id);
CREATE INDEX idx_neopay_delinquency_status ON public.neopay_delinquency(status);
CREATE INDEX idx_neopay_subscriptions_customer ON public.neopay_subscriptions(customer_id);
CREATE INDEX idx_neopay_subscriptions_status ON public.neopay_subscriptions(status);

-- =============================================
-- Triggers para updated_at
-- =============================================
CREATE TRIGGER update_neopay_products_updated_at
  BEFORE UPDATE ON public.neopay_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_customers_updated_at
  BEFORE UPDATE ON public.neopay_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_charges_updated_at
  BEFORE UPDATE ON public.neopay_charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_split_rules_updated_at
  BEFORE UPDATE ON public.neopay_split_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_split_recipients_updated_at
  BEFORE UPDATE ON public.neopay_split_recipients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_transfers_updated_at
  BEFORE UPDATE ON public.neopay_transfers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_subscriptions_updated_at
  BEFORE UPDATE ON public.neopay_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_delinquency_updated_at
  BEFORE UPDATE ON public.neopay_delinquency
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_refunds_updated_at
  BEFORE UPDATE ON public.neopay_refunds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_chargebacks_updated_at
  BEFORE UPDATE ON public.neopay_chargebacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neopay_automations_updated_at
  BEFORE UPDATE ON public.neopay_automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();