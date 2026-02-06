

# Plano: Fase 1 - Arquitetura Multi-Tenant do CRM Avivar

## O que sera feito

Criar a base de isolamento total de dados entre clientes do Avivar. Cada cliente tera sua "Conta" (account), e todos os dados (leads, conversas, agentes, etc.) passam a pertencer a essa conta. O `adm@neofolic.com.br` (Super Admin) tera acesso global.

## Dados atuais (volume baixo - momento ideal)

| Tabela | Registros | Owners distintos |
|--------|-----------|-----------------|
| avivar_kanbans | 8 | 4 usuarios |
| avivar_kanban_leads | 3 | - |
| avivar_contacts | 4 | 1 |
| avivar_conversas | 1 | - |
| avivar_mensagens | 6 | - |
| avivar_team_members | 2 | 1 |
| avivar_agents | 0 | - |
| avivar_products | 0 | - |

## Etapas

### Etapa 1 - Criar estrutura base no banco

1. Criar tipo `avivar_account_role` (owner, admin, coordenador, atendente)
2. Criar tabela `avivar_accounts` (id, name, slug, owner_user_id, plan, is_active, timestamps)
3. Criar tabela `avivar_account_members` (account_id, user_id, role, is_active) com constraint unico (account_id, user_id)
4. Habilitar RLS em ambas as tabelas

### Etapa 2 - Criar funcoes de seguranca

1. `is_avivar_super_admin(_user_id)` - Retorna true SOMENTE para `adm@neofolic.com.br` (UUID: `00294ac4-0194-47bc-95ef-6efb83c316f7`)
2. `get_user_avivar_account_id(_user_id)` - Retorna o account_id do usuario logado
3. `get_user_avivar_account_role(_user_id)` - Retorna o role do usuario na conta (para controle de permissoes no frontend)

### Etapa 3 - Adicionar `account_id` em 28 tabelas

Adicionar coluna `account_id UUID REFERENCES avivar_accounts(id)` (nullable inicialmente) em todas as tabelas avivar:

avivar_agendas, avivar_agents, avivar_appointments, avivar_column_checklists, avivar_contacts, avivar_conversas, avivar_followup_executions, avivar_followup_metrics, avivar_followup_rules, avivar_followup_templates, avivar_kanban_columns, avivar_kanban_leads, avivar_kanbans, avivar_knowledge_chunks, avivar_knowledge_documents, avivar_mensagens, avivar_onboarding_progress, avivar_patient_journeys, avivar_products, avivar_schedule_blocks, avivar_schedule_config, avivar_schedule_hours, avivar_team_members, avivar_tutorials, avivar_uazapi_instances, avivar_whatsapp_contacts, avivar_whatsapp_messages, avivar_whatsapp_sessions

### Etapa 4 - Migrar dados existentes

Para os 4 user_ids com dados no Avivar:
1. Criar 1 `avivar_accounts` para cada um automaticamente
2. Inserir o dono como membro com role `owner` em `avivar_account_members`
3. Preencher `account_id` em todos os registros existentes baseado no `user_id` do dono
4. Migrar membros existentes de `avivar_team_members` para `avivar_account_members`
5. Tornar `account_id` NOT NULL em todas as tabelas
6. Criar indice em `account_id` em cada tabela para performance

### Etapa 5 - Trocar todas as RLS policies

Dropar as ~27 policies existentes e substituir por modelo padronizado:

```text
Para cada tabela Avivar:
  - Super Admin: acesso total (is_avivar_super_admin)
  - Membros: acesso somente a sua conta (account_id = get_user_avivar_account_id)
  - INSERT: definir account_id automaticamente via funcao
```

### Etapa 6 - Atualizar frontend

1. Criar hook `useAvivarAccount()` que retorna `accountId` e `role` do usuario logado
2. Atualizar hooks existentes para usar `account_id` em vez de `user_id`:
   - useKanbanBoards, useKanbanLeads, useAvivarContacts
   - useCrmConversations, useAvivarTasks, useDefaultAvivarKanbans
   - useAvivarAgendas, useAvivarSidebarCounts, useConversationTasks
   - useCrmTasks, useUazApiIntegration
   - AvivarAgentsPage, OnboardingStepFunnels
3. Atualizar pagina de Equipe para usar `avivar_account_members`

### Etapa 7 - Atualizar Edge Functions

Adaptar funcoes backend que referenciam `user_id` Avivar:
- `uazapi-webhook` - resolver account_id a partir da instancia/sessao
- `n8n-whatsapp-webhook` - aceitar account_id no payload
- `avivar-send-message` - resolver account_id do remetente
- Funcoes RPC como `create_default_avivar_kanbans` e `get_or_create_avivar_conversa`

## Secao Tecnica

### Modelo de dados final

```text
avivar_accounts
  id (PK)
  name
  slug (UNIQUE)
  owner_user_id (auth.users)
  plan
  is_active
  
avivar_account_members
  id (PK)
  account_id (FK -> avivar_accounts)
  user_id (FK -> auth.users)
  role (enum: owner/admin/coordenador/atendente)
  is_active
  UNIQUE(account_id, user_id)
```

### Padrao RLS aplicado em todas as 28 tabelas

```text
POLICY "super_admin_all" FOR ALL
  USING (is_avivar_super_admin(auth.uid()))

POLICY "account_isolation" FOR SELECT/UPDATE/DELETE
  USING (account_id = get_user_avivar_account_id(auth.uid()))

POLICY "account_insert" FOR INSERT
  WITH CHECK (account_id = get_user_avivar_account_id(auth.uid()))
```

### Migracao de dados (4 contas)

```text
user_id 00294ac4... (adm@neofolic.com.br) -> Conta "ByNeofolic" (Super Admin + Owner)
user_id 860ae553... (lucasaraujo) -> Conta "Lucas Araujo"
user_id 1b58da47... (ti@neofolic.com.br) -> Conta "TI Neo Folic"
user_id 8d4b2850... (sem neohub_users) -> Conta "Conta Legada" (usuario orfao)
```

### Ordem de execucao segura

1. Criar tabelas novas + funcoes (nao quebra nada)
2. Adicionar colunas nullable (nao quebra nada)
3. Migrar dados existentes (preencher account_id)
4. Tornar NOT NULL + indices
5. Trocar RLS policies (momento critico - fazer tudo junto)
6. Atualizar frontend (deploy junto com RLS)
7. Atualizar edge functions

