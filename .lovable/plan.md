

## Otimizar Cron Jobs: Reduzir Invocacoes Desnecessarias

### Situacao Atual (Total: ~4,657 invocacoes/dia)

| Cron Job | Frequencia | Invoc./dia | Tipo |
|----------|-----------|------------|------|
| `avivar-queue-processor-poll` | 1 min | 1.440 | Ja otimizado (sob demanda + safety net) |
| `process-followups-cron` | 1 min | 1.440 | Polling -- pode otimizar |
| `hotleads-auto-release` | 1 min | 1.440 | Polling -- pode otimizar |
| `process-reminders-cron` | 5 min | 288 | Polling -- pode otimizar |
| `check-patient-orientations` | 30 min | 48 | OK -- baixo volume |
| `check-inactive-users-daily` | 1x/dia | 1 | OK |
| `send-weekly-reports-monday` | 1x/semana | ~0 | OK |

### Otimizacoes Propostas

#### 1. `process-followups-cron`: de 1min para 5min
- **Hoje**: roda a cada 1 minuto (1.440/dia), busca follow-ups agendados cuja `scheduled_for` ja passou
- **Problema**: follow-ups sao agendados com delay de minutos/horas. Checar a cada 1 min e excessivo
- **Proposta**: mudar para `*/5 * * * *` (cada 5 minutos)
- **Impacto**: 1.440 -> 288 invoc./dia (reducao de 80%). Latencia maxima de 5 min e aceitavel para follow-ups que ja tem delay de 30min+
- **Invocacoes economizadas**: ~1.152/dia

#### 2. `hotleads-auto-release`: de 1min para 5min
- **Hoje**: roda a cada 1 minuto para liberar leads agendados
- **Problema**: leads sao agendados para horarios especificos. Verificar a cada minuto e excessivo
- **Proposta**: mudar para `*/5 * * * *` (cada 5 minutos)
- **Impacto**: 1.440 -> 288 invoc./dia (reducao de 80%). Delay maximo de 5min na liberacao e imperceptivel
- **Invocacoes economizadas**: ~1.152/dia

#### 3. `process-reminders-cron`: de 5min para 15min
- **Hoje**: roda a cada 5 minutos para enviar lembretes de consulta
- **Problema**: lembretes sao tipicamente agendados horas antes da consulta (24h, 2h, etc). 5 min e frequente demais
- **Proposta**: mudar para `*/15 * * * *` (cada 15 minutos)
- **Impacto**: 288 -> 96 invoc./dia (reducao de 67%). Delay maximo de 15 min para lembretes agendados horas antes e aceitavel
- **Invocacoes economizadas**: ~192/dia

### Resultado Total

| Metrica | Antes | Depois | Economia |
|---------|-------|--------|----------|
| Invoc./dia (3 crons) | 3.168 | 672 | **2.496/dia (79%)** |
| Invoc./mes | ~95.040 | ~20.160 | **~74.880/mes** |

### Detalhes Tecnicos

Executar os seguintes comandos SQL:

```text
-- 1. Follow-ups: de 1min para 5min
SELECT cron.unschedule('process-followups-cron');
SELECT cron.schedule(
  'process-followups-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tubzywibnielhcjeswww.supabase.co/functions/v1/avivar-process-followups',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Ynp5d2libmllbGhjamVzd3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTMzOTUsImV4cCI6MjA4NDE2OTM5NX0.iLLwvSZ73jZTxIY7Ynz0ETVs2U0pmCwB76jwDrZmgcw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 2. Hotleads release: de 1min para 5min
SELECT cron.unschedule('hotleads-auto-release');
SELECT cron.schedule(
  'hotleads-auto-release',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tubzywibnielhcjeswww.supabase.co/functions/v1/hotleads-release',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Ynp5d2libmllbGhjamVzd3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTMzOTUsImV4cCI6MjA4NDE2OTM5NX0.iLLwvSZ73jZTxIY7Ynz0ETVs2U0pmCwB76jwDrZmgcw"}'::jsonb,
    body := '{"action": "release", "mode": "cron_auto"}'::jsonb
  ) AS request_id;
  $$
);

-- 3. Reminders: de 5min para 15min
SELECT cron.unschedule('process-reminders-cron');
SELECT cron.schedule(
  'process-reminders-cron',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tubzywibnielhcjeswww.supabase.co/functions/v1/avivar-process-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Ynp5d2libmllbGhjamVzd3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTMzOTUsImV4cCI6MjA4NDE2OTM5NX0.iLLwvSZ73jZTxIY7Ynz0ETVs2U0pmCwB76jwDrZmgcw"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

Nenhuma alteracao de codigo nas Edge Functions. Apenas ajuste de frequencia nos cron jobs.

Os 3 jobs que ja estao com frequencia adequada (`check-inactive-users-daily`, `send-weekly-reports-monday`, `check-patient-orientations`) permanecem inalterados.
