


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

## ✅ RESOLVIDO: IA não encontra horários disponíveis

### Causa Raiz
1. RPC `get_available_slots_flexible` não fazia lookup por `account_id` (agente IA passa account_id como p_user_id)
2. Sem fallback quando não há config de horários — retornava vazio em vez de gerar slots padrão

### Solução Implementada
- Adicionado lookup por `account_id` via `avivar_account_members` na RPC
- Adicionado fallback de slots padrão (08:00-18:00, seg-sáb) quando não há config
- Fallback respeita appointments existentes para evitar conflitos

## ✅ RESOLVIDO: Função RPC duplicada causando PGRST203

### Causa Raiz
Migração anterior criou nova versão de `get_available_slots_flexible` com parâmetros em ordem diferente sem dropar a antiga. PostgREST não conseguia escolher entre as duas → erro PGRST203 → zero slots.

### Solução Implementada
- Dropadas AMBAS overloads e recriada versão única com lookup por account_id + fallback padrão
- `resolveAgenda` agora extrai nome base antes do lookup (ex: "Medic Clinica - Fortaleza (Lucas)" → "Medic Clinica")
- `list_agendas` retorna formato separado por pipes para evitar confusão de nomes
