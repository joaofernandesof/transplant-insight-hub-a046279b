

# Correcao: IA Oferece Horarios de 30 em 30 (Ignorando Duracao Configurada)

## Problema

A agenda esta configurada com duracao de 20 minutos (gerando slots 08:00, 08:20, 08:40...), mas a IA oferece horarios como 08:30 e 13:00 -- que sao multiplos de 30 minutos e nao existem na grade real.

## Causa Raiz

No arquivo `supabase/functions/avivar-ai-agent/index.ts`, todas as 5 chamadas a funcao `get_available_slots_flexible` passam `p_duration_minutes: 30` **hardcoded**, ignorando completamente o valor real de `consultation_duration` salvo na tabela `avivar_schedule_config`.

Linhas afetadas:
- Linha 1011 (get_available_slots)
- Linha 1102 (check_slot)  
- Linha 1253 (create_appointment)
- Linha 1543 (propose_slot)
- Linha 1688 (reschedule_appointment)

## Correcao

### 1. Criar funcao auxiliar para buscar a duracao configurada

Adicionar uma funcao `getConsultationDuration` que consulta `avivar_schedule_config` para obter o `consultation_duration` real da agenda, com fallback de 30 minutos caso nenhuma configuracao exista.

```typescript
async function getConsultationDuration(
  supabase: AnySupabaseClient, 
  accountId: string, 
  agendaId: string | null
): Promise<number> {
  let query = supabase
    .from("avivar_schedule_config")
    .select("consultation_duration")
    .eq("account_id", accountId);
  
  if (agendaId) {
    query = query.eq("agenda_id", agendaId);
  } else {
    query = query.is("agenda_id", null);
  }
  
  const { data } = await query.single();
  return data?.consultation_duration || 30;
}
```

### 2. Substituir o valor hardcoded em todas as 5 chamadas

Em cada funcao que chama `get_available_slots_flexible`, buscar a duracao real antes de chamar o RPC:

```typescript
const duration = await getConsultationDuration(supabase, accountId, agendaId);

const { data: slots } = await supabase.rpc("get_available_slots_flexible", {
  p_user_id: userId,
  p_agenda_id: agendaId,
  p_date: date,
  p_duration_minutes: duration  // era: 30
});
```

**Nota**: Nas funcoes `get_available_slots` e `check_slot`, o parametro de conta se chama `userId` (que na pratica e o account_id passado pelo orquestrador). A funcao auxiliar recebera esse mesmo valor.

### 3. Tambem usar a duracao no calculo do end_time do agendamento

Na funcao `create_appointment` (linha ~1245), o calculo do horario final tambem usa 30 hardcoded. Sera atualizado para usar o valor real:

```typescript
const duration = await getConsultationDuration(supabase, accountId, agendaId);
const endMinutes = startHours * 60 + startMinutes + duration;
```

O mesmo se aplica a `reschedule_appointment`.

## Arquivo Modificado

- `supabase/functions/avivar-ai-agent/index.ts`

## Resultado Esperado

- A IA passara a usar a duracao real configurada na agenda (ex: 20 minutos)
- Os slots retornados serao 08:00, 08:20, 08:40... em vez de 08:00, 08:30, 09:00...
- A validacao snap-to-grid (ja implementada) funcionara corretamente pois os slots base estarao corretos
- Funciona automaticamente para todas as contas futuras do CRM Avivar
