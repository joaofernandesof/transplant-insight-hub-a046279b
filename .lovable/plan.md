

# Edição inline de Prioridade e Prazo para admins

## Problema
Atualmente, prioridade e prazo só podem ser definidos na criação do chamado. Admins não conseguem editá-los depois.

## Solução

### 1. Adicionar mutation para atualizar prioridade e prazo
Criar uma nova `useMutation` (`updateTicketField`) que faz `UPDATE` na tabela `neoteam_tickets` para campos como `priority` e `due_date`.

### 2. Prioridade — Select inline na tabela (apenas admins)
Na coluna "Prioridade" (linha ~392), substituir o `<Badge>` estático por um `<Select>` para `isTicketAdmin`, permitindo trocar a prioridade diretamente na tabela. Não-admins continuam vendo o Badge.

### 3. Prazo — Popover com Calendar inline na tabela (apenas admins)
Na coluna "Data" (linha ~461), para `isTicketAdmin`, substituir o texto estático por um `<Popover>` com `<Calendar>` para editar o `due_date`. Exibir o prazo (`due_date`) quando existir, senão a data de criação. Não-admins veem apenas texto.

### 4. Coluna "Data" → "Prazo"
Renomear o header da coluna de "Data" para "Prazo" e mostrar `due_date` quando disponível, com fallback para `created_at`.

### Arquivo alterado
- `src/pages/neoteam/ti/TicketsPage.tsx`

