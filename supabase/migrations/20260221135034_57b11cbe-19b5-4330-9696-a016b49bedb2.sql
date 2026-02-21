-- Remover indice parcial que causa erro 42P10
DROP INDEX IF EXISTS idx_crm_messages_external_id_unique;

-- Criar constraint unico normal (aceita multiplos NULLs)
ALTER TABLE crm_messages 
  ADD CONSTRAINT uq_crm_messages_conversation_external_id 
  UNIQUE (conversation_id, external_id);