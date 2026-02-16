

## Fix: Email do lead como convidado no Google Calendar

### Problema identificado

O evento no Google Calendar esta sendo criado sem convidados (campo "Convidados" vazio) porque:

1. **O prompt da IA nao instrui a pedir o email** - O campo `patient_email` no `create_appointment` esta marcado como "opcional" e a IA so inclui se o lead informar espontaneamente
2. **O email existente no banco nao e usado como fallback** - A tabela `leads` tem um campo `email`, mas o fluxo de criacao do evento nunca consulta esse dado como alternativa
3. **O prompt nao tem instrucao para solicitar email antes de confirmar** - A secao `<fluxo_agendamento>` nao menciona a coleta de email

### Solucao (3 pontos de correcao)

#### 1. Adicionar instrucao no prompt para a IA pedir o email

Na funcao `buildHybridSystemPrompt`, adicionar uma regra na secao `<fluxo_agendamento>` instruindo a IA a solicitar o email do lead **antes de chamar `create_appointment`**, para que o convite do Google Calendar seja enviado automaticamente.

Texto a adicionar:
```
### EMAIL PARA CONVITE DO GOOGLE CALENDAR:
- ANTES de chamar create_appointment, pergunte ao lead:
  "Para que voce receba o convite com o link da reuniao no seu email, pode me informar seu email?"
- Se o lead fornecer o email, inclua no campo patient_email do create_appointment
- Se o lead nao quiser informar, prossiga sem o email (nao insista)
- Se o lead ja informou o email anteriormente na conversa, use-o sem perguntar novamente
```

#### 2. Buscar email existente do lead como fallback

Na funcao `createAppointment` (dentro de `avivar-ai-agent`), antes de chamar `createGoogleCalendarEvent`, verificar se `patientEmail` esta vazio e buscar o email do lead na tabela `leads`:

```typescript
// Fallback: buscar email do lead no banco se nao foi informado
let emailForCalendar = patientEmail;
if (!emailForCalendar && leadId) {
  const { data: leadData } = await supabase
    .from("leads")
    .select("email")
    .eq("id", leadId)
    .single();
  emailForCalendar = leadData?.email || undefined;
}
```

Isso garante que mesmo que a IA esqueca de pedir, se o lead ja tem email cadastrado, o convite sera enviado.

#### 3. Salvar email no lead quando capturado pela IA

Quando a IA capturar o email via `patient_email` no `create_appointment`, atualizar tambem o campo `email` da tabela `leads` para uso futuro:

```typescript
if (patientEmail && leadId) {
  await supabase
    .from("leads")
    .update({ email: patientEmail })
    .eq("id", leadId)
    .is("email", null); // So atualiza se nao tinha email antes
}
```

### Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/avivar-ai-agent/index.ts` | Adicionar instrucao de email no prompt, fallback de email do lead, e salvar email capturado |

### Resultado esperado

- A IA pergunta o email do lead antes de confirmar o agendamento
- O Google Calendar cria o evento COM o lead como convidado
- O lead recebe o convite automatico com link do Google Meet
- Se o lead ja tem email cadastrado, usa como fallback sem precisar perguntar

