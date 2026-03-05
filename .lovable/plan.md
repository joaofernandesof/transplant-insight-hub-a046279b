

# Diagnóstico: Por que edições no fluxo não refletem completamente no comportamento da IA

## Problema identificado

Existem **duas fontes de instruções conflitantes** no sistema:

### 1. Backend (`buildFluxoInstructions`) — DINÂMICO ✅
A função em `avivar-ai-agent/index.ts` (linha 4017) lê corretamente o `fluxo_atendimento` salvo no banco e gera instruções dinâmicas baseadas nos passos configurados pelo usuário. Isso funciona bem.

### 2. Backend (`buildHybridSystemPrompt`) — HARDCODED ❌
O prompt do sistema (linhas 3740-3968) contém **instruções fixas** que conflitam com o fluxo configurado:

- **Linha 3741**: `getDefaultObjectiveForStage(leadStage)` — gera um objetivo padrão que pode dizer "qualifique o lead e entenda suas necessidades"
- **Linha 3744**: `getDefaultInstructions()` (linhas 4006-4013) — lista 7 instruções fixas incluindo "Qualifique o lead", "Use search_knowledge_base", etc., independente do que o usuário configurou
- **Linhas 3840-3854**: Seção `<regras_importantes>` com "LEIA O HISTÓRICO", "Pergunte o nome" implícito via "trate a conversa como contínua"
- **Linhas 3864-3935**: Seção `<fluxo_agendamento>` com regras fixas de agendamento, independente de o fluxo do usuário ter ou não agendamento

O resultado: mesmo que o usuário delete o passo "perguntar nome" do fluxo, as instruções hardcoded em `<suas_instrucoes>` e `<regras_importantes>` ainda dizem à IA para qualificar, perguntar dados, etc. A IA prioriza essas regras genéricas sobre o fluxo dinâmico.

### 3. Frontend Preview (`usePromptGenerator.ts`) — TOTALMENTE HARDCODED ❌
O preview do prompt (linhas 160-178) tem um fluxo fixo de 5 passos que **ignora completamente** `config.fluxoAtendimento`. Isso é menos grave pois é só visual, mas confunde o usuário que vê um prompt diferente do que roda no backend.

## Solução proposta

### Alteração 1: Backend — Tornar instruções condicionais ao fluxo

Em `supabase/functions/avivar-ai-agent/index.ts`:

- **`getDefaultInstructions()`** (linhas 4006-4013): Tornar condicional — se o agente tem `fluxo_atendimento` com passos configurados, NÃO injetar instruções genéricas. Em vez disso, injetar: "Siga EXCLUSIVAMENTE os passos do seu fluxo de atendimento. NÃO adicione perguntas ou etapas que não estejam no fluxo."
- **`getDefaultObjectiveForStage()`** (linhas 3970-4003): Quando o agente tem `ai_objective` configurado, já usa. Mas o fallback genérico diz coisas como "qualificar o lead" que conflitam. Tornar mais neutro.
- **Seção `<fluxo_agendamento>`** (linhas 3864-3935): Injetar APENAS quando o fluxo do agente contém objetivo de agendamento.
- **Adicionar regra de fidelidade** após o `${fluxoInstructions}` (linha 3962): Uma regra explícita dizendo que o fluxo dinâmico tem PRIORIDADE ABSOLUTA sobre qualquer outra instrução genérica.

### Alteração 2: Frontend — Usar fluxo real no preview

Em `src/pages/avivar/config/hooks/usePromptGenerator.ts`:

- Substituir os passos hardcoded (linhas 160-178) por uma geração dinâmica que lê `config.fluxoAtendimento.passosCronologicos` e `config.fluxoAtendimento.passosExtras`, iterando sobre eles da mesma forma que o backend faz.

### Resultado esperado

- Quando o usuário editar/excluir um passo, tanto o prompt real (backend) quanto o preview (frontend) se reorganizam automaticamente
- As instruções genéricas não mais conflitam com o fluxo configurado
- A IA segue APENAS o que está nos passos configurados, sem "inventar" etapas extras como perguntar nome

