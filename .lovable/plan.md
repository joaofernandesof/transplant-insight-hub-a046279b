

## Diagnóstico: Por que a IA não respondeu ao lead "Werikes Botelho"

### Causa Raiz Identificada

A flag **`ai_enabled` está `false`** na conversa deste lead (`d01002cb-5dbd-4359-887b-4b3942777ff8`).

**Cronologia dos eventos:**
1. **24/02 às 13:50** — IA respondeu normalmente (último job completado na fila)
2. **Em algum momento após 13:50** — A flag `ai_enabled` foi desativada (provavelmente por envio de mensagem manual ou human takeover)
3. **24/02 às 14:47** — Lead enviou "Como é questão do pós cirurgia?"
4. **Nenhum job foi criado na fila** — O webhook/debounce verificou `ai_enabled = false` e ignorou a mensagem

Isso é o comportamento esperado do sistema: conforme a regra de "Human Takeover", quando um atendente humano envia uma mensagem manual ou desativa o toggle, a IA para de responder automaticamente.

### Solução

O toggle da IA (ícone de robô no chat) precisa ser **reativado manualmente** para que a IA volte a processar mensagens deste lead. No inbox, basta clicar no ícone do bot (que está aparecendo como "BotOff") para reativar.

Não há bug — o sistema está funcionando conforme projetado para evitar conflito entre atendente humano e IA.

