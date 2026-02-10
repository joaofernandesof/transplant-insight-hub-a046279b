

# Blindar o Agente Avivar contra vazamento de tool calls

## Problema

A IA esta escrevendo chamadas de ferramentas em formato JSON diretamente no texto enviado ao lead no WhatsApp. Dois exemplos capturados:

1. `{ "tool_calls": [{ "id": "call_1", ... "name": "preencher_checklist", "parameters": { "campos": { "data_e_hora": "2026-02-13 19:00:00", "tipo_de_consulta": "ONLINE" }}}]}`
2. `{ "tool_calls": [{ ... "name": "search_knowledge_base", "parameters": { "query": "como funciona o transplante capilar tecnica fue" }}]}`

A sanitizacao atual (linha 4044 do `avivar-ai-agent/index.ts`) so captura formatos de funcao como `tool_name(...)` e `[tool_name(...)]`, mas nao captura o formato JSON estruturado.

## Causa Raiz

O modelo as vezes "escreve" tool calls dentro do campo `content` (texto) ao inves de executa-las via API. Isso acontece quando ele tenta responder e chamar ferramentas simultaneamente. O sanitizador atual nao cobre esse padrao.

## Solucao: 3 camadas de protecao

### Camada 1 -- Regex para JSON de tool_calls (edge function)

Adicionar na sanitizacao (apos linha 4046 de `avivar-ai-agent/index.ts`):

```typescript
// Remove JSON-style tool calls: { "tool_calls": [...] }
finalResponse = finalResponse.replace(
  /\{\s*"tool_calls"\s*:\s*\[[\s\S]*?\]\s*\}/g, ""
);

// Remove individual function call objects
finalResponse = finalResponse.replace(
  /\{\s*"id"\s*:\s*"call_[^"]*"[\s\S]*?"function"\s*:\s*\{[\s\S]*?\}\s*\}/g, ""
);
```

### Camada 2 -- Regex generico por nome de ferramenta (edge function)

Como seguranca extra, remover qualquer bloco JSON que contenha nomes de ferramentas conhecidas:

```typescript
const toolNames = [
  'preencher_checklist', 'send_fluxo_media', 'send_image', 'send_video',
  'mover_lead_para_etapa', 'transfer_to_human', 'get_available_slots',
  'create_appointment', 'reschedule_appointment', 'cancel_appointment',
  'list_agendas', 'search_knowledge_base', 'list_products', 'check_slot'
];
const toolPattern = toolNames.join('|');
const jsonToolRegex = new RegExp(
  `\\{[^{}]*(?:${toolPattern})[^{}]*\\}`, 'g'
);
finalResponse = finalResponse.replace(jsonToolRegex, "");
```

### Camada 3 -- Instrucao explicita no prompt do sistema (usePromptGenerator.ts)

Adicionar dentro do bloco `<seguranca_sistema>` do prompt:

```
### NUNCA ESCREVA TOOL CALLS NO TEXTO
- JAMAIS inclua chamadas de ferramentas, JSON de tool_calls ou parametros tecnicos no texto da resposta
- Tool calls devem ser executadas APENAS via API, nunca escritas como texto para o usuario
- Se precisar usar uma ferramenta, use-a silenciosamente -- o usuario NUNCA deve ver nomes de funcoes ou parametros
```

## Arquivos a Modificar

| Arquivo | O que muda |
|---------|------------|
| `supabase/functions/avivar-ai-agent/index.ts` | 3 novos blocos de regex na sanitizacao (apos linha 4046) |
| `src/pages/avivar/config/hooks/usePromptGenerator.ts` | Instrucao anti-vazamento no bloco `<seguranca_sistema>` do prompt |

## Resultado

Mesmo que a IA cometa o erro de escrever tool calls no texto, a sanitizacao as removera antes do envio ao WhatsApp. A instrucao no prompt reduz a chance de isso acontecer em primeiro lugar. As 3 camadas funcionam de forma independente, garantindo protecao redundante.

