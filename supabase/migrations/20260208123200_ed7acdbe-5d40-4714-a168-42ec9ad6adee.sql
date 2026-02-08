-- =============================================
-- IPROMED Financial Module - Complete Schema
-- =============================================

-- Sequence for billing numbers
CREATE SEQUENCE IF NOT EXISTS ipromed_billing_seq START 1;

-- 1. Contas a Pagar (Payables)
CREATE TABLE public.ipromed_payables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  supplier TEXT,
  category TEXT NOT NULL DEFAULT 'outros',
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  payment_method TEXT,
  cost_center TEXT,
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  recurrence TEXT CHECK (recurrence IN ('unico', 'mensal', 'trimestral', 'anual')),
  parent_id UUID REFERENCES public.ipromed_payables(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Contas a Receber (Receivables)
CREATE TABLE public.ipromed_receivables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.ipromed_legal_clients(id),
  contract_id UUID REFERENCES public.ipromed_contracts(id),
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'honorarios',
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  received_date DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'vencido', 'cancelado', 'parcial')),
  payment_method TEXT,
  cost_center TEXT,
  notes TEXT,
  installment_number INTEGER,
  total_installments INTEGER,
  billing_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Cobranças (Billings)
CREATE TABLE public.ipromed_billings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  billing_number TEXT NOT NULL UNIQUE,
  receivable_id UUID REFERENCES public.ipromed_receivables(id),
  client_id UUID REFERENCES public.ipromed_legal_clients(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('pix', 'boleto', 'link', 'manual')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'visualizado', 'pago', 'vencido', 'cancelado')),
  pix_code TEXT,
  boleto_code TEXT,
  payment_link TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Contas Bancárias (Bank Accounts) - Ready for API integration
CREATE TABLE public.ipromed_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_code TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  agency TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'corrente' CHECK (account_type IN ('corrente', 'poupanca', 'pagamento')),
  account_holder TEXT,
  balance NUMERIC(14,2) DEFAULT 0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  integration_provider TEXT,
  integration_id TEXT,
  integration_status TEXT DEFAULT 'manual' CHECK (integration_status IN ('manual', 'pending', 'connected', 'error')),
  integration_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, bank_code, agency, account_number)
);

-- 5. Transações Bancárias (Bank Transactions)
CREATE TABLE public.ipromed_bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_account_id UUID NOT NULL REFERENCES public.ipromed_bank_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  category TEXT,
  reconciliation_status TEXT DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'matched', 'partial', 'ignored')),
  matched_payable_id UUID REFERENCES public.ipromed_payables(id),
  matched_receivable_id UUID REFERENCES public.ipromed_receivables(id),
  matched_at TIMESTAMP WITH TIME ZONE,
  matched_by UUID,
  import_source TEXT,
  external_id TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ipromed_payables_user_status ON public.ipromed_payables(user_id, status);
CREATE INDEX idx_ipromed_payables_due_date ON public.ipromed_payables(due_date);
CREATE INDEX idx_ipromed_receivables_user_status ON public.ipromed_receivables(user_id, status);
CREATE INDEX idx_ipromed_receivables_due_date ON public.ipromed_receivables(due_date);
CREATE INDEX idx_ipromed_receivables_client ON public.ipromed_receivables(client_id);
CREATE INDEX idx_ipromed_billings_user_status ON public.ipromed_billings(user_id, status);
CREATE INDEX idx_ipromed_billings_due_date ON public.ipromed_billings(due_date);
CREATE INDEX idx_ipromed_bank_transactions_account ON public.ipromed_bank_transactions(bank_account_id);
CREATE INDEX idx_ipromed_bank_transactions_date ON public.ipromed_bank_transactions(transaction_date);
CREATE INDEX idx_ipromed_bank_transactions_reconciliation ON public.ipromed_bank_transactions(reconciliation_status);

-- Trigger function
CREATE OR REPLACE FUNCTION public.update_ipromed_financial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ipromed_payables_updated_at
  BEFORE UPDATE ON public.ipromed_payables
  FOR EACH ROW EXECUTE FUNCTION public.update_ipromed_financial_updated_at();

CREATE TRIGGER update_ipromed_receivables_updated_at
  BEFORE UPDATE ON public.ipromed_receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_ipromed_financial_updated_at();

CREATE TRIGGER update_ipromed_billings_updated_at
  BEFORE UPDATE ON public.ipromed_billings
  FOR EACH ROW EXECUTE FUNCTION public.update_ipromed_financial_updated_at();

CREATE TRIGGER update_ipromed_bank_accounts_updated_at
  BEFORE UPDATE ON public.ipromed_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_ipromed_financial_updated_at();

-- Billing number generator
CREATE OR REPLACE FUNCTION public.generate_ipromed_billing_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.billing_number := 'COB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ipromed_billing_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER set_ipromed_billing_number
  BEFORE INSERT ON public.ipromed_billings
  FOR EACH ROW EXECUTE FUNCTION public.generate_ipromed_billing_number();

-- RLS
ALTER TABLE public.ipromed_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_bank_transactions ENABLE ROW LEVEL SECURITY;

-- Payables Policies
CREATE POLICY "Users can view their own payables" ON public.ipromed_payables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payables" ON public.ipromed_payables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payables" ON public.ipromed_payables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payables" ON public.ipromed_payables FOR DELETE USING (auth.uid() = user_id);

-- Receivables Policies
CREATE POLICY "Users can view their own receivables" ON public.ipromed_receivables FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own receivables" ON public.ipromed_receivables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own receivables" ON public.ipromed_receivables FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receivables" ON public.ipromed_receivables FOR DELETE USING (auth.uid() = user_id);

-- Billings Policies
CREATE POLICY "Users can view their own billings" ON public.ipromed_billings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own billings" ON public.ipromed_billings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own billings" ON public.ipromed_billings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own billings" ON public.ipromed_billings FOR DELETE USING (auth.uid() = user_id);

-- Bank Accounts Policies
CREATE POLICY "Users can view their own bank accounts" ON public.ipromed_bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bank accounts" ON public.ipromed_bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank accounts" ON public.ipromed_bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bank accounts" ON public.ipromed_bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- Bank Transactions Policies
CREATE POLICY "Users can view their own bank transactions" ON public.ipromed_bank_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bank transactions" ON public.ipromed_bank_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank transactions" ON public.ipromed_bank_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bank transactions" ON public.ipromed_bank_transactions FOR DELETE USING (auth.uid() = user_id);