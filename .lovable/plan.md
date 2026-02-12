

## Plano: Email do lead no agendamento + convite no Google Calendar

### Objetivo
Permitir que, ao configurar o fluxo de atendimento do agente, o usuario instrua a IA a pedir o email do lead. A IA usara esse email para:
1. Salvar no agendamento (`patient_email`)
2. Adicionar o lead como **participante (attendee)** no evento do Google Calendar, fazendo com que ele receba o convite automaticamente

### O que ja existe
- A tabela `avivar_appointments` ja possui a coluna `patient_email`
- A funcao `createGoogleCalendarEvent` ja cria eventos no Google Calendar
- A tool `create_appointment` aceita parametros do agente, mas **nao inclui `patient_email`**

---

### Mudancas necessarias

#### 1. Tool definition: adicionar `patient_email` ao `create_appointment`
No arquivo `supabase/functions/avivar-ai-agent/index.ts`, adicionar o parametro opcional `patient_email` na definicao da ferramenta `create_appointment` (linhas ~416-446).

#### 2. Funcao `createAppointment`: aceitar e salvar `patient_email`
- Adicionar parametro `patientEmail?: string` na assinatura da funcao
- Incluir `patient_email: patientEmail || null` no `insert` do agendamento (~linha 1252)
- Passar o email para `createGoogleCalendarEvent`

#### 3. Funcao `createGoogleCalendarEvent`: adicionar attendee
- Adicionar parametro `attendeeEmail?: string`
- Se o email existir, incluir `attendees: [{ email: attendeeEmail }]` no corpo do evento enviado a API do Google Calendar
- Isso faz o Google enviar automaticamente um convite ao lead

#### 4. Chamada da tool (`case "create_appointment"`): passar o email
Na secao de dispatch (~linha 2733), passar `toolArgs.patient_email` como novo argumento.

#### 5. Tool `propose_slot`: tambem aceitar email (opcional)
Para consistencia, adicionar `patient_email` ao `propose_slot` para que a IA possa coletar o email antes da confirmacao.

---

### Detalhes tecnicos

```text
Fluxo atualizado:

Lead informa email
       |
       v
IA chama propose_slot (com email)
       |
       v
Lead confirma "Sim"
       |
       v
IA chama create_appointment(patient_email="lead@email.com")
       |
       v
createAppointment()
  ├── INSERT avivar_appointments (patient_email preenchido)
  └── createGoogleCalendarEvent(attendeeEmail="lead@email.com")
         └── Google API recebe { attendees: [{ email }] }
               └── Google envia convite automatico ao lead
```

### Arquivos modificados
- `supabase/functions/avivar-ai-agent/index.ts` (unico arquivo, 5 pontos de edicao)

### Nenhuma migracao necessaria
A coluna `patient_email` ja existe na tabela `avivar_appointments`.

