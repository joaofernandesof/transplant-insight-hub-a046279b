

## Integrar HotLeads dentro do Conecta Capilar (NeoAcademy)

### Objetivo
O HotLeads deixa de ser um módulo/portal independente e passa a ser uma seção dentro do Conecta Capilar (`/neoacademy`), acessível via sidebar e rotas internas.

### Arquitetura atual
- **HotLeads** é um portal standalone em `/hotleads/*` com 3 sub-rotas (marketplace, dashboard, settings)
- Tem seu próprio `HotLeadsRoutes()` em `App.tsx`, entrada no `ProfileSelector`, sidebar config em `menuConfig.ts`, e portal config em `UnifiedSidebar.tsx`
- **Conecta Capilar** (`/neoacademy/*`) usa `NeoAcademySidebar` com rotas internas e layout dark dedicado

### Mudanças planejadas

**1. Rotas — `App.tsx`**
- Adicionar sub-rotas dentro de `NeoAcademyRoutes`:
  - `/neoacademy/hotleads` → componente `HotLeads` (marketplace)
  - `/neoacademy/hotleads/dashboard` → `HotLeads` com `initialView="dashboard"`
  - `/neoacademy/hotleads/settings` → `HotLeads` com `initialView="settings"`
- Converter `/hotleads/*` de portal independente para redirect: `/hotleads` → `/neoacademy/hotleads`
- Atualizar redirects legados (`/avivar/hotleads`, `/neolicense/hotleads`) para apontar para `/neoacademy/hotleads`

**2. Sidebar — `NeoAcademySidebar.tsx`**
- Adicionar item "HotLeads" (ícone `Flame`) no menu de navegação, entre os itens do aluno
- Rota: `/neoacademy/hotleads`

**3. Menu config — `menuConfig.ts`**
- Atualizar `HOTLEADS_MENU_ITEMS` para usar rotas `/neoacademy/hotleads/*`
- Remover entrada `hotleads` de `PORTAL_MENUS` (não é mais portal independente)

**4. UnifiedSidebar — `UnifiedSidebar.tsx`**
- Remover `hotleads` do `PortalKey` type e `portalConfigs`
- Remover detecção de portal `hotleads` baseada em pathname
- Remover lógica especial de theme forcing e styling para `hotleads`

**5. ProfileSelector — `ProfileSelector.tsx`**
- Remover o módulo HotLeads da lista `SYSTEM_MODULES` (acesso agora é via Conecta Capilar)

**6. Navegação interna do HotLeads — `HotLeads.tsx`**
- Atualizar referências internas de `navigate('/hotleads')` e `navigate('/hotleads/dashboard')` para `/neoacademy/hotleads` e `/neoacademy/hotleads/dashboard`

**7. Permissions — `permissions.ts`**
- Mover `hotleads` de portal independente para sub-módulo de `neoacademy`
- Atualizar `getPortalFromRoute()` para mapear `/neoacademy/hotleads` → `neoacademy`

**8. Mobile — `useMobileEnvironment.ts`**
- Garantir que `/neoacademy/hotleads` continue liberado (já que `/neoacademy` é liberado e `/hotleads` era liberado)

**9. Testes — `routes.test.ts`**
- Atualizar assertivas de redirect legacy

### O que NÃO muda
- Toda a lógica de negócio do HotLeads (hooks, componentes, Edge Functions, tabelas) permanece intacta
- O componente `HotLeads.tsx` e todos os sub-componentes em `src/components/hotleads/` não precisam de alterações estruturais
- RLS, distribuição geográfica e aquisição de leads não são afetados

