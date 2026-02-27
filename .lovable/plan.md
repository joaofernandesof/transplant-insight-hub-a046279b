

## ✅ RESOLVIDO: Mensagem do lead perdida quando responde durante envio de mensagens split da IA

### Causa Raiz
Race condition: AI divide respostas em partes com delay. Lead responde entre partes → mensagem fica com timestamp < lastOutboundTime → filtrada/perdida pelo debounce-processor.

### Solução Implementada

1. **Migração SQL**: Adicionadas colunas `ai_processing` (bool) e `last_ai_processed_at` (timestamptz) em `crm_conversations`

2. **`avivar-ai-agent/index.ts`**: 
   - Seta `ai_processing = true` no início do processamento
   - Seta `ai_processing = false` + `last_ai_processed_at = NOW()` no final (success e error)

3. **`avivar-debounce-processor/index.ts`**:
   - Aguarda `ai_processing = false` antes de processar (max 60s com retry de 3s)
   - Usa `last_ai_processed_at` como cutoff em vez de `lastOutboundTime` (com fallback)
   - Garante que mensagens intercaladas nunca são perdidas

4. **`uazapi-webhook/index.ts`**:
   - Verifica `ai_processing` ao checar debounce
   - Sempre cria/estende batch de debounce quando AI está processando
