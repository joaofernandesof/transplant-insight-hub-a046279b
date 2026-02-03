
# Plano: Atualizar Header do LeadDetailsSidebar (Coluna 2 - Aba Chats)

## Contexto do Problema
As alterações anteriores foram aplicadas ao componente **errado**. Existem dois componentes de sidebar:
- `LeadDetailsSidebarStandalone.tsx` - foi atualizado (não é usado no inbox)
- `LeadDetailsSidebar.tsx` - é o componente que aparece na aba Chats e **não foi atualizado**

## Mudanças Necessárias

### Arquivo: `src/components/crm/chat/LeadDetailsSidebar.tsx`

**1. Remover Avatar do Header**
- Excluir o componente `Avatar` das linhas 152-156
- Remover import do `Avatar, AvatarFallback` (linha 28)

**2. Substituir Botões por Menu de 3 Pontinhos**
- Remover botão de lápis (Edit2) - linhas 171-177
- Remover AlertDialog de exclusão - linhas 179-222
- Adicionar `DropdownMenu` com ícone `MoreVertical`
- Menu terá 3 opções:
  - **Editar Lead** - abre dialog de edição
  - **Editar Tags** - abre dialog de edição (foco em tags)
  - **Excluir Lead** - mantém lógica de confirmação via AlertDialog

**3. Ajustar Layout do Header**
- Alterar de `items-start gap-3` para `items-center justify-between`
- Manter nome do lead e badge de ID

### Novos Imports Necessários
```typescript
import { MoreVertical, Tags } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
```

---

## Detalhes Técnicos

### Estrutura do Novo Header
```text
┌─────────────────────────────────────────┐
│ Nome do Lead                    [⋮]    │
│ Lead #abc123                            │
└─────────────────────────────────────────┘
```

### Menu Dropdown
```text
┌───────────────────┐
│ ✏️ Editar Lead    │
│ 🏷️ Editar Tags    │
│ ─────────────────  │
│ 🗑️ Excluir Lead   │ (vermelho)
└───────────────────┘
```

### Lógica de Exclusão
A funcionalidade de exclusão será movida para dentro do dropdown, mas o `AlertDialog` de confirmação será mantido para segurança. Ao clicar em "Excluir Lead" no dropdown, abrirá o dialog de confirmação.
