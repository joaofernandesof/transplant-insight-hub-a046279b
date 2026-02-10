
# Corrigir vazamento de tool calls em formato JSON para o WhatsApp

## Problema Identificado

A IA está "escrevendo" chamadas de ferramentas diretamente no texto da resposta em **formato JSON bruto**, como:

```
{ "tool_calls": [{ "id": "call_1", "type": "function", "function": { "name": "preencher_checklist", "parameters": { ... }}}]}
```

A sanitizacao atual (linha 4044 do `avivar-ai-agent/index.ts`) so captura formatos como:
- `preencher_checklist(campos=...)` -- estilo funcao
- `[preencher_checklist(...)]` -- estilo colchetes

Mas **nao captura** o formato JSON que a IA esta gerando. Isso faz com que o lead receba dados tecnicos no WhatsApp.

## Causa Raiz

Quando o modelo retorna `content` (texto) **e** tenta fazer tool calls simultaneamente, ele as vezes "escreve" as tool calls dentro do proprio texto ao inves de usa-las via API corretamente. O sanitizador nao cobre esse padrao JSON.

## Solucao

Adicionar **3 camadas de protecao** na sanitizacao da resposta:

### 1. Regex para JSON de tool_calls (novo)
Capturar blocos JSON contendo `"tool_calls"`, `"function"`, `"name"` -- o padrao exato que vazou:

```typescript
// Remove JSON-style tool calls: { "tool_calls": [...] }
finalResponse = finalResponse.replace(/\{\s*"tool_calls"\s*:\s*\[[\s\S]*?\]\s*\}/g, "");

// Remove individual function call objects: { "id": "call_...", "type": "function", ... }
finalResponse = finalResponse.replace(/\{\s*"id"\s*:\s*"call_[^"]*"[\s\S]*?"function"\s*:\s*\{[\s\S]*?\}\s*\}/g, "");
```

### 2. Regex generico para qualquer JSON com chaves de ferramentas (novo)
Como medida de seguranca extra, capturar qualquer bloco JSON que contenha nomes de ferramentas conhecidas:

```typescript
// Remove any JSON block containing known tool names
const toolNames = ['preencher_checklist', 'send_fluxo_media', 'send_image', 'send_video', 
  'mover_lead_para_etapa', 'transfer_to_human', 'get_available_slots', 'create_appointment',
  'reschedule_appointment', 'cancel_appointment', 'list_agendas', 'search_knowledge_base', 
  'list_products', 'check_slot'];
const toolNamesPattern = toolNames.join('|');
const jsonToolRegex = new RegExp(`\\{[^{}]*(?:${toolNamesPattern})[^{}]*\\}`, 'g');
finalResponse = finalResponse.replace(jsonToolRegex, "");
```

### 3. Instrucao explicita no prompt do sistema (reforco)
Adicionar uma regra no bloco `<seguranca_sistema>` do prompt gerado em `usePromptGenerator.ts`:

```
### NUNCA ESCREVA TOOL CALLS NO TEXTO
- JAMAIS inclua chamadas de ferramentas, JSON de tool_calls ou parametros tecnicos no texto da resposta
- Tool calls devem ser executadas APENAS via API, nunca escritas como texto para o usuario
- Se precisar usar uma ferramenta, use-a silenciosamente - o usuario NUNCA deve ver nomes de funcoes ou parametros
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/avivar-ai-agent/index.ts` | Adicionar 3 novos regex de sanitizacao (linhas ~4044) |
| `src/pages/avivar/config/hooks/usePromptGenerator.ts` | Adicionar instrucao anti-vazamento no prompt |

## Resultado Esperado

Mesmo que a IA cometa o erro de escrever tool calls no texto, a sanitizacao as removera antes do envio ao WhatsApp. A instrucao no prompt reduz a chance de isso acontecer em primeiro lugar.
