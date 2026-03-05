

# Fix: Variáveis de checklist não resolvidas nos lembretes

## Problema Raiz

**Timing**: O agendamento é criado **antes** dos campos de checklist serem preenchidos. No caso do Lucas:
- Agendamento criado: **21:43**
- Custom fields preenchidos: **23:18** (1h35 depois)

A trigger `generate_reminders_for_appointment` tenta resolver `{{checklist.*}}` no momento do INSERT, quando `custom_fields` ainda está vazio. O fallback `regexp_replace` remove os placeholders não resolvidos, substituindo por string vazia. Quando o edge function `avivar-process-reminders` processa o lembrete na hora de enviar, os placeholders já foram eliminados da mensagem.

## Solução

**Não resolver checklist na trigger. Resolver apenas no momento do envio (edge function).**

### 1. Migration SQL: Remover resolução de checklist da trigger

Atualizar `generate_reminders_for_appointment()` para:
- **Manter** a resolução de variáveis simples (`{{nome}}`, `{{data}}`, `{{hora}}`, etc.) — estes vêm do próprio appointment e estão disponíveis no INSERT
- **Remover** o bloco que resolve `{{checklist.*}}` e o `regexp_replace` que limpa placeholders não resolvidos
- Os placeholders `{{checklist.*}}` serão preservados na coluna `message` para resolução posterior

### 2. Atualizar edge function `avivar-process-reminders`

O fallback de checklist já existe (linhas 105-134), mas precisa de ajustes:
- Além de buscar por `patient_phone`, também buscar por `lead_id` diretamente na `avivar_kanban_leads` (o lead_id está disponível no reminder)
- Garantir que a busca use `account_id` do reminder para escopo correto
- Manter a limpeza de placeholders não resolvidos (`regexp_replace`) apenas aqui, no momento do envio

### 3. Recalcular mensagens de lembretes pendentes

Uma query de update para corrigir lembretes que já estão `scheduled` com mensagens sem os valores de checklist: re-aplicar o template original da regra e resolver as variáveis do appointment, deixando `{{checklist.*}}` intactos para resolução no envio.

## Impacto

- Variáveis simples (`{{nome}}`, `{{data}}`) continuam sendo resolvidas imediatamente (eficiente)
- Variáveis de checklist (`{{checklist.data_e_hora}}`) são resolvidas no momento do envio, quando os dados já existem
- Sem risco de mensagens com campos vazios

