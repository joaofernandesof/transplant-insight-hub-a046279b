

## Bug: Mensagem do lead perdida quando responde durante envio de mensagens split da IA

### Causa Raiz

O agente IA divide respostas longas em partes (ex: 3 mensagens com 800ms de delay entre cada). Quando o lead responde ENTRE essas partes, ocorre a seguinte sequencia:

```text
14:12:25 → [outbound] "Prazer em falar com você, Lucas!"
14:12:34 → [outbound] "Aqui na Clínica Medic..." (parte 2 da resposta)
14:12:38 → [inbound]  "sobrancelha"  ← LEAD RESPONDE AQUI
14:12:39 → [outbound] "Qual região..."  (parte 3 da resposta - ainda da IA anterior)
```

Quando o proximo debounce roda, ele calcula:
- `lastOutboundTime = 14:12:39` (ultima mensagem outbound)
- `newMessages = inbound WHERE sent_at > lastOutboundTime`
- "sobrancelha" (14:12:38) < 14:12:39 → **FILTRADA/PERDIDA**

A mensagem do lead e silenciosamente ignorada e nunca processada pela IA.

### Solucao

Duas mudancas coordenadas:

**1. `avivar-ai-agent/index.ts` — Adicionar lock de processamento**

No inicio do handler principal, setar uma flag `ai_processing = true` na conversa. No final (success ou error), setar `ai_processing = false`. Isso sinaliza que a IA esta ativamente processando/enviando mensagens.

**2. `avivar-debounce-processor/index.ts` — Detectar mensagens intercaladas**

Mudar a logica de `newMessages` para considerar mensagens inbound que chegaram DURANTE o processamento da IA (entre a primeira e ultima outbound de um bloco). Em vez de usar apenas `lastOutboundTime`, usar o timestamp de quando o ULTIMO job da AI foi criado/completado.

Alternativa mais simples e robusta: em vez de calcular `newMessages` por `lastOutboundTime`, usar um campo `last_processed_at` na conversa que e atualizado pelo debounce quando processa mensagens. Assim:
- `newMessages = inbound WHERE sent_at > last_processed_at`
- Quando debounce processa, atualiza `last_processed_at = NOW()`

**3. `uazapi-webhook/index.ts` — Respeitar lock de processamento**

Quando o webhook recebe uma mensagem inbound e detecta que `ai_processing = true`, SEMPRE criar/estender um batch de debounce (nunca skipar). O debounce vai esperar o AI agent terminar antes de processar.

### Detalhes Tecnicos

**Migracao SQL:**
```sql
ALTER TABLE crm_conversations 
ADD COLUMN IF NOT EXISTS ai_processing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_ai_processed_at timestamptz;
```

**`avivar-ai-agent/index.ts`:**
- No inicio: `UPDATE crm_conversations SET ai_processing = true WHERE id = conversationId`
- No finally: `UPDATE crm_conversations SET ai_processing = false, last_ai_processed_at = NOW() WHERE id = conversationId`

**`avivar-debounce-processor/index.ts` (linhas 86-117):**
- Adicionar check: se `ai_processing = true`, aguardar (sleep + retry) ate ficar false
- Mudar `newMessages` de `sent_at > lastOutboundTime` para `sent_at > last_ai_processed_at` (com fallback para `lastOutboundTime` quando `last_ai_processed_at` e null)

**`uazapi-webhook/index.ts` (linhas 838-930):**
- Ao verificar debounce, tambem checar `ai_processing`. Se true, SEMPRE criar batch de debounce (para que a mensagem seja enfileirada e processada depois que a IA terminar)

### Arquivos alterados
- Migracao SQL (nova coluna `ai_processing` e `last_ai_processed_at`)
- `supabase/functions/avivar-ai-agent/index.ts` — setar/limpar flag de processamento
- `supabase/functions/avivar-debounce-processor/index.ts` — aguardar AI finalizar + usar `last_ai_processed_at`
- `supabase/functions/uazapi-webhook/index.ts` — respeitar lock ao criar debounce

