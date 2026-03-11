

## Plan: Ticket Assignment + Notifications for TI Team

### Current State
The `neoteam_tickets` table already has `assigned_to` (uuid) and `assigned_name` (text) columns — they're just not used in the UI.

### Changes

**1. Add "Assumir" button and "Responsável" column to the tickets table** (`src/pages/neoteam/ti/TicketsPage.tsx`)

- New table column **"Responsável"** showing the assigned person's name (or "—" if unassigned)
- **"Assumir" button** on each unassigned ticket row — clicking it sets `assigned_to = current user id` and `assigned_name = current user name`, plus changes status to `in_progress`
- If already assigned to the current user, show a "Liberar" (release) button to unassign
- If assigned to someone else, show their name (no action)

**2. Realtime notifications for new tickets** (`src/pages/neoteam/ti/TicketsPage.tsx`)

- Subscribe to `postgres_changes` on `neoteam_tickets` table for `INSERT` events
- When a new ticket arrives, show a toast notification with the ticket title and a sound cue
- Auto-refresh the tickets list

**3. Enable realtime on the table** (migration)

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.neoteam_tickets;
```

**4. Visual indicators**

- Unassigned tickets get a subtle highlight (e.g., left border orange)
- Assigned tickets show the responsible person's name with an avatar initial badge

### UI Flow

```text
┌──────────┬────────────┬───────┬───────────┬────────────┬──────┬──────────┬──────────┐
│ Nº       │ Título     │ Prior │ Solic.    │ Responsável│ 📎   │ Data     │ Status   │
├──────────┼────────────┼───────┼───────────┼────────────┼──────┼──────────┼──────────┤
│ TI-ABC   │ PC lento   │ Alta  │ João      │ [Assumir]  │ 2    │ 11/03    │ Aberto   │
│ TI-DEF   │ Email      │ Média │ Maria     │ Nicholas ✓ │ —    │ 10/03    │ Em And.  │
└──────────┴────────────┴───────┴───────────┴────────────┴──────┴──────────┴──────────┘
```

### Files Modified
- `src/pages/neoteam/ti/TicketsPage.tsx` — add Responsável column, Assumir/Liberar logic, realtime subscription
- New migration — enable realtime on `neoteam_tickets`

