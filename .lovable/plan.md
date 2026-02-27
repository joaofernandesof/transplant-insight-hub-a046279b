

## Priorizar liberação de leads para estados com médicos/licenciados ativos

### Problema atual
O round-robin distribui leads igualmente entre todos os 27 estados, mas apenas **8 estados** possuem licenciados ativos (AL, AP, BA, CE, GO, MA, MS, SP). Leads liberados para estados sem licenciados (AC, AM, DF, ES, MG, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, TO) ficam disponíveis sem ninguém para atendê-los.

### Solução
Modificar a função `release_random_queued_lead()` para usar **dois níveis de prioridade**:

1. **Primeiro**: Round-robin entre estados que possuem licenciados ativos (consulta dinâmica na tabela `neohub_users` + `neohub_user_profiles` onde `profile = 'licenciado'`)
2. **Segundo (fallback)**: Quando todos os estados prioritários já foram atendidos na rodada, libera dos demais estados

Isso garante que a maioria dos 80 leads/dia vai para estados onde há alguém para trabalhar, sem abandonar completamente os outros.

### Detalhes técnicos

**Migration SQL** — reescrever `release_random_queued_lead()`:

```text
Algoritmo:
1. Buscar dinamicamente os estados com licenciados ativos:
   SELECT DISTINCT n.address_state 
   FROM neohub_users n 
   JOIN neohub_user_profiles p ON p.neohub_user_id = n.id 
   WHERE p.is_active = true AND p.profile = 'licenciado'
     AND n.address_state IS NOT NULL AND n.address_state != ''

2. No loop de seleção de estado, adicionar flag de prioridade:
   ORDER BY 
     CASE WHEN q.state IN (estados_ativos) THEN 0 ELSE 1 END ASC,  -- Prioriza estados com licenciados
     COALESCE(d.released_count, 0) ASC,  -- Round-robin dentro do grupo
     random()  -- Desempate

3. v_priority_used registra 'licensee_state' ou 'non_licensee_state'
```

A consulta de estados ativos é dinâmica — quando um novo licenciado for adicionado em um novo estado, ele automaticamente entra na prioridade sem precisar alterar a função.

### Resultado esperado
- ~90% dos leads liberados irão para AL, AP, BA, CE, GO, MA, MS, SP (onde há licenciados)
- Estados sem licenciados só recebem leads quando os prioritários já foram atendidos na rodada
- Distribuição continua sendo round-robin dentro de cada grupo (sem repetir estado antes de passar por todos)

### Arquivos alterados
- 1 migration SQL (reescrita da função `release_random_queued_lead`)
- Nenhuma alteração de código frontend
