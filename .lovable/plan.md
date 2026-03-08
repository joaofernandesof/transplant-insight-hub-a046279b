

# Plano: Motor de Execução de Automações + Webhook na Transferência para Humano

## Problema Central

A UI de automações já existe e permite configurar gatilhos como `lead.moved_to` com ação `dispatch_webhook`. Porém **não existe motor backend** que execute essas automações. O `moveLead` apenas atualiza `column_id` no banco — nunca dispara automações.

## Solução

Criar um motor de execução de automações como edge function que é chamada sempre que um lead muda de coluna. Assim, qualquer automação configurada (incluindo webhooks) será disparada automaticamente.

### 1. Criar Edge Function `avivar-execute-automations`

Nova edge function que recebe um evento (ex: `lead.moved_to`) e:
- Busca automações ativas para aquele `kanban_id` + `column_id` + `trigger_type`
- Verifica condições (delay, execute_once_per_lead, cooldown)
- Executa as ações, incluindo `dispatch_webhook` (POST para a URL configurada com payload do lead)
- Registra execução em `avivar_automation_executions`

Payload do webhook enviado ao n8n:
```json
{
  "event": "lead.moved_to",
  "lead": { "id", "name", "phone", "email", "column_name", "kanban_name" },
  "conversation_id": "...",
  "previous_column": "Triagem",
  "new_column": "Atendimento Humano",
  "triggered_at": "2026-03-08T..."
}
```

### 2. Integrar chamada no `useKanbanLeads.ts`

Após o `moveLead` com sucesso, chamar a edge function `avivar-execute-automations` com:
- `event: "lead.moved_to"`
- `lead_id`, `kanban_id`, `from_column_id`, `to_column_id`

Fire-and-forget (não bloqueia a UI).

### 3. Integrar chamada no `transferToHuman` (edge function `avivar-ai-agent`)

Quando a IA chama `transfer_to_human`:
1. Desliga `ai_enabled` (já faz)
2. Move o lead para coluna "Atendimento Humano" (via `mover_lead_para_etapa`)
3. Chama `avivar-execute-automations` internamente para disparar as automações da coluna destino

Isso garante que tanto movimentos manuais (drag) quanto automáticos (IA) disparam webhooks.

### 4. Nenhuma mudança no banco necessária

- `avivar_automations` já suporta `trigger_type`, `column_id`, `kanban_id`
- `avivar_automation_actions` já suporta `action_type: 'dispatch_webhook'` com `action_config: { url, method }`
- `avivar_automation_executions` já existe para logging

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/avivar-execute-automations/index.ts` | **Novo** - Motor de execução |
| `src/pages/avivar/kanban/hooks/useKanbanLeads.ts` | Chamar edge function após moveLead |
| `supabase/functions/avivar-ai-agent/index.ts` | `transferToHuman` chama automações |

## Fluxo Completo

```text
Lead movido para "Atendimento Humano"
  ├── Manual (drag no kanban)
  │     └── useKanbanLeads → update column_id → call avivar-execute-automations
  └── IA (transfer_to_human)
        └── ai-agent → ai_enabled=false → mover_lead → call avivar-execute-automations
                                                              │
                                                              ▼
                                                   Busca automações ativas
                                                   trigger=lead.moved_to
                                                   column=Atendimento Humano
                                                              │
                                                              ▼
                                                   action=dispatch_webhook
                                                   POST → n8n webhook URL
                                                              │
                                                              ▼
                                                   n8n → WhatsApp grupo
```

