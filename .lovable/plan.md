

## Diagnóstico

O problema **não é mais no fallback determinístico** (que já foi corrigido). Agora o problema é que a **IA está chamando `send_fluxo_media`** diretamente via tool call para o passo 4 (vídeos da região), mesmo estando no passo 3 da conversa.

**Fluxo da Karine:**
- Passo 1 (index 0): Saudação
- Passo 2 (index 1): Identificação
- Passo 3 (index 2): Descoberta do interesse ← conversa está aqui (2 msgs do user)
- Passo 4 (index 3): Apresentação da região (tem vídeos) ← IA pula pra cá

A IA tem acesso a todos os passos no prompt e decide enviar a mídia do passo 4 antes da hora. Não existe nenhuma validação no `send_fluxo_media` que impeça isso.

## Correção

**Arquivo: `supabase/functions/avivar-ai-agent/index.ts`**

### 1. Adicionar guarda no tool call `send_fluxo_media` (linha ~3265)

Antes de executar `sendFluxoMedia`, validar se o `step_id` corresponde ao passo atual ou anterior (baseado na contagem de user messages). Se a IA tentar enviar mídia de um passo futuro, bloquear e retornar mensagem informando que a mídia não deve ser enviada ainda.

```typescript
case "send_fluxo_media": {
  // GUARD: Block premature media sends
  const requestedStepId = toolArgs.step_id as string;
  const fluxoData = routedAgent.fluxo_atendimento as Record<string, unknown> | null;
  if (fluxoData) {
    const passos = (fluxoData.passosCronologicos || []) as Array<{ id?: string }>;
    const requestedIndex = passos.findIndex(p => p.id === requestedStepId);
    const userMsgCount = conversationHistory.filter(m => m.role === "user").length;
    const maxAllowedIndex = userMsgCount; // step index can't exceed user message count
    
    if (requestedIndex > maxAllowedIndex) {
      console.log(`[AI Agent] ⚠️ BLOCKED send_fluxo_media for step "${requestedStepId}" (index ${requestedIndex}) — current step is ${maxAllowedIndex}`);
      return `Mídia do passo "${requestedStepId}" não deve ser enviada agora. Estamos no passo ${maxAllowedIndex}.`;
    }
  }
  // ... existing sendFluxoMedia call
}
```

### 2. Passar `conversationHistory` para o tool executor

O `executeTool` precisa receber `conversationHistory` como parâmetro para poder contar as mensagens do user. Verificar a assinatura da função e adicionar o parâmetro.

