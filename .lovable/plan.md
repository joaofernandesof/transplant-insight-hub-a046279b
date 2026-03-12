

## Plano: Modal de Detalhes do Chamado (Admin)

### O que será feito

Ao clicar em uma linha da tabela, admins verão um **Dialog** com:

1. **Informações completas** -- número, título, descrição completa, solicitante, responsável, status, prioridade, link URL, datas (criação, prazo, resolução)
2. **Anexos** -- busca dos anexos na tabela `neoteam_ticket_attachments` e exibição com preview de imagens e links para download
3. **Edição de prazo** -- calendar picker inline no modal para alterar `due_date`

### Alterações técnicas

**Arquivo:** `src/pages/neoteam/ti/TicketsPage.tsx`

- Adicionar estado `selectedTicket` para controlar qual chamado está aberto no modal
- Adicionar `onClick` no `TableRow` (apenas para admins) que seta o `selectedTicket`
- Impedir propagação de cliques nos controles inline existentes (Select de prioridade, status, botão Assumir, calendar de prazo) para que não abram o modal
- Criar componente `TicketDetailDialog` dentro do mesmo arquivo:
  - Props: `ticket`, `open`, `onOpenChange`, `attachmentCounts`, `updateTicketField`, `isAdmin`
  - Query interna para buscar anexos: `supabase.from("neoteam_ticket_attachments").select("*").eq("ticket_id", ticket.id)`
  - Layout: `Dialog` com `max-h-[90vh]` e `ScrollArea`
  - Seções: cabeçalho (número + título + badges de status/prioridade), descrição completa, link URL clicável, grid de anexos (imagens com preview, outros com ícone), e calendar para edição de prazo
  - Botão de fechar padrão do Dialog

