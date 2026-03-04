

## Diagnóstico: Por que a IA oferece presencial e online juntos

### Como funciona hoje

O prompt do agente é montado em **dois lugares**:

1. **Frontend (preview)** — `usePromptGenerator.ts`: gera um prompt de visualização com a instrução fraca:
   > "Priorize atendimento presencial, mas ofereça online quando necessário"
   
2. **Backend (edge function)** — `avivar-ai-agent/index.ts` → `buildHybridSystemPrompt()`: monta o prompt real enviado à IA. Ele injeta:
   - `agent.ai_instructions` (instruções livres do agente)
   - `fluxoInstructions` (passos cronológicos + passos extras)
   - Regras de agendamento genéricas

**O problema**: Nenhum dos dois locais tem uma regra explícita dizendo "NUNCA ofereça consulta online na mesma mensagem que a presencial. Online só deve ser oferecido quando o lead recusar a presencial."

A IA vê que o agente tem objetivo principal "Agendar Consulta Presencial" e secundário "Agendar Consulta Online", e como ambos estão disponíveis, ela os apresenta juntos por padrão.

### Onde resolver

A solução deve ser implementada **internamente no prompt do backend** (edge function), não nas instruções dos passos do fluxo. Motivos:
- É uma regra de comportamento global, não específica de um passo
- Precisa ser aplicada automaticamente com base na configuração de `consultationType`
- O usuário não deveria precisar digitar essa regra manualmente

### Plano de implementação

**1. Adicionar regra de priorização no `buildHybridSystemPrompt`** (edge function)

Na função `buildHybridSystemPrompt` em `supabase/functions/avivar-ai-agent/index.ts`, após a seção `<fluxo_agendamento>`, adicionar uma nova seção `<regra_modalidade_atendimento>` que será gerada dinamicamente com base na configuração do agente:

- Carregar `consultation_type` do agente (campo já existente na tabela `avivar_agents`)
- Se `presencial=true` E `online=true`:
  ```
  <regra_modalidade_atendimento>
  REGRA OBRIGATÓRIA DE MODALIDADE:
  - SEMPRE ofereça PRIMEIRO a consulta PRESENCIAL
  - SOMENTE ofereça consulta ONLINE quando o lead:
    • Disser que não pode comparecer presencialmente
    • Informar que mora longe/em outra cidade/estado
    • Pedir explicitamente por atendimento online
  - NUNCA apresente as duas modalidades na mesma mensagem
  - Se o lead aceitar presencial, NÃO mencione a opção online
  </regra_modalidade_atendimento>
  ```
- Se apenas `online=true`: não adicionar restrição (oferecer online diretamente)
- Se apenas `presencial=true`: não adicionar restrição

**2. Carregar `consultation_type` na query do agente**

Na query que carrega o agente roteado (função que popula `RoutedAgent`), incluir o campo `consultation_type` do `avivar_agents`. Adicionar o campo à interface `RoutedAgent`.

**3. Atualizar o prompt de preview no frontend**

Em `usePromptGenerator.ts`, substituir a instrução fraca (linha 154) por uma regra mais clara e alinhada com o backend.

### Arquivos a modificar
- `supabase/functions/avivar-ai-agent/index.ts` — adicionar seção de modalidade no prompt + carregar consultation_type
- `src/pages/avivar/config/hooks/usePromptGenerator.ts` — melhorar instrução de priorização no preview

### Resposta às perguntas

- **Por que a IA oferece junto?** Porque não existe regra explícita no prompt impedindo isso. A instrução atual é apenas "priorize", o que é vago demais para a IA.
- **Onde está configurado?** O prompt é montado na edge function `avivar-ai-agent`. As instruções do fluxo (passos) são injetadas, mas a regra de priorização de modalidade não existe em nenhum lugar.
- **Devo configurar nos passos do fluxo?** Não. Vou implementar internamente no prompt do backend, aplicado automaticamente com base na sua configuração de tipo de consulta (presencial + online). Assim funciona para todos os agentes sem precisar escrever a regra manualmente.

