

# Correção: Mensagens Duplicadas no CRM + Respostas Repetidas da IA

## Problema Identificado

O webhook da UazAPI entrega o mesmo evento de mensagem múltiplas vezes (retries de rede). O sistema **não possui nenhuma verificação de duplicidade** - cada entrega cria uma nova linha na tabela `crm_messages`, o que gera:

1. Mensagem do lead aparece 3x no CRM (ex: "Não senti confiança" x3)
2. Cada duplicata dispara um novo ciclo de debounce + IA
3. A IA responde 3x com respostas longas e repetitivas

## Solução

### 1. Adicionar coluna `external_id` na tabela `crm_messages`

Criar uma migração SQL para:
- Adicionar coluna `external_id TEXT` (nullable, para mensagens manuais)
- Criar um índice UNIQUE parcial: `UNIQUE(conversation_id, external_id) WHERE external_id IS NOT NULL`
- Isso impede duplicatas no nível do banco de dados

### 2. Atualizar o webhook para usar `external_id`

No `supabase/functions/uazapi-webhook/index.ts`, na inserção de mensagens (linha ~739):
- Passar `external_id: msg.key.id` no insert
- Usar `upsert` com `onConflict: 'conversation_id,external_id'` em vez de `insert` simples
- Se a mensagem ja existir, o upsert ignora (sem duplicata)
- Se for nova, insere normalmente

### 3. Condicionar o debounce a mensagens realmente novas

Após o upsert, verificar se houve inserção real (nova mensagem) antes de disparar o debounce:
- Se o upsert retornou dados com `created_at` recente (< 2s), disparar debounce
- Se a mensagem já existia, pular o debounce completamente (evita IA duplicada)

## Detalhes Técnicos

### Migração SQL
```text
ALTER TABLE crm_messages ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_messages_external_id_unique 
  ON crm_messages(conversation_id, external_id) 
  WHERE external_id IS NOT NULL;
```

### Mudanca no webhook (pseudocodigo)
```text
// ANTES (linha 739):
const { error } = await supabase.from("crm_messages").insert({...});

// DEPOIS:
const { data: upsertResult, error } = await supabase
  .from("crm_messages")
  .upsert({
    external_id: msg.key.id,
    // ... demais campos
  }, { onConflict: 'conversation_id,external_id' })
  .select('id, created_at')
  .single();

// Verificar se e mensagem nova antes de disparar debounce
const isNewMessage = upsertResult && 
  (Date.now() - new Date(upsertResult.created_at).getTime()) < 2000;

if (!msg.key.fromMe && content && isNewMessage) {
  // Disparar debounce apenas para mensagens realmente novas
}
```

### Arquivos Modificados
1. **Nova migracão SQL** - adicionar `external_id` + indice unico
2. **`supabase/functions/uazapi-webhook/index.ts`** - usar upsert + condicionar debounce
3. **`supabase/functions/avivar-ai-agent/index.ts`** (se necessario) - nenhuma mudanca prevista

## Impacto

- Mensagens duplicadas da UazAPI serao silenciosamente ignoradas
- A IA so responde 1x por mensagem real do lead
- Zero impacto em mensagens existentes (coluna nullable)
- Compativel com mensagens manuais enviadas pelo CRM (sem external_id)
