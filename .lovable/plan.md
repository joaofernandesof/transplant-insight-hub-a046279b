

# Reformular formulário "Abrir Chamado" em /neoteam/ti/chamados

## Mudanças no `TicketForm` (src/pages/neoteam/ti/TicketsPage.tsx)

### 1. Título pré-definido (Select em vez de Input)
Substituir o `<Input>` de título por um `<Select>` com as opções:
Kommo, Feegow, Clickup, ClickSing, Planilha, Neohub, Wordpress, Kiwify, Acessos no Drive, Stripe, Bling, Conta Azul, Anota Ai, Facebook, ManyChat, Doctoralia, FireFlies, Google Agenda, NuvemShop, Pluga, Outros.

### 2. Remover prioridade do formulário para não-admins
O componente `TicketForm` receberá uma prop `isAdmin` vinda do `useUnifiedAuth`. O `<Select>` de prioridade só aparece se `isAdmin === true`. Para não-admins, prioridade será fixada como `"medium"` no submit.

### 3. Novo campo "Tipo" (Melhoria ou Problema)
Adicionar um `<Select>` com duas opções: `melhoria` e `problema`. Será salvo no campo `category` do ticket (que já existe e atualmente é fixo `"general"`).

### 4. Novo campo "Link URL"
Adicionar um `<Input>` opcional com placeholder "Link URL (opcional)" para o usuário colar uma URL de referência. Será salvo no campo `description` concatenado, ou em um campo dedicado se existir na tabela. Verificarei a tabela — se não houver coluna, salvarei como prefixo na descrição no formato `[URL: ...]\n{descrição}`.

### 5. Campo de prazo com calendário
Adicionar um `<Popover>` + `<Calendar>` (date picker padrão shadcn) para o usuário selecionar uma data de prazo. O valor será salvo como `due_date` — verificarei se a coluna existe na tabela.

### Verificação de schema necessária
Preciso verificar se `neoteam_tickets` tem colunas `due_date` e `link_url`. Se não, criarei uma migration para adicioná-las.

### Arquivos alterados
- `src/pages/neoteam/ti/TicketsPage.tsx` — reformular `TicketForm` e passar `isAdmin` prop
- Possível migration SQL para adicionar colunas `due_date` e `link_url`

