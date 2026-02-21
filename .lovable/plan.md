

# Correcao: IA Nao Responde - BOOT_ERROR no Debounce Processor

## Problema

Leads estao chegando e as mensagens sao salvas no CRM, mas a IA nao responde. O toggle de IA esta ativo nas conversas.

## Causa Raiz

A Edge Function `avivar-debounce-processor` esta com **BOOT_ERROR** e nao consegue iniciar. O erro e:

```
Uncaught SyntaxError: Identifier 'supabaseUrl' has already been declared
at avivar-debounce-processor/index.ts:253
```

Dentro da funcao `processDebounceBatch`, ha duas declaracoes `const supabaseUrl` no mesmo escopo:
- **Linha 53**: `const supabaseUrl = Deno.env.get("SUPABASE_URL")!;` (inicio do bloco try)
- **Linha 312**: `const supabaseUrl = Deno.env.get("SUPABASE_URL")!;` (apos o while loop, mesmo try)

Da mesma forma, `const supabaseServiceKey` tambem e declarado duas vezes (linhas 54 e 313) e `const supabase` (linhas 55 e 314).

Isso impede a funcao de compilar, e consequentemente:
1. O webhook recebe a mensagem e salva no banco
2. Tenta chamar o debounce-processor, que retorna 503
3. O batch e limpo (pending_batch_id = null)
4. Nenhum job e enfileirado na avivar_ai_queue
5. O queue-processor nao encontra jobs para processar
6. A IA nunca responde

## Correcao

Remover as declaracoes duplicadas nas linhas 312-314, reutilizando as variaveis ja declaradas no inicio do bloco try (linhas 53-55).

### Arquivo: `supabase/functions/avivar-debounce-processor/index.ts`

Substituir as linhas 311-314:

```text
// ANTES (linhas 311-314):
console.log(`[Debounce] Batch ${batchId} exceeded max iterations, giving up`);
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// DEPOIS:
console.log(`[Debounce] Batch ${batchId} exceeded max iterations, giving up`);
// Reutiliza supabaseUrl, supabaseServiceKey e supabase ja declarados na linha 53-55
```

As variaveis `supabaseUrl`, `supabaseServiceKey` e `supabase` ja estao acessiveis nesse ponto do codigo pois foram declaradas no mesmo escopo `try` (linhas 53-55).

## Impacto

- O debounce-processor voltara a funcionar imediatamente apos o deploy
- Mensagens de leads serao enfileiradas na `avivar_ai_queue`
- O queue-processor processara os jobs e a IA voltara a responder
- Nenhuma mudanca no banco de dados necessaria

