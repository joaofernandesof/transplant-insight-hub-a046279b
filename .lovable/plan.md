

# Plano: Filtrar Portais no Sidebar pelo `allowedPortals` do Usuário

## Problema
O `PortalSwitcherButton` exibe **todos** os portais para qualquer usuário, sem verificar se ele tem acesso. Usuários como o Humberto (que só tem acesso ao Avivar) conseguem ver e navegar para portais não autorizados.

## Solução
Adicionar um campo `portalSlug` em cada portal do switcher, mapeando para os slugs reais do banco (`allowedPortals`), e filtrar a lista usando `user.allowedPortals`. Admins continuam vendo tudo.

## Mapeamento Portal ID → Slug do banco

| ID no Switcher | Slug no `allowedPortals` |
|---|---|
| admin | admin |
| academy | academy |
| license | neolicense |
| patient | neocare |
| staff | neoteam |
| doctor | neoteam |
| avivar | avivar |
| ipromed | ipromed |
| vision | vision |
| neopay | neopay |
| hotleads | hotleads |

## Alteração

**Arquivo:** `src/components/shared/PortalSwitcherButton.tsx`

1. Adicionar `portalSlug` a cada entrada do array `portals`
2. Importar `user` do `useUnifiedAuth` (já importa `isAdmin`)
3. Alterar o filtro de `filteredPortals`:
   - Admin (`isAdmin`): vê todos
   - Demais: só portais cujo `portalSlug` está em `user.allowedPortals`
   - Portal `admin` continua filtrado por `isAdmin`

Nenhuma outra alteração necessária — o `ProfileSelector` já usa lógica similar com `allowedPortals`.

