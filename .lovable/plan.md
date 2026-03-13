

# Diagnóstico e Plano de Correção — Acesso ao Portal Avivar

## Problema Identificado

O usuário `mrobister@gmail.com` (e outros) tem `avivar` na coluna `allowed_portals` da tabela `neohub_users`, mas **não possui registro correspondente** na tabela `user_portal_roles`. 

O fluxo de autenticação (`get_user_context()` → `UnifiedAuthContext`) deriva `allowedPortals` **exclusivamente** de `user_portal_roles`. Como o registro está ausente, o portal Avivar não aparece na lista de portais permitidos, impedindo o acesso tanto pela rota direta quanto pelo sidebar.

## Usuários Afetados (9 registros faltantes)

| Email | Portal(s) faltante(s) |
|---|---|
| dracintia@outlook.com | avivar |
| fabiobranaro@hotmail.com | academy |
| joselio0611@gmail.com | avivar |
| mrobister@gmail.com | avivar |
| nicholas.barreto@gmail.com | avivar |
| ti@neofolic.com.br | avivar, ipromed, neopay, vision |

## Plano de Correção

### 1. Correção de Dados (imediata)
Inserir os 9 registros faltantes em `user_portal_roles` com `role_id = operador` (090ee82e), garantindo que todos os portais listados em `allowed_portals` tenham vínculo correspondente no RBAC.

### 2. Correção de Código (preventiva)
No `UnifiedAuthContext.tsx`, ao construir `allowedPortals`, fazer merge entre os portais derivados de `user_portal_roles` (via `get_user_context()`) e os portais da coluna `allowed_portals` de `neohub_users` (que já é buscada no mesmo fluxo). Isso garante que mesmo se houver inconsistência no RBAC, o usuário mantém acesso.

### 3. Correção no Fluxo de Criação
No `admin-create-user` edge function e no `AvivarTeamPage`, quando `allowed_portals` é definido, garantir que `user_portal_roles` também é preenchido automaticamente.

