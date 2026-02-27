

## Problema: IA não encontra horários disponíveis

### Causa Raiz (2 problemas)

1. **Lookup incorreto na RPC `get_available_slots_flexible`**: O agente IA passa `account_id` como `p_user_id`, mas a função SQL só busca config por `agenda_id` e depois por `user_id`. Nunca tenta buscar por `account_id`. Resultado: config não é encontrada para contas onde o `user_id` difere do `account_id`.

2. **Sem fallback quando não há config**: Quando nenhuma configuração de horário existe (como na "Medic Clinica"), a função simplesmente retorna vazio (linha 38-40: `IF v_config IS NULL THEN RETURN`). O frontend tem fallback (08:00-18:00), mas a RPC não.

### Dados confirmados no banco

| Agenda | Account | Config? |
|--------|---------|---------|
| Juazeiro | ...0001 | ✅ Sim |
| Fortaleza | ...0001 | ✅ Sim |
| São Paulo | ...0001 | ❌ Não |
| Medic Clinica | ...0002 | ❌ Não |
| São Paulo | ...0003 | ✅ Sim |

### Solução

**1. Migração SQL — Corrigir `get_available_slots_flexible`**

Duas alterações na função:

- Adicionar lookup por `account_id` antes do fallback por `user_id`:
```sql
IF v_config IS NULL THEN
  SELECT * INTO v_config FROM avivar_schedule_config 
  WHERE account_id = p_user_id  -- p_user_id is actually account_id from AI agent
  AND (agenda_id = p_agenda_id OR agenda_id IS NULL)
  ORDER BY created_at DESC LIMIT 1;
END IF;
```

- Gerar slots padrão (08:00-18:00, seg-sáb) quando `v_config IS NULL`:
```sql
IF v_config IS NULL THEN
  IF v_day_of_week BETWEEN 1 AND 6 THEN
    -- Generate default 08:00-18:00 slots
    v_current_time := '08:00'::time;
    WHILE v_current_time <= '18:00'::time LOOP
      v_slot_end := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
      RETURN QUERY SELECT v_current_time, v_slot_end,
        NOT EXISTS (SELECT 1 FROM avivar_appointments ...);
      v_current_time := v_current_time + (p_duration_minutes || ' minutes')::INTERVAL;
    END LOOP;
  END IF;
  RETURN;
END IF;
```

**2. `avivar-ai-agent/index.ts` — Nenhuma alteração necessária**

O agente já passa `accountId` para todas as funções de agenda e já resolve agendas por `account_id`. A lógica de multi-agenda (1 agenda → usa direto, múltiplas → pergunta ao lead) já está implementada via `list_agendas` + `resolveAgenda`.

### Resultado esperado

- Contas com config de horário → usa horários configurados (sem mudança)
- Contas sem config → gera horários padrão 08:00-18:00 (seg-sáb), respeitando appointments existentes
- Todas as agendas da conta ficam acessíveis ao agente IA via `list_agendas`

### Arquivos alterados
- Nova migração SQL para `get_available_slots_flexible`

