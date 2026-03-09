# Push Notifications para Avivar CRM — Visual + Sonoro

## Contexto Atual

- **Som/Browser Notifications**: Existe apenas para HotLeads (`useLeadNotificationSound.ts`) usando Web Audio API + Browser Notification API
- **Push Mobile (Capacitor)**: Hook `usePushNotifications.ts` registra tokens no `push_tokens`, mas **não há envio real** (FCM/APNs não implementado)
- **Realtime CRM**: `useCrmConversations.ts` já escuta `crm_messages` INSERT via Supabase Realtime, mas só invalida cache — sem som/notificação visual
- **Automações**: Motor `avivar-execute-automations` já suporta `dispatch_webhook`, `move_lead`, `send_message` como ações, mas **não tem ação de notificação in-app**

## O que será implementado

### 1. Hook `useAvivarCrmNotifications.ts`

Novo hook central para notificações visuais+sonoras do Avivar CRM, escutando 3 eventos via Supabase Realtime:

- **Mensagem recebida**: `crm_messages` INSERT com `direction = 'inbound'` → som + toast + browser notification
- **Lead novo**: `avivar_kanban_leads` INSERT → som + toast + browser notification  
- **Lead movido de coluna**: `avivar_kanban_leads` UPDATE (column_id alterado) → som + toast + browser notification

Cada evento terá um som distinto (frequências diferentes via Web Audio API, reaproveitando o padrão do `useLeadNotificationSound`).

### 2. Nova ação de automação: `send_notification`

Adicionar ao motor de automações existente (`avivar-execute-automations`) e ao builder UI:

- **Tipo**: `send_notification` 
- **Config**: `{ title, message, sound: boolean }`
- **Execução**: Insere na tabela `notifications` + `notification_recipients` para os membros da conta
- **UI**: Novo tipo de ação no `ACTION_TYPES` do `useAvivarAutomations.ts` e formulário no builder

### 3. Integração no layout Avivar

- Montar o hook `useAvivarCrmNotifications` dentro do `AvivarSidebar` para que funcione em qualquer página do Avivar
- Pedir permissão de Browser Notifications no primeiro acesso

## Alterações por arquivo


| Arquivo                                                        | Alteração                                                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/hooks/useAvivarCrmNotifications.ts`                       | **Novo** — hook com Realtime + Web Audio + Browser Notification para os 3 eventos            |
| `src/pages/avivar/AvivarSidebar.tsx`                           | Montar o hook para ativar notificações em todo o portal                                      |
| `src/hooks/useAvivarAutomations.ts`                            | Adicionar `send_notification` ao `ACTION_TYPES`                                              |
| `supabase/functions/avivar-execute-automations/index.ts`       | Implementar ação `send_notification` (insert em `notifications` + `notification_recipients`) |
| `src/pages/avivar/automations/AvivarAutomationBuilderPage.tsx` | Formulário de configuração da ação `send_notification` (título + mensagem + toggle som)      |


## Detalhes técnicos

**Sons distintos por evento** (Web Audio API):

- Mensagem recebida: tom duplo agudo curto (estilo WhatsApp)
- Lead novo: tríade ascendente (reaproveitando padrão HotLeads)
- Lead movido: tom único médio

**Realtime subscriptions** no hook:

```text
crm_messages         → INSERT, direction=inbound  → "Nova mensagem"
avivar_kanban_leads   → INSERT                     → "Novo lead"  
avivar_kanban_leads   → UPDATE (column_id changed) → "Lead movido"
```

**Ação de automação** `send_notification` no edge function:

- Busca membros da conta via `avivar_account_members`
- Cria `notifications` row + `notification_recipients` para cada membro
- Permite que qualquer gatilho (lead movido, mensagem, etc.) dispare notificações customizadas  


DEVE SER ALOCADO EM CONFIGURAÇÕES, PERMITINDO QUE O USUÁRIO ESCOLHA O QUE É QUE VAI SER NOTIFICADO.

&nbsp;