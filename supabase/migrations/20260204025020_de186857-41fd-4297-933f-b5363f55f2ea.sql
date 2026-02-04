-- Tabela de associação para contratos com múltiplos clientes (relação N:N)
CREATE TABLE IF NOT EXISTS ipromed_contract_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES ipromed_contracts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES ipromed_legal_clients(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'contratante', -- contratante, co-contratante, beneficiário
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(contract_id, client_id)
);

-- Enable RLS
ALTER TABLE ipromed_contract_clients ENABLE ROW LEVEL SECURITY;

-- RLS policies para ipromed_contract_clients
CREATE POLICY "Allow authenticated read on ipromed_contract_clients"
  ON ipromed_contract_clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on ipromed_contract_clients"
  ON ipromed_contract_clients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on ipromed_contract_clients"
  ON ipromed_contract_clients FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete on ipromed_contract_clients"
  ON ipromed_contract_clients FOR DELETE TO authenticated USING (true);

-- Add index for performance
CREATE INDEX idx_ipromed_contract_clients_contract ON ipromed_contract_clients(contract_id);
CREATE INDEX idx_ipromed_contract_clients_client ON ipromed_contract_clients(client_id);