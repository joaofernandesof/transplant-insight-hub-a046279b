

# Correcao: Indice Parcial Impedindo Mensagens no CRM

## Problema

A deduplicacao de mensagens usa um indice parcial (`WHERE external_id IS NOT NULL`) que o banco de dados nao aceita para resolver conflitos no upsert. Resultado: **todas as mensagens inbound do WhatsApp falham ao salvar** no CRM, incluindo a do Victor Gustavo e outros leads recentes.

## Solucao

### 1. Migracao SQL

- Remover o indice parcial existente
- Criar um constraint UNIQUE normal em `(conversation_id, external_id)`
- PostgreSQL permite multiplos NULLs em constraints unicos, entao mensagens sem `external_id` continuam funcionando

### 2. Nenhuma mudanca no codigo

O webhook ja usa `onConflict: 'conversation_id,external_id'` que vai funcionar corretamente com o constraint normal.

### 3. Re-deploy automatico

Apos a migracao, as mensagens voltarao a ser salvas imediatamente. Leads que enviaram mensagens (como Victor Gustavo) terao suas proximas mensagens capturadas normalmente.

## Detalhes Tecnicos

### Nova migracao SQL

```text
-- Remover indice parcial que causa erro 42P10
DROP INDEX IF EXISTS idx_crm_messages_external_id_unique;

-- Criar constraint unico normal (aceita multiplos NULLs)
ALTER TABLE crm_messages 
  ADD CONSTRAINT uq_crm_messages_conversation_external_id 
  UNIQUE (conversation_id, external_id);
```

### Arquivos Modificados
1. Nova migracao SQL - substituir indice parcial por constraint unico

