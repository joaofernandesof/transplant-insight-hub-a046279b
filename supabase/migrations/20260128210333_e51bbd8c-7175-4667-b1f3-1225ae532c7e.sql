-- Tabela de Contratos (separada de vendas para permitir 1 cliente : N contratos)
CREATE TABLE public.clinic_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_number TEXT NOT NULL, -- Identificador único do contrato (CHAVE da planilha)
  patient_id UUID REFERENCES public.clinic_patients(id) ON DELETE SET NULL,
  sale_date DATE NOT NULL,
  branch TEXT NOT NULL, -- FORTALEZA, SÃO PAULO, etc
  category TEXT, -- CATEGORIA A - DR HYGOR, etc
  consultant TEXT, -- QUEM CONSULTOU
  seller TEXT, -- QUEM VENDEU
  lead_source TEXT, -- ORIGEM PACIENTE
  lead_source_detail TEXT, -- OBSERVAÇÃO ORIGEM PACIENTE
  vgv NUMERIC(12,2) DEFAULT 0, -- Valor Geral de Vendas
  down_payment NUMERIC(12,2) DEFAULT 0, -- Sinal pago
  balance_due NUMERIC(12,2) DEFAULT 0, -- Saldo devedor
  swap_value NUMERIC(12,2) DEFAULT 0, -- Valor permuta
  contract_status TEXT DEFAULT 'ativo', -- FINALIZADO, DISTRATO, ATIVO, etc
  distrato_date DATE, -- Data do distrato se aplicável
  surgery_done BOOLEAN DEFAULT false, -- FEZ CIRURGIA?
  signal_term_signed BOOLEAN DEFAULT false, -- ASSINOU TERMO DE SINAL?
  surgery_date_defined BOOLEAN DEFAULT false, -- DEFINIU DATA DO TRANSPLANTE?
  monthly_payments_defined BOOLEAN DEFAULT false, -- DEFINIU PAGAMENTOS MENSAIS?
  registered_monday BOOLEAN DEFAULT false, -- VENDA NO MONDAY
  registered_conta_azul BOOLEAN DEFAULT false, -- VENDA NO CONTA AZUL
  registered_agenda BOOLEAN DEFAULT false, -- AGENDA CIRURGIAS
  registered_shosp BOOLEAN DEFAULT false, -- AGENDADO NO SHOSP
  observations TEXT, -- OBSERVAÇÕES
  source_row_hash TEXT, -- Hash da linha original para evitar duplicatas
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Serviços (1 contrato : N serviços)
CREATE TABLE public.clinic_contract_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.clinic_contracts(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- TRANSPLANTE CAPILAR, MESOTERAPIA, PRP, etc
  baldness_grade TEXT, -- GRAU DE CALVÍCIE
  unit_price NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_clinic_contracts_patient ON public.clinic_contracts(patient_id);
CREATE INDEX idx_clinic_contracts_branch ON public.clinic_contracts(branch);
CREATE INDEX idx_clinic_contracts_date ON public.clinic_contracts(sale_date);
CREATE INDEX idx_clinic_contracts_status ON public.clinic_contracts(contract_status);
CREATE INDEX idx_clinic_contracts_hash ON public.clinic_contracts(source_row_hash);
CREATE INDEX idx_contract_services_contract ON public.clinic_contract_services(contract_id);

-- RLS
ALTER TABLE public.clinic_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_contract_services ENABLE ROW LEVEL SECURITY;

-- Políticas para contracts
CREATE POLICY "Authenticated users can view contracts"
  ON public.clinic_contracts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can insert contracts"
  ON public.clinic_contracts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update contracts"
  ON public.clinic_contracts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Políticas para services
CREATE POLICY "Authenticated users can view services"
  ON public.clinic_contract_services FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can insert services"
  ON public.clinic_contract_services FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_clinic_contracts_updated_at
  BEFORE UPDATE ON public.clinic_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para log de importações
CREATE TABLE public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_type TEXT NOT NULL, -- 'contracts', 'patients', etc
  file_name TEXT,
  total_rows INTEGER DEFAULT 0,
  inserted_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB,
  imported_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view import logs"
  ON public.import_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can insert import logs"
  ON public.import_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);