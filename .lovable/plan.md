

# Fix: Notificações de Lead Movido não funcionam

## Problema identificado

A tabela `avivar_kanban_leads` está com **replica identity = DEFAULT** (apenas primary key). Isso significa que quando o Supabase Realtime envia um evento UPDATE, o campo `payload.old` contém **apenas o `id`** — sem `column_id`.

No código atual (linha 224):
```typescript
if (!oldRec?.column_id || oldRec.column_id === newRec.column_id) return;
```

Como `oldRec.column_id` é sempre `undefined`, a condição `!oldRec?.column_id` é sempre `true`, e a notificação **nunca dispara**.

## Solução

1. **Alterar replica identity para FULL** na tabela `avivar_kanban_leads` via migration:
   ```sql
   ALTER TABLE public.avivar_kanban_leads REPLICA IDENTITY FULL;
   ```
   Isso faz o Realtime enviar todos os campos no `old` record, permitindo detectar a mudança de `column_id`.

2. **Nenhuma alteração de código necessária** — a lógica do hook já está correta, apenas precisa dos dados completos do `old` record.

## Impacto

- Corrige notificações de "Lead Movido de Etapa" (som + toast + browser notification)
- Não afeta outras funcionalidades
- A tabela já está no `supabase_realtime` publication

