

# Plano: Liberar Portal Avivar e Duplicar Configurações da Karine para Humberto

## Situação Atual

**Humberto** (`ac421565-5144-461c-ae80-38482ba6f89a`) já tem:
- Portal Avivar no `allowed_portals` ✅
- Perfil `cliente_avivar` ✅
- Conta Avivar com kanbans e colunas ✅
- 1 agente de IA ("Iza") ✅
- 5 regras de follow-up ✅
- 5 checklists de coluna ✅

**Falta em relação à Karine** (`b0317d67-fda3-46dd-8dbc-c69bf3821938`):
- ❌ Coluna "Atendimento Humano" no kanban Comercial (Karine tem na posição 1, Humberto não)
- ❌ Entrada em `user_portal_roles` (Karine tem portal_id + role_id)
- ❌ Automações (Karine tem 2: "Notifica Humano" com webhook e "Criar tarefa")

## O que será feito

### 1. Adicionar coluna "Atendimento Humano" ao Kanban Comercial
- Inserir coluna na posição 1 do kanban `05736918-acf2-46f2-ba8f-c463880fae42`
- Reindexar as colunas existentes (Triagem → 2, Tentando Agendar → 3, etc.)
- Usar mesma cor da Karine: `from-gray-500 to-gray-600`
- Copiar o `ai_instruction` da Karine

### 2. Adicionar `user_portal_roles`
- Inserir registro com o mesmo `portal_id` e `role_id` da Karine:
  - portal_id: `f6d9742b-84b1-4cad-8c76-2024c269aed8`
  - role_id: `cc8396d4-7e3f-468b-b38a-9e7cc8657e43`

### 3. Criar automações idênticas às da Karine
- **"Notifica Humano"**: trigger `lead.moved_to` na coluna "Atendimento Humano" → ação `dispatch_webhook` (mesmo webhook)
- **"Criar tarefa"**: trigger `lead.moved_to` na coluna "Atendimento Humano" → ação `create_task`
- Os `column_id` serão mapeados para os IDs da conta do Humberto

### Nota
As configurações do agente de IA, follow-up rules e checklists já existem na conta do Humberto — esses itens não serão duplicados.

