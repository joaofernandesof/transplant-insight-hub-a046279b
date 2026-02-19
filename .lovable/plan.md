
# Botoes de Cidades para Filtrar a Agenda de Cirurgias

## O que sera feito

Adicionar botoes de cidades (Fortaleza, Juazeiro, Sao Paulo) centralizados acima da tabela/kanban/calendario, permitindo alternar rapidamente entre as agendas de cada cidade. Tambem incluir um botao "Todas" para ver todas as cirurgias sem filtro de cidade.

## Detalhes Tecnicos

### Arquivo: `src/pages/SurgerySchedule.tsx`

1. **Novo estado**: Adicionar `const [cityFilter, setCityFilter] = useState<string>("all")` para controlar a cidade selecionada.

2. **Filtro na logica `filteredSurgeries`**: Adicionar verificacao do campo `cidade` dentro do `useMemo` existente:
   ```
   if (cityFilter !== "all" && surgery.cidade !== cityFilter) return false;
   ```

3. **Botoes centralizados**: Inserir uma linha de botoes logo acima do bloco de `Tabs` (Kanban/Tabela/Calendario), usando `Button` com `variant="outline"` para cidades nao selecionadas e `variant="default"` para a selecionada. Layout com `flex justify-center gap-2`.

   Botoes: **Todas** | **Fortaleza** | **Juazeiro** | **Sao Paulo**

   Sera importado `CIDADES` de `useWeeklyScheduleRules` (ja importado no arquivo).

### Visual

```text
+---------------------------------------------------+
|  [Todas]  [Fortaleza]  [Juazeiro]  [Sao Paulo]   |
+---------------------------------------------------+
|  Kanban | Tabela | Calendario                      |
|  ...conteudo filtrado...                           |
+---------------------------------------------------+
```

Nenhuma mudanca de banco de dados necessaria.
