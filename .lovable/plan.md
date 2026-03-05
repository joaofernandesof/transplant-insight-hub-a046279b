

# Modo Chatbot com Botões Interativos para o Avivar

## Recomendação de UX

Recomendo **integrar dentro da pagina "Configurar IA" existente**, e não criar uma nova pagina no sidebar. Motivos:

- O modo de atendimento (chatbot vs humanizado vs hibrido) e uma configuracao **do agente de IA**, faz sentido estar junto
- Evita poluir o sidebar com mais um item
- O usuario ja sabe que "Configurar IA" e onde define o comportamento do agente
- Pode ser uma nova aba/secao dentro do wizard ou uma opcao no inicio da configuracao

## Os 3 Modos de Atendimento

1. **IA Humanizada** (atual) — responde em texto livre seguindo o fluxo de atendimento
2. **Chatbot com Botoes** — usa a API `/send/menu` da UaZapi para enviar botoes/listas interativas, guiando o lead por um caminho pre-definido
3. **Hibrido** (recomendado como default) — inicia com botoes interativos, mas quando o lead envia texto livre com duvidas, a IA responde de forma humanizada

## Alteracoes Necessarias

### 1. Novo campo no AgentConfig (`types.ts`)

Adicionar tipo e campo:
```typescript
type AttendanceMode = 'humanized' | 'chatbot' | 'hybrid';

// No AgentConfig:
attendanceMode: AttendanceMode; // default: 'hybrid'
chatbotFlows: ChatbotFlow[]; // arvore de botoes/menus configurados
```

Estrutura do `ChatbotFlow`:
```typescript
interface ChatbotFlowNode {
  id: string;
  type: 'button' | 'list';
  text: string; // mensagem principal
  footerText?: string;
  listButton?: string; // para type: 'list'
  choices: ChatbotChoice[];
}

interface ChatbotChoice {
  label: string;
  id: string;
  description?: string; // para listas
  action: 'next_node' | 'transfer_human' | 'switch_to_ai' | 'send_message';
  nextNodeId?: string; // qual no seguir
  messageContent?: string; // mensagem a enviar se action = send_message
}
```

### 2. Nova secao na pagina "Configurar IA"

Dentro do wizard (simplificado e completo), adicionar **antes** do passo de "Fluxo de Atendimento":
- Seletor de modo: 3 cards (Humanizado / Chatbot / Hibrido)
- Se modo = chatbot ou hibrido: mostrar editor visual de fluxo de botoes (arvore de decisao)
- Se modo = humanizado: manter fluxo atual sem alteracao

### 3. Editor Visual de Fluxo de Chatbot

Um editor simples para montar a arvore de menus:
- Mensagem de boas-vindas com botoes
- Cada botao leva a outro no (submenu ou acao final)
- Acoes possiveis: ir para proximo menu, transferir para humano, ativar IA humanizada, enviar mensagem fixa
- Preview em tempo real de como ficara no WhatsApp

### 4. Backend: Edge Function `avivar-ai-agent`

Alterar a logica principal para:
- Verificar `attendanceMode` do agente
- Se `chatbot`: usar `/send/menu` da UaZapi para enviar botoes; processar respostas do lead mapeando para o proximo no da arvore
- Se `hybrid`: iniciar com chatbot, mas ao detectar mensagem de texto livre (que nao corresponde a nenhum botao), ativar modo IA humanizada para aquela conversa
- Se `humanized`: manter comportamento atual

Integrar com endpoint UaZapi `/send/menu`:
```json
{
  "number": "5511999999999",
  "type": "button",
  "text": "Ola! Como posso ajudar?",
  "choices": [
    "Agendar Consulta|agendar",
    "Ver Servicos|servicos",
    "Falar com Atendente|humano"
  ],
  "footerText": "Escolha uma opcao"
}
```

### 5. Tabela de estado de conversa

Novo campo na tabela `crm_conversations` ou `crm_leads`:
```sql
ALTER TABLE crm_conversations ADD COLUMN current_chatbot_node_id text;
ALTER TABLE crm_conversations ADD COLUMN attendance_mode_override text; -- para hybrid quando muda para AI
```

### 6. Migration SQL

- Adicionar `attendance_mode` na tabela `avivar_agents` (default: 'humanized' para manter retrocompatibilidade)
- Adicionar `chatbot_flows` (jsonb) na tabela `avivar_agents`
- Adicionar campos de estado na `crm_conversations`

### 7. Atualizar template de provisionamento

Atualizar a edge function `provision-avivar-account` para incluir `attendance_mode: 'humanized'` como default para novas contas.

## Ordem de Implementacao

1. Migration SQL (novos campos)
2. Tipos TypeScript (`types.ts`)
3. Componente seletor de modo (3 cards)
4. Editor visual de fluxo chatbot (arvore de botoes)
5. Integrar no wizard simplificado e completo
6. Backend: logica de chatbot no `avivar-ai-agent` usando `/send/menu`
7. Logica hibrida: detectar texto livre e alternar para IA

## Escopo Inicial Sugerido

Para a primeira versao, sugiro comecar com:
- Seletor de modo (3 cards) na config
- Suporte a botoes simples (1 nivel, sem arvore profunda)
- Modo hibrido basico
- Depois iterar para arvores mais complexas e editor visual sofisticado

