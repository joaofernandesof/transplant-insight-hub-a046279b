

## Diagnostico: IA nao encontra horarios (2 bugs confirmados nos logs)

### Bug 1: Funcao duplicada no banco (CRITICO)

A migracao anterior criou uma NOVA versao de `get_available_slots_flexible` com parametros em ordem diferente, mas NAO removeu a versao antiga. Agora existem DUAS funcoes:

```text
OLD: (p_user_id uuid, p_agenda_id uuid, p_date date, p_duration_minutes integer)
NEW: (p_user_id uuid, p_date date, p_duration_minutes integer, p_agenda_id uuid)
```

Quando o AI agent chama `supabase.rpc("get_available_slots_flexible", {...})`, o PostgREST nao consegue escolher qual usar e retorna erro `PGRST203`:
```
"Could not choose the best candidate function between..."
```

Resultado: ZERO slots retornados para QUALQUER conta/agenda.

**A agenda correta "Medic Clinica" IS sendo encontrada** (log confirma: `Using fallback agenda: "Medic Clinica" (Fortaleza)`). O problema e que a consulta de slots falha DEPOIS.

A mensagem "consultei o sistema da nossa unidade em Fortaleza" e porque a agenda "Medic Clinica" tem `city = 'Fortaleza'`. NAO esta consultando agenda de outra conta.

### Bug 2: Nome formatado vs nome real (MENOR)

`list_agendas` retorna `"Medic Clinica - Fortaleza (Lucas Araujo)"`, e a IA passa esse nome completo para `resolveAgenda`. O `ilike('%Medic Clinica - Fortaleza (Lucas Araujo)%')` nao encontra match porque o nome real e so `"Medic Clinica"`. Cai no fallback que pega a primeira agenda da conta (que e a correta, ja que so tem uma).

### Solucao

**1. Migracao SQL — Dropar funcao antiga e recriar a correta**

```sql
-- Drop BOTH overloads to clean state
DROP FUNCTION IF EXISTS public.get_available_slots_flexible(uuid, uuid, date, integer);
DROP FUNCTION IF EXISTS public.get_available_slots_flexible(uuid, date, integer, uuid);

-- Recreate single version (with fallback logic from last migration)
CREATE OR REPLACE FUNCTION public.get_available_slots_flexible(...) ...
```

**2. `avivar-ai-agent/index.ts` — Melhorar resolveAgenda**

Na funcao `resolveAgenda`, antes do fallback, fazer split do nome formatado para extrair apenas o nome base:
```typescript
// "Medic Clinica - Fortaleza (Lucas Araujo)" → "Medic Clinica"  
const baseName = agendaName.split(' - ')[0].trim();
```

Tambem simplificar o formato de `list_agendas` para retornar so o nome da agenda (sem cidade/profissional concatenados) ja que `resolveAgenda` busca por nome e por cidade separadamente.

### Arquivos alterados
- Nova migracao SQL (drop duplicata + recriar funcao)
- `supabase/functions/avivar-ai-agent/index.ts` — melhorar parsing de nome em `resolveAgenda`

