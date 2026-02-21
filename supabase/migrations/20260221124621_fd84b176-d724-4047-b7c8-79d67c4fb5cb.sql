ALTER TABLE crm_messages ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_messages_external_id_unique 
  ON crm_messages(conversation_id, external_id) 
  WHERE external_id IS NOT NULL;