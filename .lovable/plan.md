

## Diagnóstico

O bug está na linha 5148 do `supabase/functions/avivar-ai-agent/index.ts`. O fallback determinístico conta **mensagens outbound (assistant)** para determinar o passo atual:

```typescript
const outboundCount = conversationHistory.filter(m => m.role === "assistant").length;
const currentStepIndex = outboundCount;
```

**Problema**: O passo 1 (saudação) gera 3-4 mensagens outbound separadas no WhatsApp (cada bolha é uma mensagem). Quando o lead responde "LUCAS", o histórico já tem ~3-4 mensagens assistant, então `currentStepIndex = 3 ou 4`, que no array 0-indexado aponta para o passo 4 ou 5 — exatamente onde está o áudio.

## Correção

**Arquivo**: `supabase/functions/avivar-ai-agent/index.ts` (linhas 5145-5150)

Substituir a contagem de mensagens `assistant` por contagem de mensagens `user` (inbound). Cada resposta do lead avança um passo, então:
- 0 respostas do lead → passo 1 (saudação, index 0)  
- 1 resposta do lead → passo 2 (index 1)
- 2 respostas → passo 3 (index 2)
- etc.

Lógica nova:
```typescript
const userMessageCount = conversationHistory.filter(m => m.role === "user").length;
const currentStepIndex = userMessageCount; // 0 user msgs = step 0 (greeting), 1 user msg = step 1, etc.
```

Isso é confiável porque o número de mensagens inbound (do lead) não é afetado por quebras de texto em múltiplas bolhas.

