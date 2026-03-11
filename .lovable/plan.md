

# Mudar rota dos setores de `/neoteam/setor/{code}` para `/neoteam/{code}`

## Problema
Atualmente, ao clicar em um setor na home do NeoTeam, a rota é `/neoteam/setor/rh`, `/neoteam/setor/ti`, etc. O usuário quer que seja `/neoteam/rh`, `/neoteam/ti`, etc.

## Mudanças

### 1. `src/App.tsx`
- Substituir a rota `setor/:code` por rotas individuais para cada setor: `rh`, `ti`, `tecnico`, `sucesso-paciente`, `operacional`, `processos`, `financeiro`, `juridico`, `comercial`, `marketing`, `compras`, `manutencao` — todas apontando para `SectorDashboardPage`
- Adicionar redirect de `setor/:code` para `/neoteam/:code` (compatibilidade)

### 2. `src/neohub/pages/neoteam/SectorDashboardPage.tsx`
- Alterar a lógica para extrair o `code` do setor a partir do pathname (último segmento da URL) em vez de `useParams({ code })`, já que agora não há mais o prefixo `setor/`
- Mapear slugs com hífen para códigos com underscore (ex: `sucesso-paciente` → `sucesso_paciente`)

### 3. `src/neohub/pages/neoteam/NeoTeamHome.tsx`
- Alterar navegação de `navigate('/neoteam/setor/${sector.code}')` para `navigate('/neoteam/${sectorSlug}')` com mapeamento de underscore para hífen

### 4. `src/components/UnifiedSidebar.tsx`
- Remover a regex de `/neoteam/setor/` no `activeSectorCode` — a lógica existente de `/neoteam/{known-sector-slug}` já cobre o novo padrão

### 5. `src/neohub/components/NeoTeamBreadcrumb.tsx`
- Já possui labels para `/neoteam/tecnico`, `/neoteam/rh`, etc. — sem mudanças necessárias

### Arquivos alterados
- `src/App.tsx`
- `src/neohub/pages/neoteam/SectorDashboardPage.tsx`
- `src/neohub/pages/neoteam/NeoTeamHome.tsx`
- `src/components/UnifiedSidebar.tsx`

