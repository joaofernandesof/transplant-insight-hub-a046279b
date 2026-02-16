

## Correção da Causa Raiz: Loop de Ferramentas Bloqueadas + Fallback Natural

### O Problema

Quando a IA chama uma ferramenta que é bloqueada pelo sistema (ex: `send_fluxo_media` duplicada), a chamada é descartada silenciosamente. A IA não recebe feedback, então repete a mesma chamada por 5 rodadas até cair no fallback genérico "Desculpe, não consegui processar sua mensagem."

### 3 Correções no arquivo `supabase/functions/avivar-ai-agent/index.ts`

---

#### 1. Feedback sintético para ferramentas bloqueadas (causa raiz)

Após a filtragem de tool calls (linha ~4155), coletar as chamadas bloqueadas e gerar resultados sintéticos informando a IA que a ação já foi executada. Isso faz a IA parar de repetir e gerar texto.

```typescript
// Coletar bloqueadas
const blockedToolCalls = currentToolCalls.filter(tc => !filteredToolCalls.includes(tc));

// Gerar feedback para cada bloqueada
blockedToolCalls.forEach(tc => {
  toolResults.push({
    role: "tool",
    name: tc.name,
    content: `[SISTEMA] A ferramenta ${tc.name} já foi executada nesta resposta. Prossiga com sua resposta de texto ao cliente.`
  });
});
```

#### 2. Quebrar o loop quando TODAS as chamadas são bloqueadas

Se nenhuma ferramenta passou pelo filtro, sair do loop imediatamente (linha ~4157):

```typescript
if (filteredToolCalls.length === 0 && currentToolCalls.length > 0) {
  console.log(`[AI Agent] All tool calls blocked. Breaking loop.`);
  // Ainda injeta os feedbacks sintéticos para a próxima chamada
  break;
}
```

#### 3. Mensagem de fallback natural (linha 4283)

Trocar a mensagem genérica por algo que peça ao lead para reenviar:

```
"Desculpa, o sistema ficou um pouco instável agora e não consegui carregar sua última mensagem. Pode enviar novamente, por favor? 🙏"
```

---

### Resultado esperado

- A IA recebe feedback quando uma ferramenta é bloqueada e gera texto em vez de repetir
- Loops de 5 rodadas vazias são eliminados
- Se tudo falhar, o lead recebe uma mensagem natural pedindo para reenviar
