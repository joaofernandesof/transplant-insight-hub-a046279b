
# Tornar Chamados de TI acessível a todos os perfis do portal Colaborador

## Problema
1. O menu "Chamados" no sidebar tem `adminOnly: true` (linha 366 de `menuConfig.ts`), então só admins veem o item.
2. Na página `TicketsPage.tsx`, todos os controles de edição (status, assumir/liberar) ficam visíveis para qualquer usuário — não há restrição por perfil.

## Solução

### 1. Sidebar — Remover `adminOnly` do item Chamados
Em `src/config/menuConfig.ts`, linha 366: remover `adminOnly: true` do item `neoteam_tickets` para que todos os perfis vejam o menu.

### 2. Página — Restringir edição a admins
Em `src/pages/neoteam/ti/TicketsPage.tsx`:
- O `isAdmin` do `useUnifiedAuth()` já está disponível.
- **Status Select**: Mostrar como texto estático (badge) para não-admins; manter o `<Select>` apenas para admins.
- **Botão Assumir/Liberar**: Mostrar apenas para admins.
- **Botão "Novo Chamado"**: Manter visível para todos (todos podem abrir chamado).
- Contadores e tabela: Visíveis para todos.

### Arquivos alterados
- `src/config/menuConfig.ts` — remover `adminOnly` do item Chamados TI
- `src/pages/neoteam/ti/TicketsPage.tsx` — condicionar status/assumir a `isAdmin`
