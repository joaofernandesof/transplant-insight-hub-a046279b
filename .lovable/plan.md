

## Diagnóstico: Imagem duplicada do passo 3

### O que aconteceu

Analisei a conversa completa do lead Lucas Araújo (conversa `70932678-85f2-4dc9-a43d-74d49cdc2c7b`):

| Hora | Quem | Conteúdo | Passo |
|------|------|----------|-------|
| 19:04 | Lead | "oi" | → Passo 1 |
| 19:05 | Lead | "Lucas" | → Passo 2 |
| 19:06 | Lead | "Cabelo" | → Passo 3 |
| **19:07** | **IA** | **📎 imagem (antes/depois)** | **✅ correto - mídia do passo 3** |
| 19:09 | Lead | "quero sim" / "como funciona?" | → Passo 4 |
| 19:12 | Lead | "sim, qual endereço?" | → Passo 4/5 |
| **19:13** | **IA** | **📎 mesma imagem (antes/depois)** | **❌ DUPLICADA** |
| 19:13 | IA | "Avenida Rui Barbosa, 1540, Aldeota" | endereço |
| 19:13 | IA | "A agenda do Dr. Lucas Araújo..." | horários |

A IA **reenviou a imagem do passo 3 (qualificação)** quando o lead pediu o endereço. Não foi porque não tinha foto do estacionamento — **foi um reenvio duplicado** da mesma mídia que já tinha sido enviada 6 minutos antes.

### Causa raiz

O sistema atual **não rastreia quais mídias de passo já foram enviadas** nessa conversa. A IA:
1. Vê no prompt que o passo "qualificacao" tem mídia anexada
2. Decide chamar `send_fluxo_media(step_id="qualificacao")` novamente
3. O guard no backend só impede **2+ envios na mesma resposta**, mas não entre respostas diferentes

Não existe nenhum mecanismo que diga à IA: "essa mídia já foi enviada nessa conversa, não envie de novo."

### Solução proposta

**1. Rastrear mídias já enviadas no histórico da conversa**

No `buildHybridSystemPrompt`, ao montar as instruções de fluxo, analisar o histórico de mensagens e identificar quais `media_url` do fluxo já foram enviadas. Adicionar uma regra explícita no prompt:

```
## ⛔ MÍDIAS JÁ ENVIADAS NESTA CONVERSA (NÃO REENVIAR):
- Passo "qualificacao": imagem já enviada às 19:07
```

**2. Adicionar guard no backend (sendFluxoMedia)**

Na função `sendFluxoMedia`, antes de enviar, verificar no `crm_messages` se já existe uma mensagem outbound com a mesma `media_url` nessa conversa. Se sim, retornar `{ success: false, message: "Mídia já enviada anteriormente nesta conversa." }`.

**3. Reforçar instrução no prompt**

Adicionar regra explícita nas instruções de fluxo:
```
REGRA ANTI-DUPLICAÇÃO: NUNCA reenvie a mídia de um passo que já foi executado.
Analise o histórico — se a mídia já aparece nas mensagens anteriores, NÃO chame send_fluxo_media novamente para esse passo.
```

### Arquivos a modificar

- `supabase/functions/avivar-ai-agent/index.ts`:
  - **`sendFluxoMedia`**: adicionar verificação de duplicação antes de enviar (checar `crm_messages` por `media_url` existente na conversa)
  - **`buildHybridSystemPrompt`** (ou onde o histórico é processado): incluir lista de mídias já enviadas e regra anti-duplicação no prompt

### Impacto

- Dupla proteção: guard no backend (impede envio técnico) + instrução no prompt (impede a IA de tentar)
- Sem breaking changes — apenas adiciona verificação antes de algo que já existe

