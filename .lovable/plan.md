

## Botao "+" minimalista para adicionar coluna

### O que muda

1. **Remover o botao "Nova Coluna" do header** (`KanbanHeader.tsx`) -- o botao grande que aparece ao lado de "Adicionar Lead" sera removido, junto com a prop `onAddColumn`.

2. **Adicionar um botao "+" em cada coluna** (`KanbanColumn.tsx`) -- um pequeno icone "+" sera adicionado no header da coluna, ao lado do menu de 3 pontinhos. Ao clicar, abre o dialog de criar coluna.

3. **A nova coluna sera inserida a direita da coluna clicada** (`AvivarKanbanPage.tsx`) -- ao clicar no "+" de uma coluna, o `order_index` da nova coluna sera definido como `coluna_clicada.order_index + 1`, e todas as colunas subsequentes terao seu `order_index` incrementado em 1.

### Detalhes tecnicos

**KanbanHeader.tsx**
- Remover o bloco condicional `viewMode === 'kanban'` que renderiza o botao "Nova Coluna"
- Remover a prop `onAddColumn` da interface e do componente

**KanbanColumn.tsx**
- Adicionar prop `onAddColumnAfter?: () => void`
- Renderizar um botao `Plus` (icone apenas, `size="icon"`, `h-7 w-7`) no header da coluna, entre o badge de contagem e o menu de 3 pontinhos
- Estilo: `hover:bg-white/20 text-white` para manter consistencia com o header colorido

**AvivarKanbanPage.tsx**
- Adicionar estado `insertAfterColumn` para rastrear apos qual coluna inserir
- Ao clicar no "+" de uma coluna, setar `insertAfterColumn` com o `order_index` da coluna e abrir o dialog
- Modificar `createColumn.mutationFn`:
  - Se `insertAfterColumn` estiver definido, primeiro incrementar o `order_index` de todas as colunas com `order_index > insertAfterColumn`
  - Definir o `order_index` da nova coluna como `insertAfterColumn + 1`
  - Caso contrario (fallback), usar `columns.length` como hoje

**SortableColumn.tsx**
- Passar a nova prop `onAddColumnAfter` para o `KanbanColumn`

