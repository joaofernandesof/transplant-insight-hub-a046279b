-- =========================================
-- Tabela de Parcelas do Contrato CPG
-- Gestão completa de pagamentos
-- =========================================

-- Tabela de parcelas (installments)
CREATE TABLE public.ipromed_contract_installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.ipromed_contracts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  
  -- Dados da parcela
  installment_number INTEGER NOT NULL,          -- Número da parcela (1, 2, 3...)
  description TEXT,                              -- Descrição opcional (ex: "Entrada", "Parcela 1/12")
  amount NUMERIC(12,2) NOT NULL,                 -- Valor da parcela
  due_date DATE NOT NULL,                        -- Data de vencimento
  
  -- Status e pagamento
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,             -- Data/hora do pagamento
  paid_amount NUMERIC(12,2),                    -- Valor efetivamente pago
  payment_method TEXT,                          -- Método de pagamento (pix, boleto, cartão, etc)
  payment_reference TEXT,                       -- Referência/comprovante
  
  -- Juros e multas
  late_fee NUMERIC(12,2) DEFAULT 0,             -- Multa por atraso
  interest NUMERIC(12,2) DEFAULT 0,             -- Juros
  discount NUMERIC(12,2) DEFAULT 0,             -- Desconto aplicado
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de pagamentos (quando um pagamento é registrado)
CREATE TABLE public.ipromed_payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_id UUID NOT NULL REFERENCES public.ipromed_contract_installments(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.ipromed_contracts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  
  -- Dados do pagamento
  amount NUMERIC(12,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  
  -- Registro
  registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_installments_contract ON public.ipromed_contract_installments(contract_id);
CREATE INDEX idx_installments_client ON public.ipromed_contract_installments(client_id);
CREATE INDEX idx_installments_status ON public.ipromed_contract_installments(status);
CREATE INDEX idx_installments_due_date ON public.ipromed_contract_installments(due_date);
CREATE INDEX idx_payment_history_installment ON public.ipromed_payment_history(installment_id);
CREATE INDEX idx_payment_history_client ON public.ipromed_payment_history(client_id);

-- Enable RLS
ALTER TABLE public.ipromed_contract_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ipromed_payment_history ENABLE ROW LEVEL SECURITY;

-- Policies para ipromed_contract_installments
CREATE POLICY "Authenticated users can view installments"
ON public.ipromed_contract_installments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert installments"
ON public.ipromed_contract_installments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update installments"
ON public.ipromed_contract_installments FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete installments"
ON public.ipromed_contract_installments FOR DELETE
TO authenticated
USING (true);

-- Policies para ipromed_payment_history
CREATE POLICY "Authenticated users can view payment history"
ON public.ipromed_payment_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert payment history"
ON public.ipromed_payment_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ipromed_installment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ipromed_installments_updated_at
BEFORE UPDATE ON public.ipromed_contract_installments
FOR EACH ROW EXECUTE FUNCTION update_ipromed_installment_updated_at();

-- Adicionar campos de valor total e pagamento ao contrato (se não existir)
DO $$ 
BEGIN
  -- Campo para valor total do contrato
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipromed_contracts' AND column_name = 'total_value') THEN
    ALTER TABLE public.ipromed_contracts ADD COLUMN total_value NUMERIC(12,2);
  END IF;
  
  -- Campo para número de parcelas acordadas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipromed_contracts' AND column_name = 'installment_count') THEN
    ALTER TABLE public.ipromed_contracts ADD COLUMN installment_count INTEGER DEFAULT 1;
  END IF;
  
  -- Campo para valor de entrada
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipromed_contracts' AND column_name = 'down_payment') THEN
    ALTER TABLE public.ipromed_contracts ADD COLUMN down_payment NUMERIC(12,2) DEFAULT 0;
  END IF;
  
  -- Dia preferencial de vencimento
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipromed_contracts' AND column_name = 'payment_due_day') THEN
    ALTER TABLE public.ipromed_contracts ADD COLUMN payment_due_day INTEGER DEFAULT 10;
  END IF;
END $$;