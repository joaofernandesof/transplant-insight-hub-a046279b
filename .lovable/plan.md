
# Plano: APIs Funcionais, Estatisticas no CRM e Gerenciamento de Webhooks

## Escopo Total

Sao 3 entregas independentes para o lancamento do Avivar CRM:

---

## 1. APIs Funcionais + Tokens de Acesso

### Situacao Atual
- A pagina `/api-docs` documenta endpoints para **Sales**, **Surgeries**, **Weekly Metrics**, alem de **Leads**, **Auth** e **Automacoes**
- Apenas `/receive-lead` e `/notify-lead-arrival` existem como edge functions reais
- **Sales**, **Surgeries**, **Weekly Metrics** NAO existem como edge functions -- sao apenas documentacao
- O `/receive-lead` funciona mas nao tem sistema de API tokens para autenticacao externa

### O que sera feito

**1a. Sistema de API Tokens (Tabela + CRUD)**
- Criar tabela `avivar_api_tokens` com: `id`, `account_id`, `token_hash`, `name`, `permissions[]`, `is_active`, `last_used_at`, `expires_at`, `created_by`
- Gerar tokens seguros (prefixo `avr_` + 32 chars aleatorios)
- Hash do token armazenado (nunca em texto plano)
- CRUD completo na UI dentro de `/avivar/settings` (nova aba "API e Webhooks")

**1b. Validacao de Token nas Edge Functions**
- Atualizar `/receive-lead` para aceitar autenticacao via header `X-API-Key: avr_xxxxx` (alem do Bearer token)
- Criar funcao auxiliar `validateApiToken` reutilizavel

**1c. Edge Functions faltantes (priorizadas para o lancamento)**
- Avaliar se `/sales`, `/surgeries` e `/weekly-metrics` sao necessarios para o lancamento do Avivar CRM ou se sao especificos do NeoHub
- Prioridade: garantir que `/receive-lead` funcione perfeitamente com tokens de API

### Detalhes Tecnicos

```sql
-- Tabela de API Tokens
CREATE TABLE avivar_api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  token_prefix VARCHAR(10) NOT NULL,  -- primeiros chars para identificacao
  token_hash TEXT NOT NULL,            -- SHA-256 do token completo
  permissions TEXT[] DEFAULT '{"receive_lead"}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: isolamento por account_id
```

---

## 2. Secao de Estatisticas no Sidebar do Lead

### Situacao Atual
- O sidebar direito do inbox (`LeadDetailsSidebar.tsx`) mostra: Contato, Funil, Checklist
- O badge "3/3" ja existe ao lado do titulo "Checklist"
- Nao existe secao de estatisticas

### O que sera feito

Adicionar uma nova secao **Collapsible** chamada "Estatisticas" logo abaixo do Checklist, contendo:

**Estatisticas do Lead Individual:**
- Total de mensagens trocadas
- Tempo medio de resposta da equipe
- Dias desde criacao do lead
- Posicao no funil (etapa atual)
- Ultima interacao (data/hora)

**Estatisticas Gerais do CRM (resumo):**
- Total de leads ativos na conta
- Taxa de conversao (leads convertidos / total)
- Leads por etapa do funil (mini grafico ou contadores)
- Leads atribuidos ao usuario logado

### Detalhes Tecnicos

- Novo componente: `src/components/crm/chat/LeadStatisticsSection.tsx`
- Hook: `src/hooks/useLeadStatistics.ts` - busca dados de `crm_messages`, `crm_conversations`, `leads`
- Queries otimizadas com `.count()` e agregacoes no Supabase
- Integrado no `LeadDetailsSidebar.tsx` como `<Collapsible>` apos o Checklist

---

## 3. Gerenciamento de Webhooks no Avivar CRM

### Situacao Atual
- Nao existe nenhum sistema de webhooks configuravel
- O sistema recebe leads via `/receive-lead` mas nao dispara eventos para fora

### O que sera feito

**3a. Tabela de Webhooks**
```sql
CREATE TABLE avivar_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,          -- ex: ['lead.created', 'lead.updated', 'message.received']
  secret TEXT,                     -- para assinatura HMAC
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**3b. Tabela de Log de Webhooks**
```sql
CREATE TABLE avivar_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES avivar_webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**3c. Edge Function de Disparo (`avivar-webhook-dispatch`)**
- Recebe evento + payload
- Busca webhooks ativos para o `account_id` que escutam aquele evento
- Dispara POST para cada URL com payload JSON + assinatura HMAC no header `X-Webhook-Signature`
- Registra resultado na tabela de logs
- Retry automatico em caso de falha (ate 3 tentativas)

**3d. UI de Gerenciamento**
- Nova aba "Webhooks" dentro de `/avivar/settings` (junto com "API Tokens")
- CRUD: criar webhook (nome, URL, eventos), ativar/desativar, excluir
- Visualizar logs de disparo (ultimas 50 entregas com status)
- Botao "Testar" para enviar payload de teste

**3e. Eventos Disponiveis**
- `lead.created` - Novo lead criado
- `lead.updated` - Lead atualizado (etapa, dados)
- `message.received` - Mensagem recebida de lead
- `message.sent` - Mensagem enviada (IA ou atendente)
- `appointment.created` - Agendamento criado
- `appointment.updated` - Agendamento atualizado

**3f. Integracao nos Fluxos Existentes**
- No webhook do WhatsApp (`uazapi-webhook`): disparar `message.received` e `lead.created`
- Na criacao de agendamentos: disparar `appointment.created`
- Disparos sao asincronos (nao bloqueiam o fluxo principal)

---

## Ordem de Implementacao

1. **Tabelas e migracoes** (API tokens, webhooks, webhook logs)
2. **Sistema de API Tokens** (geracao, validacao, UI)
3. **Secao de Estatisticas** (hook + componente + integracao no sidebar)
4. **Webhooks** (edge function de disparo + UI de CRUD + integracao nos fluxos)
5. **Atualizacao da pagina ApiDocs** (refletir os novos endpoints e tokens)

---

## Arquivos Novos

- `src/hooks/useAvivarApiTokens.ts` - CRUD de tokens
- `src/hooks/useAvivarWebhooks.ts` - CRUD de webhooks
- `src/hooks/useLeadStatistics.ts` - Estatisticas do lead/CRM
- `src/components/crm/chat/LeadStatisticsSection.tsx` - UI de stats
- `src/pages/avivar/settings/ApiTokensTab.tsx` - Aba de tokens
- `src/pages/avivar/settings/WebhooksTab.tsx` - Aba de webhooks
- `supabase/functions/avivar-webhook-dispatch/index.ts` - Disparo de webhooks

## Arquivos Modificados

- `src/pages/avivar/AvivarSettings.tsx` - Adicionar abas API/Webhooks
- `src/components/crm/chat/LeadDetailsSidebar.tsx` - Adicionar secao Estatisticas
- `supabase/functions/receive-lead/index.ts` - Validacao de API token
- `supabase/functions/uazapi-webhook/index.ts` - Disparar eventos de webhook
