

# Corrigir Agendamento Prematuro: Fluxo de 2 Etapas

## Problema

A IA chama `create_appointment` **antes** do lead confirmar. Ela envia "Posso confirmar para dia X as Y?" e simultaneamente ja cria o agendamento. Se o lead responder "nao", o agendamento ja foi criado no banco e no Google Calendar.

O prompt atual (linha 3298) diz "So use create_appointment apos o lead CONFIRMAR", mas a IA ignora essa instrucao porque o modelo tende a executar tool calls junto com a resposta de texto.

## Causa Raiz

Modelos de linguagem com tool calling frequentemente executam a ferramenta no mesmo turno em que fazem a pergunta de confirmacao. Nenhuma quantidade de instrucoes no prompt vai resolver 100% — precisamos de uma **trava no codigo**.

## Solucao: Reserva Temporaria com Confirmacao

Substituir o fluxo atual (1 etapa) por um fluxo de 2 etapas com reserva temporaria:

```text
FLUXO ATUAL (problemático):
  IA oferece horario → IA chama create_appointment + pergunta "Confirma?"
  Lead diz "sim" → IA tenta criar de novo → "horario ocupado"
  Lead diz "nao" → agendamento fantasma ja criado

FLUXO NOVO (seguro):
  IA oferece horario → IA chama reserve_slot (status="pending_confirmation", expira em 10 min)
  Lead diz "sim" → IA chama confirm_reservation → status vira "scheduled"
  Lead diz "nao" → reserva expira automaticamente ou IA chama cancel_reservation
```

## Mudancas Tecnicas

### 1. Nova ferramenta: `reserve_slot` (edge function)

Cria um registro em `avivar_appointments` com `status = 'pending_confirmation'` e um campo `expires_at` (10 minutos no futuro). Isso **bloqueia o horario** para outros leads, mas nao e um agendamento definitivo.

- Horarios com status `pending_confirmation` sao tratados como ocupados pelo `check_slot` e `get_available_slots` (ja que eles consultam appointments ativos)
- Se expirar sem confirmacao, o registro e automaticamente ignorado

### 2. Nova ferramenta: `confirm_reservation` (edge function)

Recebe o ID da reserva e muda o status de `pending_confirmation` para `scheduled`. So nesse momento o agendamento e criado no Google Calendar (se integrado).

### 3. Limpeza automatica de reservas expiradas

Adicionar uma verificacao no `get_available_slots` e `check_slot` para ignorar reservas com `pending_confirmation` que ja passaram de `expires_at`. Alternativamente, um trigger no banco que limpa reservas expiradas.

### 4. Atualizar `create_appointment` existente

Manter `create_appointment` funcionando normalmente para retrocompatibilidade, mas o prompt vai instruir a IA a usar `reserve_slot` + `confirm_reservation` em vez de `create_appointment` direto.

### 5. Atualizar prompt do sistema

Reescrever a secao de confirmacao final (linhas 3297-3299) para:

```
### CONFIRMACAO FINAL (FLUXO OBRIGATORIO DE 2 ETAPAS):
1. Quando o lead aceitar um horario, use reserve_slot para RESERVAR temporariamente (10 min)
2. Apresente os detalhes e pergunte: "Posso confirmar sua avaliacao para [data] as [horario]?"
3. SOMENTE quando o lead disser "sim/confirma/pode marcar" → use confirm_reservation
4. Se o lead disser "nao" ou nao responder em 10 min → a reserva expira sozinha
5. NUNCA use create_appointment diretamente — sempre passe por reserve_slot primeiro
```

### 6. Atualizar regra pos-agendamento

Ajustar as instrucoes para que a movimentacao para "agendado" aconteca apos `confirm_reservation`, nao apos `reserve_slot`.

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/avivar-ai-agent/index.ts` | Adicionar funcoes `reserveSlot()` e `confirmReservation()`, novas tool definitions, atualizar prompt e logica de tool handling |
| `src/pages/avivar/config/hooks/usePromptGenerator.ts` | Atualizar instrucoes de agendamento no prompt gerado pelo configurador |

## Vantagens

- **Impossivel** criar agendamento fantasma — so confirma com acao explicita do lead
- Reserva garante que o horario nao seja dado a outro lead enquanto espera confirmacao
- Expiracao automatica limpa reservas abandonadas
- Retrocompativel — `create_appointment` continua funcionando para casos manuais

