

## Atualizar estados aceitos da Dra. Adriana Chami

A Dra. Adriana Chami (ID de distribuição: `cddd9dc5-39e5-4bee-8f91-7070d26818de`) atualmente tem acesso a leads de **RS** e **SC**.

### Alteração
Atualizar o campo `accepted_states` na tabela `neohair_lead_distribution` para incluir também **SP** e **RJ**:

`[RS, SC]` → `[RS, SC, SP, RJ]`

### Implementação
Uma única migration SQL:
```sql
UPDATE neohair_lead_distribution
SET accepted_states = ARRAY['RS','SC','SP','RJ']
WHERE id = 'cddd9dc5-39e5-4bee-8f91-7070d26818de';
```

Nenhuma alteração de código é necessária — a lógica existente no marketplace e na Edge Function `hotleads-acquire` já utiliza o campo `accepted_states` para filtrar e validar leads.

