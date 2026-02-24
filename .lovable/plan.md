

## Restaurar Cards Financeiros (VGV, Upgrades, Upsells, Recebidos, Saldo Devedor)

### Problema

Na reconstrucao do dashboard, os cards financeiros foram removidos. O usuario quer manter os 5 cards financeiros que existiam antes: **VGV Total**, **Upgrades**, **Upsells**, **Recebido** e **Saldo Devedor**.

### Situacao dos dados

A tabela `clinic_surgeries` atualmente so tem a coluna `vgv`. Para exibir Upgrades, Upsells, Recebido (depositos + restante) e Saldo Devedor, preciso adicionar essas colunas na tabela.

### Plano

**1. Migracao de banco de dados** -- Adicionar 5 colunas financeiras na tabela `clinic_surgeries`:
- `upgrade_value` (numeric, default 0)
- `upsell_value` (numeric, default 0)
- `deposit_paid` (numeric, default 0)
- `remaining_paid` (numeric, default 0)
- `balance_due` (numeric, default 0)

**2. Atualizar o hook `useClinicSurgeries.ts`**:
- Adicionar os 5 novos campos na interface `ClinicSurgery`
- Mapear as colunas no retorno da query

**3. Adicionar os cards financeiros no `ClinicDashboard.tsx`**:
- Calcular totais financeiros a partir dos dados filtrados (mesma logica dos KPIs operacionais)
- Inserir uma segunda linha de cards logo abaixo dos KPIs operacionais existentes, com o layout identico ao `SurgeryDashboardCards.tsx`:
  - VGV Total (verde esmeralda, icone DollarSign)
  - Upgrades (roxo, icone TrendingUp)
  - Upsells (azul, icone TrendingUp)
  - Recebido (verde, icone CheckCircle, com barra de progresso)
  - Saldo Devedor (vermelho condicional, icone Clock, borda vermelha se > 0)

### Detalhes tecnicos

**Migracao SQL:**
```sql
ALTER TABLE clinic_surgeries
  ADD COLUMN upgrade_value numeric DEFAULT 0,
  ADD COLUMN upsell_value numeric DEFAULT 0,
  ADD COLUMN deposit_paid numeric DEFAULT 0,
  ADD COLUMN remaining_paid numeric DEFAULT 0,
  ADD COLUMN balance_due numeric DEFAULT 0;
```

**Arquivos editados:**
- `src/clinic/hooks/useClinicSurgeries.ts` -- interface + mapping
- `src/clinic/pages/ClinicDashboard.tsx` -- calcular financeiros no `kpiStats` e renderizar a segunda linha de cards

Os cards financeiros serao governados pelo mesmo filtro global (periodo, D-XX, filial, busca), mantendo consistencia com os KPIs operacionais.
