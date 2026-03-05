

# Correção: Todos os usuários NeoTeam veem todas as filiais na Agenda Cirúrgica

## Problema

O hook `useBranches()` restringe as filiais retornadas para usuários não-admin/não-gestão, mostrando apenas `user.branch` + `user.additionalBranches`. Isso faz com que alguns usuários vejam apenas "Todas" sem os filtros individuais por filial.

Além disso, `ClinicDashboard.tsx` usa `canFilterBranch = isAdmin || isGestao` para decidir se mostra todas as opções — restringindo duplamente.

## Solução

Duas alterações simples:

### 1. `src/clinic/hooks/useBranches.ts`
- Adicionar parâmetro opcional `showAll?: boolean` ao hook
- Quando `showAll` for `true`, retornar `allBranches` independente do perfil do usuário
- Manter o comportamento atual como padrão para não quebrar outros usos

### 2. `src/clinic/pages/ClinicDashboard.tsx`
- Quando no contexto NeoTeam (`isNeoTeamContext` já existe no código, linha 68), chamar `useBranches()` com `showAll: true`
- Remover a restrição de `canFilterBranch` para o contexto NeoTeam — todos os usuários verão todos os filtros de filial

### Resultado
- Usuários atuais e futuros do NeoTeam verão sempre: `Todas | Filial Fortaleza | Filial Juazeiro | São Paulo | Terceirização`
- O comportamento em outros contextos (Clinic puro) permanece inalterado

