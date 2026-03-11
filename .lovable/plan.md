

# Fix: Implementar todas as ações de automação no backend

## Problema

O edge function `avivar-execute-automations` só implementa 3 action types: `dispatch_webhook`, `move_lead`, e `send_notification`. A UI permite criar automações com 10+ action types que **não fazem nada** quando executadas:

| Action Type | UI Config | Backend | Status |
|---|---|---|---|
| `dispatch_webhook` | ✅ | ✅ | Funciona |
| `send_notification` | ✅ | ✅ | Funciona |
| `move_lead` | — | ✅ (usa `column_id`) | Nunca chamado pela UI |
| `change_stage` | ✅ (usa `target_column_id`) | ❌ | **Quebrado** — UI envia `change_stage`, backend só trata `move_lead` |
| `send_message` | ✅ | ⚠️ Stub | **Não funciona** — retorna sucesso sem enviar |
| `create_task` | ✅ | ❌ | **Não implementado** |
| `add_tag` | ✅ | ❌ | **Não implementado** |
| `remove_tag` | ✅ | ❌ | **Não implementado** |
| `create_note` | ✅ | ❌ | **Não implementado** |
| `change_field` | ✅ | ❌ | **Não implementado** |
| `change_responsible` | ✅ | ❌ | **Não implementado** |

## Solução

Atualizar o edge function `avivar-execute-automations` para implementar todas as ações:

1. **`change_stage`** — Mover lead: `UPDATE avivar_kanban_leads SET column_id = config.target_column_id`
2. **`send_message`** — Enviar mensagem via WhatsApp usando a Evolution API (mesma lógica do agente IA — buscar `avivar_whatsapp_instances` da conta e enviar texto)
3. **`create_task`** — Inserir em `avivar_tasks` com `task_name`, `task_description`, `due_days` da config
4. **`add_tag`** — Append tag ao array `tags` do lead em `avivar_kanban_leads`
5. **`remove_tag`** — Remover tag do array `tags`
6. **`create_note`** — Inserir nota no `avivar_lead_notes` ou `crm_messages` como nota interna
7. **`change_field`** — Atualizar campo específico do lead (name/email/phone/source/notes ou custom_field em `custom_fields` JSONB)
8. **`change_responsible`** — Atualizar `responsible_id` no lead

Todas as ações farão substituição de variáveis de template (`{{nome}}`, `{{telefone}}`, etc.) antes de executar.

## Impacto

- Corrige todas as automações que usuários podem criar pela UI
- Sem alterações de frontend necessárias
- Redeploy automático do edge function

