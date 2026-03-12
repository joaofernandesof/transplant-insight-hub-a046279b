

## Plano: Edição de Status e Prioridade no Modal + Botão Salvar

### O que será feito

Transformar o modal de detalhes do chamado para permitir edição de **status**, **prioridade** e **prazo** com um botão **Salvar** unificado (ao invés de salvar cada campo individualmente).

### Alterações em `src/pages/neoteam/ti/TicketsPage.tsx`

**Componente `TicketDetailDialog`:**

1. Adicionar estado local para campos editáveis: `editStatus`, `editPriority`, `editDueDate` — inicializados com os valores do ticket
2. No header, substituir os `Badge` estáticos de status e prioridade por `Select` editáveis (apenas para admins):
   - Select de Status com opções: Aberto, Em Andamento, Aguardando, Resolvido, Fechado
   - Select de Prioridade com opções: Baixa, Média, Alta, Urgente
3. Manter o Popover de prazo existente, mas usar o estado local ao invés de salvar imediatamente
4. Adicionar um `DialogFooter` com botão **Salvar alterações** que:
   - Compara valores editados vs originais
   - Chama `updateTicketField.mutate` para cada campo alterado
   - Fecha o modal após salvar
5. Para usuários não-admin, manter badges estáticos (sem edição)

