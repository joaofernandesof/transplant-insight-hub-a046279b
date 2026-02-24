

## Adicionar "Personalizado" nos botões rápidos de período

### Problema
Os botões rápidos de período (barra inferior) mostram apenas: Hoje, Semana, Mês, Próximo. Falta a opção "Personalizado" que já existe no dropdown superior.

### Solução
Adicionar o botão "Personalizado" na barra de botões rápidos (linha 422-439 do `ClinicDashboard.tsx`), e quando clicado, abrir o date range picker inline ao lado, igual ao comportamento que já existe no dropdown.

### Arquivo editado
- `src/clinic/pages/ClinicDashboard.tsx`

### Detalhes técnicos
1. Adicionar `{ value: 'custom', label: 'Personalizado' }` no array de botões rápidos (linha 423-428)
2. Manter o popover de calendário que já existe (linhas 291-314) visível quando `selectedPeriod === 'custom'` é ativado via botão rápido -- reutilizar a mesma lógica já implementada

Nenhuma mudança de banco de dados necessária. Apenas um item a mais no array de botões.

