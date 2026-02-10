
# Melhorias na Pagina de Equipe Avivar

## O que sera feito

### 1. Renomear botao
- "Adicionar Atendente" vira **"+ Novo Usuario"**
- Titulo do dialog "Novo Atendente" vira **"Novo Usuario"**

### 2. Email do administrador
- Na listagem de membros, buscar o email real de cada membro fazendo join com a tabela `profiles` (via `user_id`)
- O primeiro membro (owner da conta) sempre mostrara seu email real

### 3. Aba de Permissoes embutida na pagina
Em vez de navegar para uma rota separada, a pagina tera duas abas usando o componente Tabs:
- **Usuarios** - conteudo atual (lista de membros, busca, stats)
- **Permissoes** - matriz redesenhada no estilo das imagens de referencia

### Layout da Matriz de Permissoes (redesign)

A nova matriz tera:
- **Seletor de funcao no topo**: Escolher qual funcao esta sendo configurada (Admin, Coordenador, SDR, Atendente) com badges coloridas
- **Categorias agrupadas com header destacado**: Cada grupo (Leads/Funis, Chats, Agenda, etc.) aparece como header com fundo sutil
- **Sub-itens por categoria**: Funcionalidades especificas aparecem como linhas dentro de cada grupo
- **4 colunas de acao com cores distintas**:
  - Visualizar (azul)
  - Inserir (verde)
  - Alterar (amarelo/laranja)
  - Excluir (vermelho)
- **Checkbox "Selecionar tudo"** no header de cada categoria
- Botao "Salvar Alteracoes" quando houver mudancas pendentes

### Categorias e sub-itens da matriz

| Categoria | Sub-itens |
|-----------|-----------|
| Leads/Funis | Ver leads, Criar leads, Editar leads, Excluir leads, Mover no Kanban |
| Chats/Inbox | Ver conversas, Enviar mensagens, Atribuir conversas, Encerrar conversas |
| Agenda | Ver agendamentos, Criar agendamentos, Editar agendamentos, Cancelar agendamentos |
| Follow-up | Ver follow-ups, Criar regras, Editar regras, Pausar/cancelar |
| Configuracoes IA | Configurar agentes, Editar prompts, Ativar/desativar IA |
| Equipe | Ver membros, Adicionar membros, Editar membros, Remover membros |
| Relatorios | Ver dashboards, Exportar dados |

## Detalhes Tecnicos

### Arquivos modificados
1. **`src/pages/avivar/AvivarTeamPage.tsx`**
   - Envolver conteudo com `Tabs` (abas "Usuarios" e "Permissoes")
   - Renomear botao e dialog
   - Melhorar query de membros para buscar email do `profiles`

2. **`src/pages/avivar/PermissionsMatrix.tsx`**
   - Redesenhar completamente o layout:
     - Remover header com botao "Voltar" (agora e aba embutida)
     - Adicionar seletor de funcao no topo com badges
     - Reorganizar tabela com categorias agrupadas e sub-itens
     - Usar checkboxes coloridos por tipo de acao (azul/verde/amarelo/vermelho)
     - Adicionar "Selecionar tudo" por categoria

### Persistencia
- Estado local por enquanto (mesmo comportamento atual)
- Estrutura preparada para futura integracao com banco de dados
