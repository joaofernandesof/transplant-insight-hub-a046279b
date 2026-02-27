

## Tornar instrução de email condicional por conta

### Problema
A seção `EMAIL PARA CONVITE DO GOOGLE CALENDAR (REGRA OBRIGATÓRIA)` está hardcoded no prompt de TODOS os agentes. Deve aparecer apenas para contas que têm Google Calendar configurado (como `ti@neofolic.com.br`).

### Solução

**Arquivo: `supabase/functions/avivar-ai-agent/index.ts`**

1. Antes de montar o prompt, consultar se a conta tem alguma agenda com `google_calendar_id` configurado:
```typescript
const { data: agendasWithCalendar } = await supabaseAdmin
  .from('avivar_agendas')
  .select('google_calendar_id')
  .eq('account_id', accountId)
  .not('google_calendar_id', 'is', null)
  .limit(1);
const hasGoogleCalendar = agendasWithCalendar && agendasWithCalendar.length > 0;
```

2. Envolver as linhas 3700-3706 com condicional:
```typescript
${hasGoogleCalendar ? `
### EMAIL PARA CONVITE DO GOOGLE CALENDAR (REGRA OBRIGATÓRIA):
- ANTES de chamar create_appointment, pergunte ao lead:
  "Para que voce receba o convite com o link da reuniao no seu email, pode me informar seu email?"
- Se o lead fornecer o email, inclua no campo patient_email do create_appointment E do propose_slot
- Se o lead nao quiser informar, prossiga sem o email (nao insista)
- Se o lead ja informou o email anteriormente na conversa, use-o sem perguntar novamente
- O email é usado para enviar automaticamente o convite do Google Calendar com link do Google Meet
` : ''}
```

### Resultado
- `ti@neofolic.com.br` (tem Google Calendar) → continua pedindo email
- `lucasaraujo.neofolic@gmail.com` e futuras contas (sem Google Calendar) → não pede email, a menos que o usuário adicione no fluxo de atendimento
- Nenhuma alteração na conta `ti@neofolic.com.br` nem `Karinnemendessg@gmail.com`

