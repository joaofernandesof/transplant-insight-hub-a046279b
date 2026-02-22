
## Otimizar Queue Processor: Sob Demanda + Safety Net a cada 60s

### Situacao Atual
- O `pg_cron` dispara o `avivar-queue-processor` a cada **10 segundos** (8.640 invocacoes/dia)
- O `avivar-debounce-processor` **ja faz invocacao sob demanda** (linha 294-305) -- ou seja, quando um job e enfileirado, ele ja chama o queue processor imediatamente
- A maioria das invocacoes do cron sao desnecessarias (fila vazia)

### O que sera feito
Apenas **uma mudanca**: alterar o intervalo do `pg_cron` de 10s para 60s.

Isso reduz as invocacoes de **8.640/dia para 1.440/dia** (reducao de 83%), mantendo:
- **Resposta rapida**: O debounce-processor ja chama o queue-processor assim que enfileira um job (sob demanda)
- **Safety net**: O cron a cada 60s garante que jobs "perdidos" ou que falharam no trigger sob demanda sejam processados em ate 1 minuto

### Impacto
- **Custo Cloud**: reducao significativa nas invocacoes de Edge Functions
- **Latencia para o lead**: zero impacto, pois a invocacao sob demanda ja existe
- **Confiabilidade**: jobs que por algum motivo nao foram pegos pelo trigger sob demanda serao capturados em ate 60s pelo cron

### Detalhes Tecnicos

Executar SQL para atualizar o job existente do `cron`:

```text
-- Remover o cron atual (10s)
SELECT cron.unschedule('avivar-queue-processor-poll');

-- Criar novo cron a cada 60s (1 minuto)
SELECT cron.schedule(
  'avivar-queue-processor-poll',
  '* * * * *',   -- a cada 1 minuto (minimo do pg_cron padrao)
  $$
  SELECT net.http_post(
    url := '...functions/v1/avivar-queue-processor',
    headers := '...'::jsonb,
    body := '{"max_jobs": 5}'::jsonb
  ) AS request_id;
  $$
);
```

Nenhuma alteracao de codigo nas Edge Functions e necessaria -- o mecanismo sob demanda ja esta implementado no `avivar-debounce-processor`.
