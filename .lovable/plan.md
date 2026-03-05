

# Criar Edge Function de Provisionamento Avivar + Criar Conta para mdertkigil@uol.com.br

## Objetivo

1. Criar uma edge function `provision-avivar-account` que automatiza a criação de novas contas Avivar com todas as configurações replicadas da conta template (Lucas).
2. Usar essa function para criar a conta do `mdertkigil@uol.com.br`.

## Dados do Template (conta Lucas - `a0000001-...002`)

Tudo já foi mapeado:
- **Agente IA (Iza)**: ai_identity, ai_objective, ai_instructions, ai_restrictions, fluxo_atendimento, tone_of_voice, services, nicho, subnicho, consultation_type, consultation_duration, payment_methods, schedule, crm, address, city, state, company_name, professional_name
- **2 Kanbans**: Comercial (8 colunas), Pós-Venda (3 colunas)
- **5 Checklists**: Vinculados à coluna "Lead de Entrada"
- **5 Reminder Rules**: D-7, 48h, 24h, 2h, 1h
- **5 Follow-up Rules**: Tentativas 1-5 (com mídia em algumas)
- **2 Knowledge Docs + 27 chunks**: FAQ + RAG
- **1 Agenda**: Medic Clinica (ativa)
- **Onboarding**: whatsapp_connected + funnels_setup + columns_setup = true

## Edge Function: `provision-avivar-account`

### Input
```json
{
  "email": "mdertkigil@uol.com.br",
  "password": "Senha123!",
  "full_name": "Nome do Usuário",
  "account_name": "Nome da Conta",
  "account_slug": "slug-unico"
}
```

### Fluxo interno (service role)
1. **Criar auth user** (email_confirm: true)
2. **Criar neohub_users** (allowed_portals: ['avivar'], profile: 'cliente_avivar')
3. **Criar avivar_accounts** + **avivar_account_members** (role: owner)
4. **Criar avivar_agents** — copiar todos os campos de config do agente template (wizard_step: 7, is_draft: false)
5. **Criar avivar_kanbans** (2) + **avivar_kanban_columns** (11) — gerar novos UUIDs, guardar mapeamento
6. **Criar avivar_column_checklists** (5) — vinculados à nova coluna "Lead de Entrada"
7. **Criar avivar_reminder_rules** (5) — mesmos templates
8. **Criar avivar_followup_rules** (5) — com `applicable_kanban_ids` e `applicable_column_ids` mapeados para novos IDs
9. **Criar avivar_knowledge_documents** (2) + **avivar_knowledge_chunks** (27) — copiar content dos chunks do template
10. **Criar avivar_agendas** (1) — "Medic Clinica" ativa
11. **Criar avivar_onboarding_progress** — com funnels_setup, columns_setup como true
12. **Criar avivar_api_tokens** + webhook_slug

### Segurança
- Validar JWT + `is_neohub_admin`
- Usar service role para operações

## Para criar a conta mdertkigil@uol.com.br

Após criar a edge function, invocar com:
- email: `mdertkigil@uol.com.br`
- password: gerada automaticamente (ex: `Neo@2026!`)
- full_name: a definir (ou usar o email como base)
- account_name/slug derivados

## Arquivos a criar/editar

1. **Criar** `supabase/functions/provision-avivar-account/index.ts` — a edge function completa
2. **Editar** `supabase/config.toml` — NÃO (auto-gerenciado). A config será detectada automaticamente.

## Observação sobre knowledge chunks

Os chunks serão copiados via query direta do template (SELECT content, chunk_index, metadata do template → INSERT com novo document_id e account_id). Isso garante que a base de conhecimento funcione imediatamente sem precisar reprocessar.

