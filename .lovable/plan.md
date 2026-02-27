

## Envio determinístico de mídia do fluxo (fallback automático)

### Problema
A IA é instruída via prompt a chamar `send_fluxo_media` quando um passo tem mídia anexada, mas o modelo nem sempre faz a tool call. Isso faz com que PDFs, vídeos e áudios configurados no fluxo de atendimento não sejam enviados ao lead.

### Causa Raiz
Dependência 100% do modelo de IA para lembrar de chamar a ferramenta. Em conversas longas ou com múltiplas mensagens do lead, o modelo foca no texto e ignora a tool call de mídia.

### Solução: Fallback determinístico pós-processamento

**Arquivo: `supabase/functions/avivar-ai-agent/index.ts`**

Após o loop de tool calls (seção 7) e antes de enviar a resposta via WhatsApp (seção 9), adicionar lógica determinística:

1. **Detectar o passo atual**: Analisar o `finalResponse` e o histórico da conversa para inferir em qual passo do fluxo a IA está respondendo. Usar heurística: contar quantas respostas outbound já existem para mapear ao passo correspondente na ordem cronológica.

2. **Verificar se o passo tem mídia**: Consultar `fluxo_atendimento` do agente e verificar se o passo atual tem `media` ou `mediaVariations`.

3. **Verificar se `send_fluxo_media` já foi chamado**: Checar se `executedTools` contém `"send_fluxo_media"`. Se não, enviar a mídia automaticamente usando a mesma função `sendFluxoMedia()` já existente.

```text
Fluxo:
IA processa → tool calls (pode ou não chamar send_fluxo_media) → cleanup
                                                                    ↓
                                              [NOVO] Se passo atual tem mídia
                                              E send_fluxo_media NÃO foi chamado
                                              → sendFluxoMedia() automático
                                                                    ↓
                                              Envia texto via WhatsApp
```

### Detalhes da implementação

- Inferir passo atual contando mensagens outbound no histórico (ex: 4 outbound cycles = passo 5)
- Alternativa mais robusta: comparar `passosCronologicos[i].descricao/titulo` com o conteúdo do `finalResponse` usando keywords
- Abordagem escolhida: **contar ciclos de interação** (pares inbound→outbound) no histórico para determinar o passo. É simples e funciona com o modelo "um passo por vez"
- Usar `executedTools.has("send_fluxo_media")` como guard — se a IA já chamou, não duplicar
- Adicionar log: `[AI Agent] FALLBACK: Auto-sending fluxo media for step X (AI didn't call tool)`

### Arquivos alterados
- `supabase/functions/avivar-ai-agent/index.ts` — adicionar bloco de fallback entre seção 8 (cleanup) e seção 9 (envio WhatsApp)

