

# Plano: Corrigir disparo de webhook nas automações

## Causa Raiz

A declaração da função `transferToHuman` está **quebrada** no arquivo `avivar-ai-agent/index.ts`. Na linha ~2043, falta `async function transferToHuman(` — só tem os parâmetros soltos. Isso impede o deploy da edge function, então a versão rodando é antiga e **não contém** a chamada `triggerAutomationsFromEdge`.

Código atual (quebrado):
```
}   // fim de triggerAutomationsFromEdge

  supabase: AnySupabaseClient,    // <-- falta "async function transferToHuman("
  conversationId: string,
  reason: string
): Promise<string> {
```

Além disso, mesmo que compilasse, `transferToHuman` apenas desliga `ai_enabled` — ela não move o lead. O lead foi movido porque a IA chamou `mover_lead_para_etapa` como tool separada, mas como o deploy falhou, `triggerAutomationsFromEdge` não existe no código em produção.

## Correções

### 1. Corrigir declaração da função `transferToHuman`

Adicionar `async function transferToHuman(` na linha correta para que o arquivo compile.

### 2. Adicionar disparo de automações dentro de `transferToHuman`

Quando `transfer_to_human` é chamada, buscar o lead pela `conversationId`, identificar o `kanban_id` e `column_id`, e chamar `triggerAutomationsFromEdge` com evento `lead.transferred_to_human` (além do `lead.moved_to` que já é disparado por `moverLeadParaEtapa`).

### 3. Garantir await no fetch de automações

O `triggerAutomationsFromEdge` faz fetch fire-and-forget, mas em Deno edge functions o runtime pode encerrar antes do fetch completar. Adicionar `await` no fetch para garantir que a chamada é feita antes da response retornar.

## Arquivo modificado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/avivar-ai-agent/index.ts` | Corrigir declaração `transferToHuman`, adicionar `await` no fetch, adicionar trigger de automações no `transferToHuman` |

