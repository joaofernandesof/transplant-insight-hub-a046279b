

## Correção: Não enviar lembretes cujo tempo já passou

### Problema atual

Quando um agendamento é criado e faltam menos de 24h para o evento, o lembrete de "24h antes" é criado com `scheduled_for = now()` (envio imediato). Isso acontece neste trecho do trigger:

```sql
IF v_scheduled_for <= now() THEN
  v_scheduled_for := now();  -- Envia imediatamente
END IF;
```

### Correção

Trocar a lógica para simplesmente **pular** o lembrete quando o tempo já passou, em vez de enviá-lo imediatamente. O `IF v_scheduled_for <= now()` deve resultar em um `CONTINUE` (pular para a próxima regra) em vez de reatribuir para `now()`.

```sql
-- ANTES (envia imediatamente):
IF v_scheduled_for <= now() THEN
  v_scheduled_for := now();
END IF;

-- DEPOIS (pula o lembrete):
IF v_scheduled_for <= now() THEN
  CONTINUE;  -- Não cria o lembrete, passa para a próxima regra
END IF;
```

### Arquivo a modificar

Uma migração SQL que faz `CREATE OR REPLACE FUNCTION` da função `generate_reminders_for_appointment()` com essa única alteração na lógica (linhas 47-49 da versão atual).

### Resultado

- Lembrete de 24h antes: só é criado se realmente faltam 24h+ para o evento
- Lembrete de 1h antes: só é criado se falta 1h+ para o evento
- Nenhum lembrete "atrasado" será enviado imediatamente após o agendamento

