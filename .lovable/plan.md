

# Correcao: IA Enviando Mensagens Duplicadas e Gigantes

## Problema

A IA enviou uma unica mensagem enorme com o mesmo texto repetido ~8 vezes para o lead Victor Gustavo. Isso acontece por **duas causas combinadas**:

### Causa 1: Multiplos jobs na fila para a mesma conversa

A fila `avivar_ai_queue` nao possui restricao de unicidade por `conversation_id`. Quando o debounce falha ou tem timeout, o webhook aciona o fallback direto (linha 951/959), que chama a IA enquanto o debounce processor pode ainda estar rodando. Resultado: a IA e chamada 2+ vezes para o mesmo lote de mensagens.

### Causa 2: Modelo de IA entrando em loop de repeticao

O `max_tokens: 500` permite que o modelo gere o mesmo bloco de texto repetido varias vezes dentro do budget de tokens. Nao ha deteccao de repeticao na resposta antes do envio.

## Solucao

### 1. Deduplicar jobs na fila (avivar-debounce-processor)

Antes de inserir um novo job na fila, verificar se ja existe um job `waiting` ou `active` para o mesmo `conversation_id`. Se existir, nao inserir duplicata.

### 2. Remover o fallback direto do webhook (uazapi-webhook)

O fallback que chama `avivar-ai-agent` diretamente quando o debounce falha e a principal fonte de duplicacao. Ele deve ser removido - se o debounce falhar, e melhor nao responder do que responder em duplicidade. Uma mensagem sera perdida mas nao havera spam.

### 3. Adicionar deteccao de repeticao na resposta (avivar-ai-agent)

Antes de enviar, verificar se a resposta contem blocos de texto repetidos e remover as repeticoes.

## Detalhes Tecnicos

### Arquivo 1: `supabase/functions/avivar-debounce-processor/index.ts`

Antes do insert na fila (linha ~236), adicionar verificacao:

```text
// Verificar se ja existe job pendente para esta conversa
const { data: existingJob } = await supabase
  .from("avivar_ai_queue")
  .select("id")
  .eq("conversation_id", conversationId)
  .in("status", ["waiting", "active"])
  .limit(1)
  .maybeSingle();

if (existingJob) {
  console.log(`[Debounce] Job already exists for conversation ${conversationId}, skipping`);
  return;
}
```

### Arquivo 2: `supabase/functions/uazapi-webhook/index.ts`

Remover o fallback direto para avivar-ai-agent (linhas ~897-921 e ~945-959). Se o debounce processor falhar, apenas logar o erro sem chamar a IA diretamente.

```text
// ANTES (fallback perigoso):
if (!startResp.ok) {
  await callAIDirectly();
}

// DEPOIS (sem fallback):
if (!startResp.ok) {
  console.error(`[UazAPI Webhook] Debounce processor failed, AI will not respond this time`);
  await supabase.from("crm_conversations")
    .update({ pending_batch_id: null, pending_until: null })
    .eq("id", crmConversationId);
}
```

### Arquivo 3: `supabase/functions/avivar-ai-agent/index.ts`

Adicionar deteccao de repeticao antes do envio (antes da linha ~4450):

```text
// Detectar e remover blocos repetidos na resposta
function deduplicateResponse(text: string): string {
  const lines = text.split('\n');
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { result.push(line); continue; }
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(line);
  }
  return result.join('\n');
}

finalResponse = deduplicateResponse(finalResponse);
```

Tambem adicionar um limite maximo de caracteres para a resposta final (ex: 1000 chars) como safety net:

```text
// Safety: truncar respostas absurdamente longas
if (finalResponse.length > 1000) {
  const firstParagraph = finalResponse.split('\n\n')[0];
  if (firstParagraph.length > 50) {
    finalResponse = firstParagraph;
  } else {
    finalResponse = finalResponse.substring(0, 1000);
  }
}
```

## Arquivos Modificados

1. `supabase/functions/uazapi-webhook/index.ts` - remover fallback direto para IA
2. `supabase/functions/avivar-debounce-processor/index.ts` - deduplicar jobs na fila
3. `supabase/functions/avivar-ai-agent/index.ts` - detectar/remover repeticoes na resposta + limite de tamanho

## Impacto

- Elimina completamente mensagens duplicadas e gigantes
- Se o debounce falhar, o lead simplesmente nao recebe resposta naquele momento (proximo mensagem sera processada normalmente)
- Respostas com repeticoes sao limpas antes do envio
- Safety net de 1000 caracteres previne mensagens absurdamente longas
