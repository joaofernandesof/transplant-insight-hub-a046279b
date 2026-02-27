

## Auto-save do Agente por Etapa

### Problema
Atualmente o agente só é salvo ao clicar "Finalizar" na última etapa. Se o usuário fechar a aba ou ocorrer um erro, perde todo o progresso.

### Solução
Criar o agente no banco assim que o usuário avança da etapa 0, e salvar progressivamente a cada clique em "Próximo".

### Mudanças no Banco

**Migration:** Permitir criação de agente em rascunho
- Alterar coluna `name` para ter default `'Novo Agente'` (atualmente NOT NULL sem default)
- Adicionar coluna `wizard_step` (integer, default 0) para rastrear progresso
- Adicionar coluna `is_draft` (boolean, default true) para distinguir rascunhos de agentes finalizados

### Mudanças no Código

**Arquivo:** `src/pages/avivar/config/AvivarSimpleWizard.tsx`

1. **Novo estado `draftAgentId`**: Armazena o ID do agente criado como rascunho.

2. **Função `createDraftAgent()`**: Chamada no primeiro `handleNext` (step 0 → 1). Cria o agente com dados mínimos (`user_id`, `account_id`, `nicho`, `subnicho`, `is_draft: true`, `wizard_step: 0`). Salva o ID retornado em `draftAgentId`.

3. **Função `autoSaveStep(stepNumber)`**: Chamada em cada `handleNext`. Faz `UPDATE` no agente com os dados relevantes da etapa que acabou de ser concluída:
   - Step 0 → nicho, subnicho
   - Step 1 → companyName, city, state, professionalName, attendantName, etc.
   - Step 2 → agentObjectives (via campo JSON)
   - Step 3 → fluxoAtendimento
   - Step 4 → knowledgeFiles (FAQ)
   - Step 5 → knowledgeFiles (documentos)
   - Step 6 → imageGallery
   - Step 7 → finalizar (is_draft = false, gerar autoConfig)

4. **Modificar `handleNext`**: Antes de avançar, chamar `autoSaveStep(currentStep)`. No step 0, chamar `createDraftAgent()` se ainda não existe rascunho.

5. **Modificar `handleComplete`**: Em vez de criar agente do zero, apenas atualizar o rascunho existente com `is_draft = false` e as configurações auto-geradas.

6. **Carregar rascunho existente**: No `useEffect` de montagem (quando não é editMode), verificar se existe um agente `is_draft = true` do usuário e carregá-lo automaticamente, restaurando o `currentStep` a partir de `wizard_step`.

7. **Filtrar rascunhos**: Na listagem de agentes (`/avivar/agents`), adicionar filtro `is_draft = false` para não exibir rascunhos.

### Fluxo do Usuário

```text
Step 0: Seleciona nicho → clica "Próximo"
  → INSERT avivar_agents (rascunho, wizard_step=0)
  → draftAgentId = novo ID

Step 1: Preenche info → clica "Próximo"  
  → UPDATE avivar_agents SET name, company_name, city... wizard_step=1

Step 2-6: Cada "Próximo" → UPDATE com dados da etapa

Step 7: Clica "Finalizar"
  → UPDATE SET is_draft=false, auto-config gerado
  → Navega para /avivar/agents
```

### Arquivo adicional a verificar

Listar agentes: precisa filtrar `is_draft = false` na query de listagem para não mostrar rascunhos incompletos.

