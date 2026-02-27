

## Bug: Mensagens do lead durante processamento da IA sao ignoradas

### Causa Raiz Confirmada (logs)

O debounce-processor usa `last_ai_processed_at` como cutoff para filtrar mensagens novas. Este timestamp marca quando a IA **TERMINOU** de processar, nao quando **COMECOU**. Mensagens do lead que chegam DURANTE o processamento da IA ficam ANTES do cutoff e sao excluidas:

```text
Timeline:
T1: Lead envia "tem algum pdf?"      ← mensagem que se perde
T2: IA envia resposta 1 (outbound)
T3: IA envia resposta 2 (outbound)
T4: IA termina → last_ai_processed_at = T4
T5: Debounce acorda, cutoff = T4
    → Lead msg (T1) < cutoff (T4) → EXCLUIDA
    → "No new messages" → IA nao responde
```

Log real: `Cutoff: lastOutbound=16:39:54, lastAiProcessed=16:40:02, using=16:40:02` + `No new messages to process`

### Solucao

**1. Migracao SQL — Adicionar `ai_processing_started_at`**

Nova coluna em `crm_conversations` para rastrear quando a IA COMECOU a processar (nao quando terminou).

**2. `avivar-ai-agent/index.ts` — Setar timestamp de inicio**

Quando a IA inicia processamento, gravar o timestamp de inicio junto com o lock:
```typescript
.update({ 
  ai_processing: true, 
  ai_processing_started_at: new Date().toISOString() 
})
```

**3. `avivar-debounce-processor/index.ts` — Usar inicio como cutoff**

Trocar a logica de cutoff: buscar `ai_processing_started_at` e usar como referencia. Mensagens inbound com `sent_at > ai_processing_started_at` sao mensagens novas que a IA nao viu:

```typescript
// ANTES (bugado):
const cutoffTime = lastAiProcessedAt > lastOutboundTime 
  ? lastAiProcessedAt : lastOutboundTime;

// DEPOIS (corrigido):
// Use ai_processing_started_at como cutoff quando disponivel
// Isso captura mensagens que chegaram DURANTE o processamento da IA
const cutoffTime = aiProcessingStartedAt 
  && aiProcessingStartedAt < lastAiProcessedAt
  ? aiProcessingStartedAt 
  : lastOutboundTime;
```

### Resultado

- Lead envia mensagem durante processamento da IA → mensagem e capturada apos IA terminar → novo ciclo de resposta e disparado
- Nenhuma mensagem e perdida independente do timing
- Afeta TODOS os agentes do CRM Avivar (correcao global)

### Arquivos alterados
- Nova migracao SQL (coluna `ai_processing_started_at`)
- `supabase/functions/avivar-ai-agent/index.ts` — setar timestamp de inicio
- `supabase/functions/avivar-debounce-processor/index.ts` — corrigir logica de cutoff

