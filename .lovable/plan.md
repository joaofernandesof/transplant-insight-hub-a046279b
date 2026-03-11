

# Migrar Portal NeoRH para Setor RH do NeoTeam

## Resumo
Eliminar o portal NeoRH (`/neorh/*`) como portal independente e mover todas as suas 12 páginas para dentro do setor RH do NeoTeam (`/neoteam/rh/*`).

## Mudanças

### 1. `src/App.tsx`
- **Remover** a função `NeoRHRoutes()` inteira (linhas ~617-655) e a rota `/neorh/*` (linha ~957)
- **Adicionar** no bloco `{/* ===== SETOR RH ===== */}` (após linha 558) todas as rotas do NeoRH como sub-rotas do NeoTeam:
  - `rh/dashboard` → NeoRHDashboard
  - `rh/colaboradores` → NeoRHColaboradores
  - `rh/cargos-rh` → NeoRHCargos (mantendo `rh/cargos` existente como Staff Roles)
  - `rh/vagas` → NeoRHVagas
  - `rh/job-description` → NeoRHJobDescription
  - `rh/performance` → PerformanceDashboard
  - `rh/performance/cycles`, `evaluations`, `ranking`, `kpis`, `pdi`, `talent-score`
- **Adicionar redirects** de `/neorh/*` para `/neoteam/rh/*` no bloco de legacy routes
- **Remover** import do `NeoRHBanner`

### 2. `src/config/menuConfig.ts`
- **Expandir** o grupo `setor_rh` (linhas 370-381) com os novos itens: Dashboard RH, Colaboradores, Vagas, Gerador de JD, e sub-itens de Performance — todos com rotas `/neoteam/rh/...`
- **Atualizar** a rota de `neoteam_performance` de `/neorh/performance` para `/neoteam/rh/performance`
- **Manter** `NEORH_MENU_ITEMS` no `PORTAL_MENUS` apontando para as novas rotas (compatibilidade) ou removê-lo

### 3. `src/components/UnifiedSidebar.tsx`
- **Remover** `neorh` do `PortalKey` type e do `PORTAL_CONFIGS`
- **Remover** a linha de detecção `if (pathname.startsWith('/neorh')) return 'neorh'`
- O sidebar do NeoTeam já exibe o menu por setor ativo, então ao navegar em `/neoteam/rh/*` o menu do setor RH será exibido automaticamente

### 4. `src/neohub/components/NeoRHBanner.tsx`
- Não precisa ser deletado, mas não será mais usado (import removido do App.tsx)

### Arquivos alterados
- `src/App.tsx`
- `src/config/menuConfig.ts`
- `src/components/UnifiedSidebar.tsx`

