
# Correção: Erro ao Importar Leads no Kanban Avivar

## Problema

O dialog de importação de leads (`ImportLeadsDialog`) está falhando porque o insert na tabela `avivar_kanban_leads` está **sem dois campos obrigatórios**:

1. **`account_id`** - necessário pelas políticas de segurança (RLS) do banco de dados
2. **`lead_code`** - código sequencial do lead (ex: L40456), gerado via função do banco

O dialog de adicionar lead manualmente (`AddLeadDialog`) já faz isso corretamente, mas a importação foi implementada sem esses campos.

## Solução

Alterar o arquivo `src/pages/avivar/kanban/components/ImportLeadsDialog.tsx`:

1. Importar e usar o hook `useAvivarAccount` para obter o `account_id`
2. Para cada lead importado, gerar um `lead_code` via `supabase.rpc('generate_lead_code')`
3. Incluir ambos os campos no insert

## Detalhes Técnicos

### Arquivo: `src/pages/avivar/kanban/components/ImportLeadsDialog.tsx`

**Mudancas:**
- Adicionar `import { useAvivarAccount } from '@/hooks/useAvivarAccount';`
- Chamar `const { accountId } = useAvivarAccount();` no componente
- Na `mutationFn`, antes do insert, gerar lead_codes em lote (um RPC por lead)
- Adicionar `account_id: accountId` e `lead_code` em cada objeto do insert

```text
// Pseudocodigo da mudanca no mutationFn:
const leadsToInsert = [];
for (const lead of parsedLeads) {
  const { data: leadCode } = await supabase.rpc('generate_lead_code');
  leadsToInsert.push({
    kanban_id: kanbanId,
    column_id: selectedColumnId,
    user_id: user.id,
    account_id: accountId,  // NOVO
    lead_code: leadCode,     // NOVO
    name: lead.name,
    phone: lead.phone || null,
    email: lead.email || null,
    notes: lead.notes || null,
    source: lead.source || 'Importação',
    order_index: index,
  });
}
```

### Arquivos Modificados
1. `src/pages/avivar/kanban/components/ImportLeadsDialog.tsx` - adicionar account_id e lead_code
