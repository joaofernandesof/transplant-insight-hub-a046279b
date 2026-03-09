

## Plano: Mostrar datas sem pacientes na SurgeryWeekTable

### Problema
A tabela só renderiza datas que têm cirurgias. Datas com disponibilidade configurada (vagas/bloqueios) mas sem pacientes ficam invisíveis.

### Alteração (apenas em `SurgeryWeekTable.tsx`)

**1. Nova prop `periodRange`** — Adicionar prop opcional `periodRange?: { start: Date; end: Date }` à interface do componente.

**2. Injetar datas vazias no `useMemo` do agrupamento (linhas 41-75)** — Após agrupar as cirurgias existentes, se `periodRange` estiver definido, usar `eachDayOfInterval` para iterar todas as datas do período. Para cada data que não existe no mapa, inserir uma entrada vazia (`[]`). Manter a ordenação existente (hoje → futuro → passado).

**3. Remover o early-return quando `surgeries.length === 0` (linhas 131-134)** — Substituir a condição para só mostrar "Nenhuma cirurgia" quando também não houver datas do período. Ou seja, checar `grouped.size === 0` em vez de `surgeries.length === 0`.

**4. Renderizar linha vazia para datas sem pacientes** — Quando `items.length === 0`, mostrar uma linha com o status de disponibilidade (ex: "4 vagas disponíveis", "Bloqueado", "Sem configuração") em vez de ocultar a data.

**5. Em `ClinicDashboard.tsx`** — Passar `periodRange={periodRange}` ao `SurgeryWeekTable`. Alteração mínima: apenas adicionar a prop.

### Resultado
Todas as datas do período selecionado aparecerão na agenda, mesmo sem pacientes, com o badge de disponibilidade visível.

