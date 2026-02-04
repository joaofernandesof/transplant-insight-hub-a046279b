-- Adicionar coluna client_number à tabela de clientes
ALTER TABLE ipromed_legal_clients ADD COLUMN client_number VARCHAR(20) UNIQUE;

-- Criar índice para a coluna
CREATE INDEX idx_ipromed_legal_clients_number ON ipromed_legal_clients(client_number);