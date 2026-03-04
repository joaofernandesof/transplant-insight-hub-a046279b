

## Plano: Drag & Drop no Kanban de Vagas (NeoRH)

### O que será feito
Adicionar drag & drop nos cards do Kanban de vagas (`/neorh/vagas`) usando `@dnd-kit` (já instalado no projeto). Ao arrastar um card de uma coluna para outra, a vaga será movida para a nova etapa automaticamente via `moveToEtapa`.

### Alterações em `src/neohub/pages/neorh/NeoRHVagas.tsx`

1. **Imports**: Adicionar `DndContext`, `DragOverlay`, `closestCenter`, `PointerSensor`, `useSensor`, `useSensors` do `@dnd-kit/core` e `useSortable` do `@dnd-kit/sortable`

2. **Estado de drag**: Adicionar `activeVaga` state para rastrear o card sendo arrastado

3. **Sensors**: Configurar `PointerSensor` com `activationConstraint: { distance: 8 }` para diferenciar click de drag

4. **VagaCard**: Tornar arrastável com `useSortable({ id: vaga.id, data: { type: 'vaga', vaga, etapaId } })`

5. **Colunas**: Tornar droppable com `useDroppable({ id: etapa.id })`; highlight visual quando `isOver`

6. **DragOverlay**: Renderizar preview do card durante o arraste

7. **handleDragEnd**: Identificar a coluna de destino e chamar `moveToEtapa(vaga, newEtapaId)` se a etapa mudou

8. **Envolver** o board de cada fluxo com `<DndContext>` para escopo independente (Express vs Executivo)

### Comportamento
- Click no card continua abrindo o detalhe (distance constraint previne conflito)
- Arrastar entre colunas atualiza a etapa no banco via `moveToEtapa`
- Feedback visual: card semi-transparente na origem + overlay flutuante + coluna com borda de destaque

