

## Bug: Variavel `{{checklist.link_da_call}}` nao sendo substituida nos lembretes

### Problema Identificado

O trigger `generate_reminders_for_appointment()` que gera as mensagens de lembrete substitui variaveis padrao como `{{nome}}`, `{{data}}`, `{{hora}}`, etc., mas **nao resolve variaveis de checklist** no formato `{{checklist.campo}}`. O resultado e que a mensagem e salva com o texto bruto `{{checklist.link_da_call}}` e enviada assim ao lead.

Os dados do checklist existem corretamente na coluna `custom_fields` (JSONB) da tabela `avivar_kanban_leads`, mas o trigger nunca os consulta.

### Solucao

Corrigir em dois pontos para garantir robustez:

**1. Trigger `generate_reminders_for_appointment()` (correcao principal)**
- Apos substituir as variaveis padrao (nome, data, hora, etc.), verificar se a mensagem ainda contem padroes `{{checklist.`
- Se sim, buscar os `custom_fields` do lead na tabela `avivar_kanban_leads` usando o `lead_id` do agendamento (via join com `leads.phone = avivar_kanban_leads.phone` e mesmo `account_id`)
- Iterar sobre as chaves do JSON e substituir cada `{{checklist.campo}}` pelo valor correspondente
- Remover quaisquer placeholders `{{checklist.*}}` que nao tenham valor (para nao enviar texto bruto)

**2. Edge Function `avivar-process-reminders` (fallback)**
- Antes de enviar a mensagem, verificar se ainda contem `{{checklist.`
- Se sim, buscar os `custom_fields` do `avivar_kanban_leads` vinculado ao lead do appointment
- Substituir as variaveis restantes e limpar placeholders sem valor

### Detalhes Tecnicos

**Migracao SQL - Atualizar o trigger:**

```sql
-- Dentro da funcao generate_reminders_for_appointment(), apos as substituicoes padrao:

-- Resolver variaveis {{checklist.*}}
IF v_final_message LIKE '%{{checklist.%' AND NEW.lead_id IS NOT NULL THEN
  DECLARE
    v_custom_fields JSONB;
    v_cf_key TEXT;
    v_cf_value TEXT;
  BEGIN
    SELECT akl.custom_fields INTO v_custom_fields
    FROM avivar_kanban_leads akl
    JOIN leads l ON l.phone = akl.phone AND l.account_id = akl.account_id
    WHERE l.id = NEW.lead_id
    AND akl.custom_fields IS NOT NULL
    LIMIT 1;

    IF v_custom_fields IS NOT NULL THEN
      FOR v_cf_key, v_cf_value IN 
        SELECT key, value::text FROM jsonb_each_text(v_custom_fields)
      LOOP
        v_final_message := REPLACE(v_final_message, '{{checklist.' || v_cf_key || '}}', COALESCE(v_cf_value, ''));
      END LOOP;
    END IF;

    -- Limpar placeholders restantes sem valor
    v_final_message := regexp_replace(v_final_message, '\{\{checklist\.[^}]+\}\}', '', 'g');
  END;
END IF;
```

**Edge Function - Fallback no `avivar-process-reminders/index.ts`:**

Apos a linha `let messageToSend = reminder.message;` (linha 99), adicionar logica para:
1. Verificar se `messageToSend` contem `{{checklist.`
2. Buscar `custom_fields` via join lead -> kanban_leads
3. Substituir e limpar placeholders restantes

### Arquivos Afetados
- Nova migracao SQL (recriar funcao `generate_reminders_for_appointment`)
- `supabase/functions/avivar-process-reminders/index.ts`

