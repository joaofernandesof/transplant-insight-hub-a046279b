
# Plano: Proteger conversas e leads com isolamento multi-tenant

## Problema Critico

As tabelas que armazenam as conversas do chat (IA e humano) estao **completamente abertas**:

- `crm_conversations`: policy SELECT usa `qual = true` (qualquer usuario ve tudo)
- `crm_messages`: policy SELECT usa `qual = true` (qualquer usuario le todas as mensagens)
- `leads`: sem coluna `account_id`, sem isolamento por conta

Isso significa que **qualquer cliente logado pode ver as conversas, mensagens e leads de todos os outros clientes**.

## O que sera feito

### Etapa 1 - Adicionar `account_id` nas 3 tabelas

Adicionar coluna `account_id UUID REFERENCES avivar_accounts(id)` em:
- `leads`
- `crm_conversations`
- `crm_messages`

### Etapa 2 - Migrar dados existentes

Preencher `account_id` nos registros existentes:
- Para `leads`: resolver via `avivar_kanban_leads.phone` -> `account_id`, ou via `crm_conversations.lead_id`
- Para `crm_conversations`: resolver via lead vinculado
- Para `crm_messages`: resolver via conversa vinculada

### Etapa 3 - Tornar NOT NULL + indices

Apos migracao, aplicar constraint NOT NULL e criar indices de performance.

### Etapa 4 - Substituir RLS policies

Dropar as policies abertas e aplicar o modelo padrao:

```text
Super Admin: acesso total (is_avivar_super_admin)
Membros da conta: somente seus dados (account_id = get_user_avivar_account_id)
```

### Etapa 5 - Atualizar frontend

Modificar o hook `useCrmConversations` e demais componentes de chat para incluir `account_id` nos inserts.

## Secao Tecnica

### Tabelas afetadas

- `leads` (tabela compartilhada com CPG - precisa manter compatibilidade)
- `crm_conversations` (usada pelo chat Avivar)
- `crm_messages` (mensagens do chat)

### RLS final aplicada

```text
-- crm_conversations
DROP POLICY "Users can view all conversations"
DROP POLICY "Users can insert conversations"
DROP POLICY "Users can update conversations"
DROP POLICY "Admins can delete conversations"

CREATE POLICY "sa_all" FOR ALL USING (is_avivar_super_admin(auth.uid()))
CREATE POLICY "acct_s" FOR SELECT USING (account_id = get_user_avivar_account_id(auth.uid()))
CREATE POLICY "acct_i" FOR INSERT WITH CHECK (account_id = get_user_avivar_account_id(auth.uid()))
CREATE POLICY "acct_u" FOR UPDATE USING (account_id = get_user_avivar_account_id(auth.uid()))
CREATE POLICY "acct_d" FOR DELETE USING (account_id = get_user_avivar_account_id(auth.uid()))

-- crm_messages (mesma estrutura)
-- leads (precisa manter policies do CPG + adicionar isolamento Avivar)
```

### Nota sobre tabela `leads`

A tabela `leads` e compartilhada com o portal CPG (clinicas). As policies existentes do CPG (claimed_by, staff_role) precisam ser mantidas em paralelo com as novas policies de isolamento Avivar. A solucao e:
- Adicionar `account_id` nullable (nem todo lead e do Avivar)
- Criar policy: se `account_id IS NOT NULL`, aplicar isolamento; caso contrario, manter regras CPG existentes

### Hooks do frontend a atualizar

- `useCrmConversations.ts` - adicionar account_id nos inserts de conversas
- `ConversationList.tsx` - nenhuma mudanca necessaria (RLS cuida do filtro)
- Edge functions `avivar-send-message`, `uazapi-webhook` - garantir account_id ao criar mensagens/conversas

### Ordem de execucao

1. Adicionar colunas nullable (nao quebra nada)
2. Migrar dados existentes
3. Tornar NOT NULL em crm_conversations e crm_messages (leads fica nullable por ser compartilhada)
4. Dropar policies antigas e criar novas
5. Atualizar frontend e edge functions
