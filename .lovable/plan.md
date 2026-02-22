

## Painel de Monitoramento de Custos e Execucoes - NeoHub

### Objetivo
Criar um sistema completo de logging de execucoes de Edge Functions + painel visual no Portal Administrativo, acessivel apenas por `adm@neofolic.com.br`, com visibilidade global sobre custos de IA e Cloud de todas as contas do ecossistema NeoHub (incluindo Avivar multi-tenant).

---

### 1. Tabela de Logs no Banco de Dados

Criar tabela `edge_function_logs`:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador unico |
| function_name | text (NOT NULL) | Nome da Edge Function |
| execution_time_ms | integer | Tempo de execucao em ms |
| status | text | "success" ou "error" |
| tokens_input | integer | Tokens de entrada (IA) |
| tokens_output | integer | Tokens de saida (IA) |
| model_used | text | Modelo de IA utilizado |
| estimated_cost_usd | numeric(10,6) | Custo estimado em USD |
| account_id | uuid | Tenant Avivar (quando aplicavel) |
| user_id | uuid | Usuario que disparou |
| metadata | jsonb | Dados extras (conversation_id, job_id, etc.) |
| error_message | text | Mensagem de erro (quando falha) |
| created_at | timestamptz | Timestamp da execucao |

**Indices:** `function_name`, `created_at`, `account_id`, `user_id`

**RLS:** Apenas o Super Admin (`adm@neofolic.com.br`) pode ler os logs. Insercao via service_role (Edge Functions).

---

### 2. Snippet de Logging para Edge Functions

Como Edge Functions Deno nao suportam imports compartilhados entre funcoes facilmente, sera adicionado um snippet inline em cada funcao instrumentada. O snippet:

- Captura `startTime` no inicio da funcao
- No final (sucesso ou erro), faz INSERT na tabela `edge_function_logs` usando `supabaseServiceClient`
- Inclui calculo automatico de custo estimado baseado no modelo usado
- Nao bloqueia a resposta (fire-and-forget com `.then()`)

**Tabela de custos por modelo (embutida no snippet):**

```text
google/gemini-3-flash-preview:  $0.10/1M input, $0.40/1M output
google/gemini-2.5-flash:        $0.15/1M input, $0.60/1M output
google/gemini-2.5-flash-lite:   $0.02/1M input, $0.05/1M output
google/gemini-2.5-pro:          $1.25/1M input, $5.00/1M output
openai/whisper-1:               $0.006/min (estimado por tamanho do audio)
```

---

### 3. Funcoes a Instrumentar (Fase 1 - Criticas)

Estas funcoes serao instrumentadas primeiro por terem maior volume e/ou custo:

1. **avivar-ai-agent** - Principal consumidor de IA
2. **avivar-queue-processor** - Orquestrador central
3. **avivar-debounce-processor** - Gateway de mensagens
4. **avivar-send-message** - Envio WhatsApp
5. **avivar-transcribe-audio** - OpenAI Whisper
6. **avivar-process-followups** - Follow-ups automaticos
7. **code-assistant-chat** - Assistente de codigo
8. **jon-jobs-chat** - Chat JON JOBS

### Funcoes a Instrumentar (Fase 2 - Restantes)

9. avivar-process-reminders
10. avivar-generate-faq
11. avivar-analyze-call
12. face-search
13. hair-scan-analysis
14. ai-legal-document
15. legal-ai-insights
16. analyze-survey-insights
17. analyze-day2-survey-insights
18. analyze-daily-metrics
19. uazapi-webhook
20. avivar-webhook-dispatch

---

### 4. Pagina de Monitoramento (Portal Admin)

Nova pagina em `/admin-portal/monitoring` dentro do layout Admin existente.

**Restricao de acesso:** Verificacao por email `adm@neofolic.com.br` (hardcoded no componente + RLS no banco).

**Layout da pagina:**

#### KPIs (topo, 4 cards):
- Total de Execucoes (hoje / 7d / 30d)
- Custo Estimado Total (USD)
- Funcao Mais Chamada
- Taxa de Erro Global

#### Secao "Custo por Usuario/Conta" (tabela):
- Nome da conta Avivar
- Execucoes totais
- Tokens consumidos
- Custo estimado
- Ordenavel por custo

#### Secao "Custo por Funcao" (tabela):
- Nome da funcao
- Execucoes
- Tempo medio (ms)
- Tokens totais (in/out)
- Custo estimado
- Taxa de erro (%)

#### Secao "Custo do NeoHub" (cards):
- Total gasto pelo proprio NeoHub (funcoes sem account_id)
- Breakdown: code-assistant, jon-jobs, face-search, hair-scan, legal, etc.

#### Grafico de linha:
- Evolucao diaria de custo (ultimos 30 dias)
- Linhas separadas: NeoHub vs Avivar accounts

#### Filtros:
- Periodo: Hoje / 7 dias / 30 dias / Custom
- Funcao especifica
- Conta especifica

---

### 5. Integracoes

#### Admin Sidebar
Adicionar item "Monitoramento" com icone `Activity` no menu do sistema do `AdminSidebar.tsx`, apontando para `/admin-portal/monitoring`.

#### App.tsx
Adicionar rota:
```text
/admin-portal/monitoring -> AdminLayout > NeoHubMonitoring
```

---

### 6. Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/admin/NeoHubMonitoring.tsx` | Pagina principal do painel |
| `src/hooks/useEdgeFunctionLogs.ts` | Hook React Query para buscar logs |

### 7. Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/admin/components/AdminSidebar.tsx` | Adicionar item "Monitoramento" |
| `src/App.tsx` | Adicionar rota e lazy import |
| 20 Edge Functions | Adicionar snippet de logging |

### 8. Ordem de Implementacao

1. Criar tabela `edge_function_logs` + RLS + indices (migracao)
2. Instrumentar as 8 Edge Functions criticas (Fase 1)
3. Criar hook `useEdgeFunctionLogs.ts`
4. Criar pagina `NeoHubMonitoring.tsx`
5. Modificar `AdminSidebar.tsx` + `App.tsx`
6. Instrumentar funcoes restantes (Fase 2)

