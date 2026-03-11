

## Plan: Email Notification on Ticket Status Change

### Approach

Create an edge function `notify-ticket-status` that sends an email to the requester when a ticket's status changes. The ticket table currently has `requester_id` but no email column, so we need to:

1. **Add `requester_email` column** to `neoteam_tickets` so we can send emails without extra lookups
2. **Create edge function** `notify-ticket-status` that sends a styled email via Resend
3. **Call the function** from the `updateStatus` mutation in `TicketsPage.tsx`

### Database Migration

```sql
ALTER TABLE public.neoteam_tickets ADD COLUMN requester_email text;
```

### Edge Function: `notify-ticket-status`

- Receives: `ticket_number`, `title`, `requester_name`, `requester_email`, `old_status`, `new_status`, `assigned_name`
- Sends a Portuguese HTML email via Resend to the requester with:
  - Ticket number and title
  - New status (translated: open → Aberto, in_progress → Em Andamento, resolved → Resolvido, closed → Fechado)
  - Who is responsible (if assigned)
- Uses existing `RESEND_API_KEY` secret

### Frontend Changes (`TicketsPage.tsx`)

1. **Save `requester_email`** (from `user.email`) when creating tickets
2. **After status update**, invoke the edge function with ticket details to send email
3. No UI changes needed — the notification is automatic

### Status Labels in Email

| Status | Label |
|--------|-------|
| open | 📋 Aberto |
| in_progress | 🔧 Em Andamento |
| resolved | ✅ Resolvido |
| closed | 🔒 Fechado |

### Files

- New: `supabase/functions/notify-ticket-status/index.ts`
- Edit: `src/pages/neoteam/ti/TicketsPage.tsx` — store email on create, invoke function on status change
- New migration: add `requester_email` column
- Update: `supabase/config.toml` — add `[functions.notify-ticket-status]` with `verify_jwt = false`

