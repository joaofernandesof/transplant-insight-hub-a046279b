

# Corrigir CHECK Constraint: Adicionar `pending_confirmation` ao status

## Causa Raiz

O erro ocorre na linha de INSERT da funcao `reserveSlot()` ao tentar inserir `status: "pending_confirmation"`. A tabela `avivar_appointments` possui um CHECK constraint que so aceita:

- `scheduled`
- `confirmed`
- `cancelled`
- `completed`
- `no_show`

O valor `pending_confirmation` nao foi adicionado ao constraint quando implementamos o fluxo de 2 etapas.

## Correcao

Uma unica migracao SQL para atualizar o CHECK constraint:

```sql
ALTER TABLE avivar_appointments DROP CONSTRAINT avivar_appointments_status_check;
ALTER TABLE avivar_appointments ADD CONSTRAINT avivar_appointments_status_check
  CHECK (status = ANY (ARRAY[
    'scheduled', 'confirmed', 'cancelled', 'completed', 'no_show', 'pending_confirmation'
  ]));
```

Nenhuma mudanca de codigo e necessaria — a edge function ja esta correta, so o banco estava rejeitando o novo valor.

## Arquivos / Mudancas

| Local | Acao |
|-------|------|
| Migracao SQL (database) | Atualizar CHECK constraint para incluir `pending_confirmation` |

Apos a migracao, o `reserve_slot` vai funcionar imediatamente sem nenhuma outra alteracao.
