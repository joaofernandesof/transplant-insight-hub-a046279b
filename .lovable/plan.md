

# Menu de Opções com Ramificação por Passo no Fluxo de Atendimento

## Conceito

Adicionar a cada passo do fluxo a capacidade de definir um **menu de opções numeradas** que o lead pode escolher. Cada opção tem uma **ação** associada: ir para outro passo, mover no kanban, transferir para humano, ou enviar mensagem específica.

## Modelo de Dados

Adicionar ao `FluxoStep` um campo opcional `menuOptions`:

```typescript
export interface FluxoMenuAction {
  type: 'go_to_step' | 'move_kanban' | 'transfer_human' | 'send_message';
  // go_to_step
  targetStepId?: string;
  // move_kanban
  targetColumnSlug?: string;
  targetResponsibleId?: string;
  // send_message
  message?: string;
}

export interface FluxoMenuOption {
  id: string;
  label: string;        // "Agendar consulta"
  action: FluxoMenuAction;
}

export interface FluxoStep {
  // ... campos existentes
  menuOptions?: FluxoMenuOption[]; // NOVO
}
```

Sem migration SQL — `fluxo_atendimento` é JSONB.

## Alterações

### 1. `src/pages/avivar/config/types.ts`
- Adicionar interfaces `FluxoMenuAction` e `FluxoMenuOption`
- Adicionar `menuOptions?: FluxoMenuOption[]` ao `FluxoStep`

### 2. `src/pages/avivar/config/components/steps/simple/StepFluxoSimple.tsx`
- Dentro de cada passo expandido, adicionar seção "Menu de Opções" com botão para ativar
- UI para cada opção: campo de texto (label) + dropdown de ação (Ir para passo X, Mover no Kanban, Transferir, Enviar mensagem)
- Para "Ir para passo": dropdown listando os outros passos do fluxo pelo título
- Para "Mover no Kanban": dropdown de colunas (buscar do banco)
- Para "Transferir": apenas checkbox (usa tool existente `transfer_to_human`)
- Para "Enviar mensagem": textarea com a mensagem
- Botão (+) para adicionar opções, (x) para remover

### 3. `supabase/functions/avivar-ai-agent/index.ts` — `buildFluxoInstructions()`
- Para cada passo que tenha `menuOptions`, gerar no prompt:
```
### PASSO 2: SAUDAÇÃO E MENU
Apresente as opções ao lead:
1. Agendar consulta → Execute o PASSO 4 (Oferecer Datas)
2. Falar com atendente → Use transfer_to_human()
3. Endereço da clínica → Responda: "Rua X, nº Y..."
4. Financeiro → Use mover_lead_para_etapa(nova_etapa="financeiro") e transfer_to_human()
5. Pós-venda → Use mover_lead_para_etapa(nova_etapa="pos_venda")

⚠️ AGUARDE a escolha do lead. Se escolher opção 1, PULE direto para o PASSO 4.
```

### 4. Componente auxiliar `FluxoMenuEditor.tsx`
- Novo componente em `src/pages/avivar/config/components/steps/simple/`
- Encapsula a lógica do editor de menu (lista de opções + ações)
- Recebe `menuOptions`, `onChange`, lista de passos disponíveis, e lista de colunas do kanban

## Como funciona end-to-end

1. Usuário abre o passo no wizard e clica "Adicionar Menu de Opções"
2. Define as opções (1. Agendar, 2. Financeiro, etc.) e escolhe a ação de cada uma
3. Ao salvar o agente, o `menuOptions` é persistido no JSONB `fluxo_atendimento`
4. Quando a IA processa uma conversa, o `buildFluxoInstructions` gera instruções claras de ramificação
5. A IA apresenta o menu, espera a resposta, e executa a ação correspondente (pular passo, mover kanban, transferir)

## Ferramentas já existentes no agente

- `transfer_to_human(reason)` — transferência para humano
- `mover_lead_para_etapa(nova_etapa, motivo)` — mover lead no kanban

Não precisa criar novas tools — apenas instruir a IA a usar as existentes baseado na opção escolhida.

