

## Corrigir "Visão do Licenciado" no Dashboard HotLeads

### Problema Identificado

Na `HotLeadsAdminDashboard`, ao selecionar um licenciado, os dados são buscados nas linhas 54-56 com `supabase.from('leads').select('*')` **sem paginação**. O Supabase tem um limite padrão de 1000 linhas por query. A query `allRes` (todos os leads adquiridos) provavelmente retorna milhares de registros, mas é truncada em 1000 — causando:

- Estatísticas incorretas (conversão, ranking, comparativo com a rede)
- Dados incompletos no `LicenseeDashboard`
- Possivelmente dropdown vazio se `useAllLeadStats` também falhar silenciosamente

Além disso, não há tratamento de erro — se qualquer query falhar, os dados ficam vazios sem feedback ao usuário.

### Plano

**Arquivo**: `src/components/hotleads/HotLeadsAdminDashboard.tsx` (linhas 49-63)

1. **Paginar as queries de leads do licenciado** — Implementar loop de paginação (como já feito no drill-down, linhas 84-146) para ambas as queries (`myRes` e `allRes`), buscando em páginas de 1000 até esgotar.

2. **Adicionar tratamento de erro** — Wrap com try/catch e mostrar toast de erro se falhar.

3. **Adicionar log de debug** — Console.log na quantidade de licensees carregados para diagnóstico.

**Arquivo**: `src/hooks/useAllLeadStats.ts` (linhas 36-108)

4. **Adicionar tratamento de erro no fetchAll** — Wrap com try/catch para que falhas no RPC ou queries não deixem `isLoading` preso em `true` eternamente ou `topLicensees` vazio silenciosamente.

