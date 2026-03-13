

# Correção: Tempo das Calls (duration_minutes)

## Problema

O campo `duration` é buscado da API do Fireflies nos 3 pontos de ingestão, mas **nunca é salvo** no campo `duration_minutes` da tabela `sales_calls`. Por isso todas as calls mostram "—" na coluna Tempo.

## Correção

### 1. `fireflies-import-selected/index.ts` (importação manual)
Na linha 174, adicionar `duration_minutes` ao insert, convertendo o valor do Fireflies (que vem em **segundos**) para minutos:
```ts
duration_minutes: transcript.duration ? Math.round(transcript.duration / 60) : null,
```

### 2. `fireflies-webhook/index.ts` (sincronização automática)
Na linha 297, mesmo ajuste no insert:
```ts
duration_minutes: transcript.duration ? Math.round(transcript.duration / 60) : null,
```

### 3. Backfill dos registros existentes
Executar uma query para atualizar as calls já importadas que têm `duration_minutes IS NULL` e `fonte_call = 'fireflies'`. Duas opções:
- **Opção A**: Script SQL que recalcula a duração com base no volume de texto da transcrição (estimativa grosseira).
- **Opção B** (recomendada): Criar uma Edge Function de backfill que re-busca o `duration` de cada transcript no Fireflies pelo `external_id` e atualiza o campo.

Como o backfill via Fireflies API requer chamadas individuais, vou implementar a **Opção B** como uma Edge Function `fireflies-backfill-duration` que pode ser chamada uma vez pelo admin.

### Arquivos modificados
- `supabase/functions/fireflies-import-selected/index.ts` — adicionar `duration_minutes`
- `supabase/functions/fireflies-webhook/index.ts` — adicionar `duration_minutes`
- **Novo**: `supabase/functions/fireflies-backfill-duration/index.ts` — backfill para calls existentes
- `src/pages/neoteam/comercial/components/FirefliesSettingsTab.tsx` — botão para disparar o backfill

