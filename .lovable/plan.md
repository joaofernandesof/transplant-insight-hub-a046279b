

# Corrigir Botoes "Novo Lead" (Dashboard) e "Adicionar Lead" (Kanban)

## Problema

1. **Dashboard - "Novo Lead"**: O botao navega para `/avivar/inbox` em vez de abrir um dialog para criar lead. O usuario espera que abra um formulario de criacao.
2. **Kanban - "Adicionar Lead"**: O botao funciona corretamente (abre o `AddLeadDialog`), mas precisa ser verificado se ha algum erro na criacao.

## Solucao

### 1. Dashboard - Botao "Novo Lead"

Substituir o `onClick={() => navigate('/avivar/inbox')}` por um dialog de criacao de lead. Como o Dashboard nao tem um kanban especifico selecionado, o dialog precisa:

- Buscar os kanbans do usuario (usando `useKanbanBoards`)
- Quando houver apenas 1 kanban, seleciona-lo automaticamente e carregar suas colunas
- Quando houver multiplos, permitir escolher o kanban primeiro, depois a coluna
- Reutilizar a logica de insercao do `AddLeadDialog` existente

**Mudancas em `src/pages/avivar/AvivarDashboard.tsx`:**
- Importar `useKanbanBoards` e componentes de dialog
- Adicionar estado `isAddLeadDialogOpen`
- Criar um componente `DashboardAddLeadDialog` inline ou reutilizar/adaptar `AddLeadDialog` com seletor de kanban
- Trocar o `onClick` do botao "Novo Lead" para `() => setIsAddLeadDialogOpen(true)`

### 2. Componente `AddLeadDialog` - Tornar mais flexivel

Adaptar o `AddLeadDialog` para aceitar um `kanbanId` opcional. Quando nao receber, mostrar um seletor de funil/kanban no formulario.

**Mudancas em `src/pages/avivar/kanban/components/AddLeadDialog.tsx`:**
- Tornar `kanbanId` e `columns` opcionais
- Quando nao fornecidos, buscar kanbans e colunas internamente usando `useKanbanBoards`
- Adicionar um `Select` de kanban que, ao ser selecionado, filtra as colunas correspondentes
- Invalidar queries de dashboard alem das de kanban no `onSuccess`

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/avivar/kanban/components/AddLeadDialog.tsx` | Tornar kanbanId/columns opcionais, adicionar seletor de kanban quando nao fornecidos |
| `src/pages/avivar/AvivarDashboard.tsx` | Trocar navegacao por dialog, importar AddLeadDialog e useKanbanBoards |

