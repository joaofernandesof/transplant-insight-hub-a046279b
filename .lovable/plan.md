
# Fix: Lembretes do Avivar enviados no horário errado e duplicados

## Problemas Identificados

**1. Mensagens duplicadas** — Existem **3 triggers** na tabela `avivar_appointments` que chamam a mesma função `generate_reminders_for_appointment()`:
- `trg_generate_reminders_on_insert` (INSERT)
- `trg_generate_reminders_on_update` (UPDATE)
- `generate_reminders_on_appointment` (INSERT OR UPDATE)

No INSERT, a função dispara **2 vezes** (trigger 1 + trigger 3). No UPDATE, também 2 vezes (trigger 2 + trigger 3). Confirmado nos dados: cada regra gerou 2 lembretes idênticos.

**2. Horário errado (timezone)** — A função calcula o horário assim:
```sql
v_appointment_datetime := (appointment_date || ' ' || start_time)::TIMESTAMP WITH TIME ZONE;
```
O servidor Supabase roda em UTC. Um agendamento às 12:00 em Fortaleza (UTC-3) é interpretado como 12:00 UTC, resultando em lembretes 3 horas adiantados.

## Plano de Correção

### 1. Migration SQL: Remover triggers duplicados e corrigir timezone

- **DROP** os dois triggers antigos (`trg_generate_reminders_on_insert` e `trg_generate_reminders_on_update`), mantendo apenas `generate_reminders_on_appointment`
- **Atualizar** a função `generate_reminders_for_appointment()` para:
  - Buscar o timezone da conta via `avivar_schedule_config` (fallback: `America/Sao_Paulo`)
  - Calcular `v_appointment_datetime` com timezone correto: `(date || ' ' || time)::TIMESTAMP AT TIME ZONE v_timezone`
  - Adicionar check de unicidade antes do INSERT: `NOT EXISTS (SELECT 1 FROM avivar_appointment_reminders WHERE appointment_id = NEW.id AND rule_id = v_rule.id AND status = 'scheduled')`

### 2. Limpeza de dados duplicados

- Migration para deletar lembretes duplicados existentes (manter apenas 1 por combinação `appointment_id + rule_id`)

### 3. Adicionar constraint UNIQUE

- Criar unique index em `(appointment_id, rule_id)` com filtro `WHERE status IN ('scheduled', 'processing')` para prevenir futuros duplicados

## Detalhes Técnicos

A função corrigida ficará assim (parte chave):

```sql
-- Buscar timezone da conta
SELECT COALESCE(sc.timezone, 'America/Sao_Paulo') INTO v_timezone
FROM avivar_schedule_config sc WHERE sc.account_id = NEW.account_id LIMIT 1;

-- Interpretar data/hora no timezone correto
v_appointment_datetime := ((NEW.appointment_date || ' ' || NEW.start_time)::TIMESTAMP) 
                          AT TIME ZONE v_timezone;

-- Anti-duplicação
IF NOT EXISTS (
  SELECT 1 FROM avivar_appointment_reminders 
  WHERE appointment_id = NEW.id AND rule_id = v_rule.id 
    AND status IN ('scheduled', 'processing', 'sent')
) THEN
  INSERT INTO avivar_appointment_reminders (...) VALUES (...);
END IF;
```

Isso garante que:
- Os lembretes sejam agendados para o horário correto (ex: 11:45 no fuso do cliente)
- Nunca sejam criados duplicados para a mesma combinação agendamento + regra
