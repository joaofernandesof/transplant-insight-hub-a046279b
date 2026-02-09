
# Escopo de Funil nas Regras de Follow-up

## Resumo

Adicionar a possibilidade de definir em quais funis (Kanbans) e colunas cada regra de follow-up se aplica. Assim, regras diferentes podem ser usadas para leads em etapas diferentes do funil.

## Como funciona hoje

- As regras de follow-up sao aplicadas a TODOS os leads igualmente, sem filtro por funil ou coluna
- O campo `target_kanban_id` existente serve apenas para MOVER o lead apos o envio (automacao), nao para filtrar onde a regra se aplica
- O debounce-processor pega a primeira regra ativa (attempt 1) sem verificar em qual funil/coluna o lead esta

## O que sera feito

### 1. Migracao SQL: Novos campos de escopo

Adicionar dois campos na tabela `avivar_followup_rules`:
- `applicable_kanban_ids` (UUID array, nullable) - lista de Kanbans onde a regra se aplica
- `applicable_column_ids` (UUID array, nullable) - lista de colunas especificas (dentro dos Kanbans selecionados)

Quando ambos forem NULL, a regra se aplica a todos os leads (comportamento atual mantido).

### 2. UI: Nova secao "Escopo" na aba Mensagem do dialog

No `FollowupRuleDialog.tsx`, adicionar uma secao no inicio ou na aba "Automacao" com:
- Multi-select de Kanbans (funis) usando checkboxes
- Quando kanbans selecionados, mostrar as colunas desses kanbans para filtro opcional
- Label clara: "Aplicar esta regra apenas a leads nos funis/etapas selecionados"
- Indicacao visual: "Todos os funis" quando nenhum for selecionado

### 3. Card: Indicador visual de escopo

No `FollowupRuleCard.tsx`, exibir um Badge indicando o escopo:
- Se nenhum filtro: nao mostra nada (comportamento atual)
- Se filtrado: Badge com icone de funil e nome(s) do(s) kanban(s)

### 4. Backend: Filtrar regras pelo escopo do lead

No `avivar-debounce-processor/index.ts`:
- Antes de agendar, verificar em qual kanban/coluna o lead esta (via `avivar_kanban_leads`)
- Filtrar regras que se aplicam aquele kanban/coluna
- Se a regra tem `applicable_kanban_ids` preenchido, so aplicar se o lead esta em um desses kanbans

No `avivar-process-followups/index.ts`:
- Na hora de buscar a proxima regra (sequencia), aplicar o mesmo filtro de escopo

## Seguranca

- Leads existentes: regras sem escopo definido continuam funcionando normalmente para todos
- Sem risco de quebrar automacoes existentes (campos novos sao nullable com default NULL)

## Detalhes Tecnicos

### SQL Migration
```sql
ALTER TABLE avivar_followup_rules 
ADD COLUMN IF NOT EXISTS applicable_kanban_ids UUID[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS applicable_column_ids UUID[] DEFAULT NULL;
```

### Arquivos editados
1. `FollowupRuleDialog.tsx` - Adicionar UI de selecao multi-kanban/coluna
2. `FollowupRuleCard.tsx` - Badge indicando escopo
3. `useFollowupRules.ts` - Incluir novos campos na interface e mutacoes
4. `avivar-debounce-processor/index.ts` - Filtrar regra pelo kanban/coluna do lead
5. `avivar-process-followups/index.ts` - Filtrar proxima regra pelo escopo

### Fluxo de filtragem no backend

```text
Lead nao responde
       |
       v
Debounce busca kanban/coluna do lead
       |
       v
Filtra regras ativas onde:
  applicable_kanban_ids IS NULL (aplica a todos)
  OU lead.kanban_id IN applicable_kanban_ids
       |
       v
Pega a primeira regra compativel (attempt 1)
       |
       v
Agenda follow-up normalmente
```
