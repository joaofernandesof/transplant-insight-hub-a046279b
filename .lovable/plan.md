

## Plan: Create User for ricardo.chahini@veltimobiliaria.com.br as Clone of Karine Mendes

### Overview
Create a new user account with identical CRM configuration (agent, knowledge base, kanbans, automations) as the existing user Karine Mendes (karinnemendessg@gmail.com).

### Data Gathered from Karine's Account
- **Profile**: operador, allowed_portals: [avivar]
- **Account**: "Karine Mendes" (starter plan, nicho: imobiliario)
- **Agent**: "Karinne" for company "Vivart" — full fluxo with 8 steps + extras, knowledge base, media files, schedule, tone cordial, attendance humanized
- **Kanbans**: Comercial + Pós-Venda (with default stages via RPC)
- **Automations**: 2 automations (webhook on human transfer + create task on column move)

### Steps

1. **Create auth user** via Edge Function `admin-create-user` (email: ricardo.chahini@veltimobiliaria.com.br, password to be generated, full_name: Ricardo Chahini, allowed_portals: [avivar], profiles: [operador])

2. **Create avivar_account** for the new user (name: "Ricardo Chahini", plan: starter, allowed_nichos: [imobiliario])

3. **Create avivar_account_members** record linking new auth user to account as owner

4. **Create avivar_kanbans** via RPC `create_default_avivar_kanbans` for the new user

5. **Clone avivar_agent** — insert a new agent row with all identical fields from Karine's agent (ai_identity, ai_objective, ai_instructions, ai_restrictions, fluxo_atendimento, knowledge_files, tone_of_voice, schedule, payment_methods, consultation_type, etc.) but with the new user_id and new account_id

6. **Clone avivar_knowledge_documents** — copy knowledge document records pointing to the new user/account/agent

7. **Clone avivar_automations + actions** — recreate the 2 automations with their actions, mapped to the new account and kanban column IDs

All operations will be done via SQL insert statements using the database insert tool, after the auth user is created via the existing edge function.

### Password
Will generate: `Velt@2026!Ri`

### Technical Notes
- The media URLs in the fluxo (videos, audio, PDFs) reference public storage buckets and will work as-is for the new user
- Kanban column IDs will differ, so automations referencing specific columns will need to be mapped to the new kanban's columns after creation
- The agent's `target_kanbans` is empty in Karine's config, so no mapping needed there

