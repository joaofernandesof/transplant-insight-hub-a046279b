

## Plan: Update Ticket Form at `/neoteam/chamados`

**File:** `src/pages/neoteam/ti/TicketsPage.tsx`

### Changes

1. **Remove the category select** (Geral, Hardware, Software, Rede, Acessos, Outro) from the `TicketForm` component

2. **Add a multi-file attachment field** for photos and videos (unlimited count)
   - Accept `image/*,video/*` file types
   - Show file previews (thumbnails for images, file name for videos)
   - Allow removing individual files
   - Max 10MB per file limit

3. **Update the `createTicket` mutation** to:
   - Upload each attached file to Supabase Storage (bucket: `ticket-attachments`)
   - Store attachment URLs in a new `neoteam_ticket_attachments` table

4. **Database migration** — create a new table:
   ```sql
   CREATE TABLE public.neoteam_ticket_attachments (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     ticket_id uuid REFERENCES public.neoteam_tickets(id) ON DELETE CASCADE NOT NULL,
     file_name text NOT NULL,
     file_url text NOT NULL,
     file_type text NOT NULL,
     file_size bigint,
     created_at timestamptz DEFAULT now()
   );
   ALTER TABLE public.neoteam_ticket_attachments ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Authenticated users can manage ticket attachments"
     ON public.neoteam_ticket_attachments FOR ALL TO authenticated USING (true) WITH CHECK (true);
   ```

5. **Create storage bucket** `ticket-attachments` if not exists

6. **Set default category** to `'general'` (hardcoded) since the select is removed, so existing DB schema doesn't break

7. **Update the tickets table view** to remove the "Categoria" column and add an "Anexos" indicator column

### UI for attachments in the form
- A dashed upload area with camera/image icon
- Grid of thumbnails for selected files with remove buttons
- File count indicator

