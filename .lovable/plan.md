

# Correcao de 3 Bugs no CRM Avivar

## Bug 1: Leads Duplicados no Kanban

**Causa raiz**: O formulario (via `receive-lead`) cria o lead no Kanban usando `account_id` como filtro de deduplicacao (linha 466). Porem, quando o lead responde no WhatsApp, o webhook (`uazapi-webhook`) verifica duplicatas usando `user_id` (linha 1018):

```text
// receive-lead (correto - usa account_id):
.eq("account_id", tokenAccountId)

// uazapi-webhook (incorreto - usa user_id):
.eq("user_id", userId)
.eq("phone", phone)
```

Como o `user_id` pode nao coincidir (ex: owner da conta vs. membro), o webhook nao encontra o lead existente e cria outro.

**Correcao**: Alterar o webhook para buscar leads existentes por `account_id` em vez de `user_id`, alinhando com a logica do `receive-lead`.

### Arquivo: `supabase/functions/uazapi-webhook/index.ts`

Linha ~1015-1022: Trocar `.eq("user_id", userId)` por `.eq("account_id", accountId)`:

```text
// ANTES:
const { data: existingKanbanLead } = await supabase
  .from("avivar_kanban_leads")
  .eq("user_id", userId)
  .eq("phone", phone)

// DEPOIS:
const { data: existingKanbanLead } = await supabase
  .from("avivar_kanban_leads")
  .eq("account_id", accountId)
  .eq("phone", phone)
```

---

## Bug 2: IA Repetindo Mensagens (3 mensagens = 3 respostas identicas)

**Causa raiz**: O debounce de 15 segundos esta funcionando, porem quando 3 mensagens chegam rapidamente, cada chamada ao webhook extende o `pending_until`, mas se as 3 mensagens chegam quase simultaneamente, a primeira cria o batch e a segunda/terceira extendem. Porem o processador da fila (`avivar-queue-processor`) pode processar o job e chamar o agente de IA **sem verificar `ai_enabled`**, e o agente pode ser chamado multiplas vezes se o debounce falhar ou o fallback direto for acionado.

O problema principal e que **nenhuma parte do pipeline verifica `ai_enabled`** antes de disparar a IA:
- `uazapi-webhook`: NAO verifica `ai_enabled` (linha 807)
- `avivar-debounce-processor`: NAO verifica `ai_enabled`
- `avivar-queue-processor`: NAO verifica `ai_enabled`

**Correcao**: Adicionar verificacao de `ai_enabled` em dois pontos:

1. **No webhook** (primeira barreira - antes de iniciar debounce): Consultar `ai_enabled` da conversa e so prosseguir se estiver ativo.
2. **No debounce processor** (segunda barreira - antes de enfileirar): Verificar `ai_enabled` novamente antes de enfileirar o job.

### Arquivo: `supabase/functions/uazapi-webhook/index.ts`

Na linha ~807, antes de iniciar o debounce, adicionar verificacao:

```text
// ANTES:
if (!msg.key.fromMe && content) {

// DEPOIS:
if (!msg.key.fromMe && content) {
  // Check if AI is enabled for this conversation
  const { data: convAiCheck } = await supabase
    .from("crm_conversations")
    .select("ai_enabled")
    .eq("id", crmConversationId)
    .single();
  
  if (convAiCheck?.ai_enabled === false) {
    console.log(`[UazAPI Webhook] AI disabled for conversation ${crmConversationId}, skipping`);
    // Skip AI trigger but continue with rest of processing
  } else {
    // ... existing debounce logic ...
  }
}
```

### Arquivo: `supabase/functions/avivar-debounce-processor/index.ts`

Antes de enfileirar o job (linha ~217), verificar `ai_enabled`:

```text
// Verificar ai_enabled antes de enfileirar
const { data: convCheck } = await supabase
  .from("crm_conversations")
  .select("ai_enabled")
  .eq("id", conversationId)
  .single();

if (convCheck?.ai_enabled === false) {
  console.log(`[Debounce] AI disabled, skipping queue`);
  return;
}
```

---

## Bug 3: Toggle de IA Nao Funciona

**Causa raiz**: O toggle no frontend esta implementado corretamente - o `ChatHeader` chama `onAIToggle` que executa `toggleAI.mutate()` para atualizar `ai_enabled` no banco. Porem, como demonstrado no Bug 2, o backend **ignora completamente** esse campo. Portanto, o toggle funciona no banco de dados mas nao tem efeito pratico.

**Correcao**: As mesmas mudancas do Bug 2 resolvem este bug. Apos adicionar as verificacoes de `ai_enabled` no webhook e no debounce processor, o toggle passara a funcionar efetivamente.

---

## Resumo de Arquivos Modificados

1. `supabase/functions/uazapi-webhook/index.ts`
   - Trocar deduplicacao de kanban lead de `user_id` para `account_id`
   - Adicionar verificacao de `ai_enabled` antes de disparar debounce/IA

2. `supabase/functions/avivar-debounce-processor/index.ts`
   - Adicionar verificacao de `ai_enabled` antes de enfileirar job

## Impacto

- Leads do formulario nao serao mais duplicados quando responderem no WhatsApp
- A IA so responde uma vez por lote de mensagens (debounce preservado)
- O toggle de IA no chat passa a funcionar de fato, desligando respostas automaticas

