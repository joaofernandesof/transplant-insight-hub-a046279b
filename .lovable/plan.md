

## Filtro de Pendências do Checklist — Agenda Cirúrgica

### O que será feito
Adicionar uma nova linha de filtros rápidos (chips) na área de filtros da Agenda Cirúrgica, permitindo filtrar cirurgias que possuem itens pendentes no checklist preparatório.

### Filtros disponíveis
Cada chip filtra cirurgias onde o respectivo campo booleano é `false` (pendente):

| Chip | Campo | Descrição |
|------|-------|-----------|
| Exames | `examsSent` | Exames não enviados |
| Guias | `guidesSent` | Guias não enviadas |
| Contrato | `contractSigned` | Contrato não assinado |
| Prontuário | `chartReady` | Prontuário não pronto |
| Confirmação | `surgeryConfirmed` | Cirurgia não confirmada |
| Termo Reserva | `bookingTermSigned` | Termo de reserva não assinado |
| Termo Alta | `dischargeTermSigned` | Termo de alta não assinado |
| GPI D+1 | `gpiD1Done` | GPI D+1 não realizado |

### Comportamento
- Multi-select (igual aos filtros D-XX existentes)
- Quando um ou mais chips estão ativos, mostra apenas cirurgias com **todos** os itens selecionados pendentes (AND lógico — filtra as que precisam de atenção naqueles itens)
- Botão "Limpar" aparece quando há filtros ativos

### Alterações técnicas

**Arquivo**: `src/clinic/pages/ClinicDashboard.tsx`

1. **Novo state**: `activeChecklistFilters: Set<string>` com toggle e clear
2. **Nova constante**: Array de definições `CHECKLIST_FILTERS` mapeando label → campo do `ClinicSurgery`
3. **Filtro no pipeline** `filteredSurgeries`: após os filtros existentes, aplicar checklist filter — manter apenas cirurgias onde cada campo selecionado é `false`
4. **Nova linha de UI**: Entre os chips de "Disponibilidade" e o filtro de "Filial", adicionar linha com label "Pendências:" seguida dos chips de checklist, no mesmo estilo visual dos filtros D-XX e Disponibilidade

