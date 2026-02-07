

# Auditoria e Limpeza de Tabelas Legadas do Avivar CRM

## Contexto

Antes da migração multi-tenant, o CRM Avivar usava tabelas com isolamento baseado em `user_id`. Agora, o isolamento correto usa `account_id` via `avivar_accounts` e `avivar_account_members`. A migração deixou tabelas legadas que duplicam funcionalidades e causam bugs (dual-write, conflitos de função, etc).

## Resultado da Auditoria

### Tabelas para REMOVER (legadas, substituidas ou vazias)

| Tabela | Motivo | Dados | Substituta |
|--------|--------|-------|------------|
| `avivar_whatsapp_messages` | Nunca usada, 0 registros | 0 | `crm_messages` |
| `avivar_whatsapp_contacts` | Legacy, 3 registros irrelevantes | 3 | `avivar_contacts` |
| `avivar_whatsapp_sessions` | Legacy, substituida por `avivar_uazapi_instances` | 2 | `avivar_uazapi_instances` |
| `avivar_followup_metrics` | Vazia, nunca populada | 0 | Pode ser recriada se necessario |
| `avivar_team_members` | Legacy, substituida por `avivar_account_members` | 2 | `avivar_account_members` |

### Tabelas para REMOVER com migracão de código (dual-write ativo)

| Tabela | Motivo | Dados | Substituta |
|--------|--------|-------|------------|
| `avivar_conversas` | Legacy chat, dual-write com `crm_conversations` | 1 | `crm_conversations` |
| `avivar_mensagens` | Legacy messages, dual-write com `crm_messages` | 33 | `crm_messages` |

### Edge Functions para REMOVER

| Funcao | Motivo |
|--------|--------|
| `n8n-whatsapp-webhook` | Legacy, substituida por `uazapi-webhook` |
| `avivar-whatsapp` | Legacy, substituida por `avivar-uazapi` |

### Tabelas que PERMANECEM (multi-tenant corretas)

Todas as 23 tabelas restantes ja possuem `account_id` e fazem parte da arquitetura multi-tenant:

`avivar_accounts`, `avivar_account_members`, `avivar_agents`, `avivar_agendas`, `avivar_appointments`, `avivar_contacts`, `avivar_column_checklists`, `avivar_kanban_columns`, `avivar_kanban_leads`, `avivar_kanbans`, `avivar_knowledge_chunks`, `avivar_knowledge_documents`, `avivar_onboarding_progress`, `avivar_patient_journeys`, `avivar_products`, `avivar_schedule_blocks`, `avivar_schedule_config`, `avivar_schedule_hours`, `avivar_tutorials`, `avivar_uazapi_instances`, `avivar_followup_executions`, `avivar_followup_rules`, `avivar_followup_templates`

Tabelas CRM que permanecem: `crm_conversations`, `crm_messages`, `leads`, `lead_tasks`

---

## Plano de Execução (em 3 fases)

### Fase 1 - Eliminar dual-write no código

Remover toda escrita para `avivar_conversas` e `avivar_mensagens` de:

1. **`supabase/functions/uazapi-webhook/index.ts`** - Remove o bloco que chama `get_or_create_avivar_conversa` e insere em `avivar_mensagens` (linhas ~646-680). Manter apenas a escrita em `crm_conversations`/`crm_messages`.

2. **`supabase/functions/avivar-send-message/index.ts`** - Remove o bloco "Also save to avivar_mensagens for legacy support" (linhas ~673-695).

3. **`src/pages/avivar/kanban/hooks/useKanbanLeads.ts`** - Migrar a query de "última mensagem" de `avivar_conversas`/`avivar_mensagens` para `crm_conversations`/`crm_messages`.

### Fase 2 - Migrar referências a `avivar_team_members` para `avivar_account_members`

Atualizar os seguintes arquivos para usar `avivar_account_members` no lugar de `avivar_team_members`:

- `src/components/crm/chat/TaskBanner.tsx`
- `src/components/crm/chat/ResponsibleSelector.tsx`
- `src/components/crm/chat/TaskInlineInput.tsx`
- `src/hooks/useCrmConversations.ts`
- `src/pages/avivar/AvivarTeamPage.tsx`
- `supabase/functions/avivar-send-message/index.ts`

Migrar `avivar_whatsapp_sessions` em:
- `src/hooks/useWhatsAppIntegration.ts` - Migrar para usar `avivar_uazapi_instances`

### Fase 3 - Dropar tabelas, triggers, funcões e edge functions

Migration SQL:

```sql
-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_conversa_on_message ON avivar_mensagens;
DROP TRIGGER IF EXISTS update_avivar_conversas_updated_at ON avivar_conversas;
DROP TRIGGER IF EXISTS update_avivar_mensagens_updated_at ON avivar_mensagens;
DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at ON avivar_whatsapp_sessions;
DROP TRIGGER IF EXISTS update_whatsapp_contacts_updated_at ON avivar_whatsapp_contacts;
DROP TRIGGER IF EXISTS update_avivar_team_members_timestamp ON avivar_team_members;
DROP TRIGGER IF EXISTS update_followup_metrics_updated_at ON avivar_followup_metrics;

-- Drop functions
DROP FUNCTION IF EXISTS get_or_create_avivar_conversa(text, text, text, text);
DROP FUNCTION IF EXISTS mark_avivar_messages_as_read(uuid);
DROP FUNCTION IF EXISTS update_avivar_conversa_on_message();
DROP FUNCTION IF EXISTS update_avivar_team_members_updated_at();

-- Drop tables (order matters for FK dependencies)
DROP TABLE IF EXISTS avivar_mensagens CASCADE;
DROP TABLE IF EXISTS avivar_conversas CASCADE;
DROP TABLE IF EXISTS avivar_whatsapp_messages CASCADE;
DROP TABLE IF EXISTS avivar_whatsapp_contacts CASCADE;
DROP TABLE IF EXISTS avivar_whatsapp_sessions CASCADE;
DROP TABLE IF EXISTS avivar_followup_metrics CASCADE;
DROP TABLE IF EXISTS avivar_team_members CASCADE;
```

Deletar edge functions:
- `n8n-whatsapp-webhook`
- `avivar-whatsapp`

---

## Resumo do Impacto

- **7 tabelas removidas** (todas legadas ou vazias)
- **2 edge functions removidas** (substituidas)
- **~10 arquivos de código atualizados** (remover dual-write e migrar referências)
- **3 funcões DB e 7 triggers removidos**
- **0 dados importantes perdidos** (dados úteis ja estão nas tabelas novas `crm_*` e `avivar_account_members`)

