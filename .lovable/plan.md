

# Plano: Contexto Persistente para Conversas Retomadas

## Problema Identificado

Após investigar os dados do banco, confirmo que:
- O lead **nao foi duplicado** -- `Lucas Araujo` (L40406) existe uma unica vez, com 67 mensagens, na mesma conta
- A troca de instancia **nao causou perda de dados** porque ambas pertencem ao mesmo `account_id`
- O problema real: a IA encerrou o atendimento com "Ate logo!" e quando o lead mandou "Oi" novamente, a IA **tratou como novo atendimento** porque nao tem mecanismo de resumo do historico anterior

Alem disso, existe um risco futuro real: se o usuario Avivar trocar de numero e isso mudar o `user_id` para um `account_id` diferente, todos os leads ficam orfaos.

## Solucao em 2 Partes

### Parte 1: Resumo Persistente na Conversa (evita reinicio do zero)

Adicionar um campo `context_summary` na tabela `crm_conversations` que armazena um resumo automatico do estado atual do lead. Esse resumo e injetado no system prompt da IA.

**Tabela**: Adicionar coluna `context_summary` (TEXT) em `crm_conversations`

**Logica no AI Agent** (`avivar-ai-agent/index.ts`):
1. Apos cada resposta da IA, gerar um resumo compacto do estado da conversa (nome, procedimento de interesse, etapa do funil, agendamentos feitos, etc.)
2. Salvar esse resumo em `crm_conversations.context_summary`
3. Ao iniciar um novo turno, injetar o resumo no system prompt como contexto inicial
4. Isso garante que mesmo que o historico seja grande (67+ msgs), a IA sempre sabe "onde parou"

**Exemplo do resumo gerado**:
```
Lead: Lucas Araujo | Telefone: 558591577299
Interesse: Transplante capilar (cabelo)
Etapa: Agendamento confirmado
Consulta: 20/02/2026 08h00 - SP (video chamada)
Email: Teste@gmail.com
Atendimento encerrado com confirmacao de consulta.
```

### Parte 2: Protecao contra troca de instancia/numero

Atualmente, a resolucao de conta segue: `instance_name` -> `user_id` -> `account_id`. Se a instancia muda de dono, os leads ficam orfaos.

**Solucao**: No webhook, quando uma nova instancia e conectada:
1. Verificar se o `user_id` da nova instancia pertence a uma conta que ja tinha outra instancia
2. Se sim, manter o vinculo automaticamente (mesmo `account_id` = mesmos leads)
3. Adicionar log de auditoria quando instancias sao trocadas

Isso ja funciona hoje para o caso atual (ambas instancias apontam para o mesmo `account_id`), mas adicionaremos validacao explicita e logging.

## Detalhes Tecnicos

### Migracao SQL
```sql
ALTER TABLE crm_conversations 
  ADD COLUMN IF NOT EXISTS context_summary TEXT;
```

### Mudancas no AI Agent (`avivar-ai-agent/index.ts`)

1. **Carregar resumo** na funcao principal, logo apos `getConversationHistory`:
   - Buscar `context_summary` de `crm_conversations` pelo `conversationId`
   - Se existir, prepend no array de mensagens como mensagem de sistema

2. **Gerar e salvar resumo** apos a resposta da IA:
   - Usar o proprio modelo (Gemini Flash) para gerar um resumo de 3-5 linhas
   - Atualizar `crm_conversations.context_summary`

3. **Injecao no prompt**: Adicionar secao no system prompt:
   ```
   ## CONTEXTO ANTERIOR DA CONVERSA
   {context_summary}
   IMPORTANTE: Esta conversa ja esta em andamento. NAO se apresente novamente.
   Continue de onde parou.
   ```

### Mudancas no Webhook (`uazapi-webhook/index.ts`)

Nenhuma mudanca necessaria -- a resolucao `instance_name` -> `user_id` -> `account_id` ja funciona corretamente para trocas dentro da mesma conta.

## Resultado Esperado

- Quando o lead mandar "Oi" apos um atendimento encerrado, a IA vai saber que ja conversou, que ja agendou consulta, e vai retomar de forma natural (ex: "Ola Lucas! Tudo bem? Sua consulta esta confirmada para amanha as 08h00. Posso ajudar com mais alguma coisa?")
- Trocas de instancia/numero dentro da mesma conta continuam funcionando sem perda de dados
