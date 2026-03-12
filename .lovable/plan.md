

## Problema Identificado

O usuário **patrick.penaforte@neofolic.com.br** possui um registro na tabela `neoteam_team_members` com `is_active = false`. A função RLS `is_neoteam_member_safe()` exige `is_active = true` para permitir leitura da tabela `neoteam_branches`. Resultado: a query retorna vazio e só aparece o botão "Todas" sem as filiais individuais.

## Solução

Duas ações necessárias:

### 1. Reativar o membro na tabela `neoteam_team_members`
Atualizar o registro do Patrick para `is_active = true`, permitindo que a função RLS o reconheça como membro do NeoTeam.

### 2. Tornar a leitura de branches mais permissiva para usuários autenticados
Alterar a política RLS da tabela `neoteam_branches` para que **qualquer usuário autenticado** possa visualizar as filiais (SELECT), sem depender de `is_neoteam_member_safe`. Isso garante que todos os usuários autenticados no NeoTeam vejam o filtro completo de agendas/filiais.

A policy `Members can view branches` será alterada de:
```sql
is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid())
```
Para:
```sql
auth.uid() IS NOT NULL
```

### Arquivos alterados
- **1 migração SQL**: reativar Patrick + atualizar RLS policy de `neoteam_branches`

Nenhuma alteração de código frontend é necessária — o `useBranches({ showAll: true })` já retorna todas as branches quando a query funciona.

