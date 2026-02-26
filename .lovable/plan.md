

## Plano: Controle de nichos por conta Avivar

### Problema
Hoje `BLOCKED_NICHOS` é uma constante hardcoded global — bloqueia as mesmas categorias para todos os usuários. Precisamos de controle por conta.

### Solução

**1. Adicionar coluna `allowed_nichos` na tabela `avivar_accounts`**
- Tipo: `text[]` (array de NichoType)
- Default: `['saude']` (comportamento atual — apenas saúde liberado)
- Para a conta da Karine (`karine-mendes`): setar `['imobiliario']`

**2. Criar hook `useAccountNichos`**
- Busca `allowed_nichos` da conta do usuário logado via `useAvivarAccount`
- Retorna lista de nichos permitidos e função `isNichoBlocked()`

**3. Atualizar `StepSelectBusiness.tsx`**
- Substituir referência ao `BLOCKED_NICHOS` hardcoded pelo hook `useAccountNichos`
- Um nicho é bloqueado se NÃO está na lista `allowed_nichos` da conta
- Manter visual atual (badge "EM BREVE" + opacidade) para bloqueados

**4. Atualizar `StepTemplate.tsx`** (se usado)
- Mesma lógica de bloqueio dinâmico

### Dados a inserir
```sql
-- Conta Karine: liberar apenas imobiliário
UPDATE avivar_accounts 
SET allowed_nichos = ARRAY['imobiliario']
WHERE slug = 'karine-mendes';

-- Contas existentes: manter saúde liberado (default)
```

### Impacto
- Zero mudança para usuários existentes (default = `['saude']`)
- Karine verá apenas "Imobiliário" desbloqueado
- Futuro: admin pode controlar nichos por conta sem alterar código

