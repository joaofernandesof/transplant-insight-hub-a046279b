

# Sistema de Lembretes Configuráveis para Agendamentos

## Visão Geral
Criar um sistema onde o usuário configura **regras de lembrete** personalizáveis (mensagem, tempo antes da consulta), e o sistema gera automaticamente os lembretes para cada agendamento com base nessas regras.

## Como Vai Funcionar

O usuário acessa uma aba "Lembretes" dentro da Agenda e configura suas regras, por exemplo:
- Lembrete 1: "7 dias antes" com mensagem X
- Lembrete 2: "48 horas antes" com mensagem Y
- Lembrete 3: "24 horas antes" com mensagem Z

Pode criar, editar, excluir e ativar/desativar cada regra quando quiser. Toda vez que um agendamento for criado, os lembretes são gerados automaticamente com base nas regras ativas.

---

## Implementação Técnica

### 1. Nova tabela: `avivar_reminder_rules`
Armazena as regras configuradas pelo usuário.

Campos:
- `id`, `account_id`, `user_id`
- `name` (ex: "Lembrete 7 dias antes")
- `time_before_minutes` (tempo em minutos antes da consulta: 10080 = 7d, 2880 = 48h, etc.)
- `time_before_type` (display: 'minutes' | 'hours' | 'days')
- `time_before_value` (display: ex: 7, 48, 24)
- `message_template` (texto com variáveis como nome, data, hora, procedimento)
- `is_active` (liga/desliga)
- `order_index` (ordem de exibição)

### 2. Nova tabela: `avivar_appointment_reminders`
Registros individuais gerados para cada agendamento.

Campos:
- `id`, `account_id`, `rule_id`, `appointment_id`, `lead_id`, `conversation_id`
- `scheduled_for` (timestamp exato de envio)
- `message` (texto final já com variáveis substituídas)
- `status` (scheduled, sent, failed, cancelled)
- `sent_at`, `error_message`

### 3. Trigger no banco de dados: `generate_reminders_for_appointment()`
- **INSERT** em `avivar_appointments` com status ativo: cria 1 registro em `avivar_appointment_reminders` para cada regra ativa
- **UPDATE** de data/hora: cancela lembretes pendentes e recria
- **UPDATE** para status `cancelled`: cancela todos os pendentes

### 4. Nova Edge Function: `avivar-process-reminders`
- Busca lembretes com `status = 'scheduled'` e `scheduled_for <= now()`
- Verifica se agendamento ainda esta ativo
- Envia via `avivar-send-message`
- Atualiza status para `sent`
- Processado via pg_cron a cada 5 minutos

### 5. Hook: `useReminderRules`
Seguindo o mesmo padrão de `useFollowupRules`:
- CRUD completo (criar, editar, excluir, ativar/desativar)
- Query por `account_id`

### 6. UI: Aba "Lembretes" dentro da Agenda
Dentro de `/avivar/agenda`, adicionar uma terceira aba ao lado de "Calendário" e "Controle":
- **Aba "Lembretes"**: lista as regras configuradas com cards (similar ao layout do Follow-up)
- Botão "Nova Regra" abre dialog para configurar:
  - Nome do lembrete
  - Tempo antes (valor + unidade: minutos/horas/dias)
  - Mensagem (com variáveis disponíveis)
  - Ativar/desativar
- Cada card mostra: nome, tempo, preview da mensagem, toggle on/off, botões editar/excluir
- Seção inferior mostrando "Próximos lembretes" (lembretes agendados pendentes)

### Arquivos a criar/modificar:
1. **Migration SQL** - tabelas, trigger, function
2. **`src/hooks/useReminderRules.ts`** - hook CRUD
3. **`src/pages/avivar/AvivarAgenda.tsx`** - adicionar aba "Lembretes"
4. **`src/pages/avivar/agenda/ReminderRuleCard.tsx`** - card de regra
5. **`src/pages/avivar/agenda/ReminderRuleDialog.tsx`** - dialog criar/editar
6. **`supabase/functions/avivar-process-reminders/index.ts`** - processador
7. **`supabase/config.toml`** - registrar nova function
8. **SQL pg_cron** - agendar execução a cada 5 minutos
