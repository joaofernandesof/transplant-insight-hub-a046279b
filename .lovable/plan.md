
# Ajustar meta diaria de HotLeads para 80

## Contexto
O valor de 50 leads/dia esta hardcoded em 3 locais e precisa ser atualizado para 80. Alem disso, o registro de hoje ja foi criado com target_count=50 e precisa ser corrigido.

## Alteracoes

### 1. Migracao SQL -- Atualizar RPC e registro de hoje
- Atualizar a funcao `release_random_queued_lead`: trocar `v_target int := 50` para `v_target int := 80`
- Atualizar a funcao `get_lead_release_info`: trocar o COALESCE default de 50 para 80
- Atualizar o registro de hoje em `lead_release_daily`: `SET target_count = 80 WHERE release_date = CURRENT_DATE`

### 2. Edge Function `hotleads-release/index.ts`
- Linha 223: trocar `daily?.target_count || 50` para `daily?.target_count || 80`
- Linha 274: trocar `daily?.target_count || 50` para `daily?.target_count || 80`

### 3. Comportamento
- Nenhuma liberacao manual sera feita agora
- O cron continuara rodando normalmente e vai distribuir os 80 leads ao longo do dia usando a logica probabilistica existente
- Como ja estamos no meio do dia com 0 liberados, a probabilidade por minuto vai subir naturalmente para compensar

## Detalhes tecnicos

```text
Locais de alteracao:
+-----------------------------------------+------------------+
| Arquivo / Funcao                        | Valor 50 -> 80   |
+-----------------------------------------+------------------+
| release_random_queued_lead (SQL RPC)    | v_target := 80   |
| get_lead_release_info (SQL RPC)         | COALESCE(..., 80) |
| hotleads-release/index.ts L223          | fallback || 80   |
| hotleads-release/index.ts L274          | fallback || 80   |
| lead_release_daily (hoje)               | target_count = 80 |
+-----------------------------------------+------------------+
```
