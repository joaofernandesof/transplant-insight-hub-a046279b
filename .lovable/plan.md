

## Plano: Checklist Matriz Fixa para Todas as Contas Avivar

### Objetivo
Tornar os 5 campos de checklist configurados na conta `lucasaraujo.neofolic@gmail.com` um template fixo ("matriz") que:
1. É criado automaticamente em toda nova conta Avivar
2. Não pode ser editado nem apagado por nenhum usuário
3. A seção "Estatísticas" (UTM) também fica protegida (já é somente leitura)

### Campos da Matriz (fonte: banco atual)
| # | field_key | field_label | field_type | options |
|---|-----------|-------------|------------|---------|
| 0 | nome_do_lead | NOME DO LEAD | text | — |
| 1 | email | EMAIL | text | — |
| 2 | data_e_hora | DATA E HORA | datetime | — |
| 3 | tipo_de_consulta | TIPO DE CONSULTA | select | PRESENCIAL, ONLINE |
| 4 | link_da_meet | LINK DA MEET | url | — |

### Alterações

#### 1. Migração SQL — marcar campos como `is_system`
- Adicionar coluna `is_system BOOLEAN DEFAULT false` na tabela `avivar_column_checklists`
- Marcar os 5 campos existentes da conta matriz como `is_system = true`
- Adicionar política RLS que impede DELETE/UPDATE em campos `is_system = true`

#### 2. Atualizar `create_default_avivar_kanbans` (função SQL)
- Após criar as colunas do kanban "Comercial", inserir automaticamente os 5 campos de checklist na primeira coluna, com `is_system = true`
- Garantir que toda nova conta já nasce com o checklist completo

#### 3. Backfill — aplicar em contas existentes
- Para todas as contas que já existem e **não possuem** esses 5 campos, inseri-los automaticamente com `is_system = true`

#### 4. Frontend — `ChecklistConfigDialog.tsx`
- Campos com `is_system = true`: ocultar botões de editar (Pencil) e excluir (Trash2)
- Exibir um badge/indicador "Campo padrão" nesses itens
- Manter a possibilidade de adicionar campos **customizados** (sem `is_system`)

#### 5. Frontend — `LeadDetailsSidebar.tsx`
- Nenhuma mudança necessária; os campos continuam renderizando normalmente
- A seção "Estatísticas" já é somente leitura (não tem botão de config)

### Resultado
- Novas contas: nascem com os 5 campos fixos + Estatísticas
- Contas existentes: recebem os campos via backfill
- Ninguém pode apagar/editar campos `is_system`
- Usuários podem adicionar campos customizados adicionais normalmente

