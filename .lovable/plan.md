

## Limpar leads de contas internas (ti@, adm@, nicholas.barreto@)

### Situação atual
Existem 6 leads ainda vinculados a contas internas/administrativas que deveriam ter sido limpos ontem mas continuam aparecendo como adquiridos:

| Lead | Conta | Cidade/UF |
|------|-------|-----------|
| [TESTE] Lucas Almeida | Nicholas Barreto | Juazeiro do Norte/CE |
| Maristelio da cruz costa | TI | Natal/RN |
| Leonardo | TI | Joinville/SC |
| Marcos Andrade Fernandes | TI | Campo Grande/MS |
| Isaías | TI | Porto Alegre/RS |
| Bruno Araújo da Silva | TI | Campos/RJ |

### Ação
Executar uma migration SQL que:
1. Remove `claimed_by`, `claimed_at`, `lead_outcome`, `outcome_at` desses 6 leads
2. Reseta `status` para `'new'`
3. Coloca `release_status` de volta para `'queued'` (voltam para a fila de liberação)
4. Limpa `available_at` para que sejam liberados novamente pelo motor de liberação

### Detalhes técnicos

**Migration SQL:**
```sql
UPDATE public.leads
SET claimed_by = NULL,
    claimed_at = NULL,
    lead_outcome = NULL,
    outcome_at = NULL,
    status = 'new',
    release_status = 'queued',
    available_at = NULL
WHERE claimed_by IN (
  '1b58da47-d988-4f96-9847-ed2d8939505e',  -- TI Neo Folic
  '00294ac4-0194-47bc-95ef-6efb83c316f7',  -- Administrador ByNeofolic
  '9003cecf-7be7-45c7-8c53-1f4923c974f6',  -- Nicholas Barreto
  '860ae553-aa79-4e54-af98-a90dd8317c15'   -- Lucas Araujo
);
```

Nenhuma alteração de código necessária -- apenas a limpeza dos dados no banco.
