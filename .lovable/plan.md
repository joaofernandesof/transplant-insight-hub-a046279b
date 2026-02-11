
# Eliminar Pre-Reserva: Agendamento Apenas Apos Confirmacao do Lead

## Problema Atual

O fluxo de 2 etapas (`reserve_slot` + `confirm_reservation`) ainda cria um registro no banco de dados ANTES do lead confirmar. Na imagem, vemos que a reserva falhou ou expirou, e a IA perdeu o contexto, pedindo desculpas por "erro tecnico" e recomeçando a busca de horarios.

O comportamento desejado e simples: a IA apresenta os dados do agendamento, pergunta "Posso confirmar?", e SO cria o registro no banco quando o lead responder "sim".

## Solucao

Substituir `reserve_slot` por uma ferramenta puramente informacional (`propose_slot`) que NAO escreve nada no banco. Ela apenas valida o horario e retorna os detalhes formatados para a IA apresentar ao lead. O agendamento real so acontece via `create_appointment` ou `confirm_reservation` apos o lead confirmar.

```text
FLUXO NOVO (sem pre-reserva):
  IA verifica horarios → IA chama propose_slot (SEM escrita no banco, apenas valida e formata)
  IA apresenta: "Posso confirmar para dia X as Y?"
  Lead diz "sim" → IA chama create_appointment → agendamento criado + Google Calendar
  Lead diz "nao" → nada no banco, IA busca novo horario
```

## Mudancas Tecnicas

### 1. Edge Function (`supabase/functions/avivar-ai-agent/index.ts`)

**Nova ferramenta `propose_slot`:**
- Recebe os mesmos parametros que `reserve_slot` (agenda, data, horario, paciente, tipo)
- Executa `check_slot` internamente para validar que o horario esta livre
- Retorna uma string formatada com os detalhes do agendamento (data, hora, profissional, local)
- NAO faz INSERT no banco de dados
- Retorna tambem uma instrucao interna: "AGUARDE o lead confirmar. Se 'sim', use create_appointment."

**Atualizar tool definitions:**
- Substituir `reserve_slot` por `propose_slot` na lista de ferramentas
- Manter `create_appointment` como a ferramenta de criacao real
- Remover `confirm_reservation` (nao ha mais reserva para confirmar)
- Remover `cancel_reservation` (nao ha mais reserva para cancelar)

**Atualizar Cross-Invocation Guard:**
- Remover logica de `hasPendingReservation` (nao existira mais)
- Manter apenas a verificacao de `appointmentJustCreated` para evitar re-agendamento
- Adicionar nova verificacao: detectar se a IA ja "propôs" um horario na conversa recente (via historico de mensagens, nao via banco) para manter contexto

**Atualizar `processToolCall`:**
- Adicionar case para `propose_slot` chamando a nova funcao
- Remover cases de `confirm_reservation` e `cancel_reservation`

**Regra critica no prompt:**
- `create_appointment` so pode ser chamado quando o lead responder afirmativamente
- `propose_slot` + `create_appointment` NUNCA no mesmo turno (bloqueio no codigo)

### 2. Prompt Generator (`src/pages/avivar/config/hooks/usePromptGenerator.ts`)

Atualizar secao `<regras_agendamento>` para refletir o novo fluxo:

```
### FLUXO CORRETO (OBRIGATORIO):
1. Lead aceita horario → use propose_slot (apenas valida, SEM reserva)
2. Apresente os detalhes e pergunte: "Posso confirmar?"
3. Lead diz "sim" → use create_appointment (agendamento definitivo)
4. Lead diz "nao" → busque novo horario com get_available_slots
5. NUNCA use create_appointment e propose_slot no MESMO turno
```

### 3. Bloqueio no Codigo (Tool Call Loop)

Adicionar filtro no loop de tool calls: se `propose_slot` foi chamado nesse turno, bloquear `create_appointment` no mesmo turno. Isso garante que mesmo que o modelo tente agendar junto com a proposta, o codigo impede.

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/avivar-ai-agent/index.ts` | Criar `proposeSlot()`, remover `reserveSlot()`/`confirmReservation()`/`cancelReservation()`, atualizar tools, guard e processToolCall |
| `src/pages/avivar/config/hooks/usePromptGenerator.ts` | Atualizar instrucoes de agendamento no prompt |

## Vantagens

- Zero registros fantasma no banco — nada e escrito ate o lead confirmar
- Sem expiracao de reservas — nao ha reservas para expirar
- Fluxo mais simples e robusto — menos pontos de falha
- Se o lead demorar para responder, nao perde o contexto por expiracao
