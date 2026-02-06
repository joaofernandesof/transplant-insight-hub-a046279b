
-- ============================================================
-- ETAPA 1: Adicionar account_id nas 3 tabelas
-- ============================================================

-- leads: nullable (compartilhada com CPG)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.avivar_accounts(id);

-- crm_conversations: nullable inicialmente
ALTER TABLE public.crm_conversations 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.avivar_accounts(id);

-- crm_messages: nullable inicialmente
ALTER TABLE public.crm_messages 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.avivar_accounts(id);

-- ============================================================
-- ETAPA 2: Migrar dados existentes
-- ============================================================

-- Leads que têm match no kanban (via phone) -> pegar account_id do kanban
UPDATE public.leads l
SET account_id = akl.account_id
FROM public.avivar_kanban_leads akl
WHERE akl.phone = l.phone
  AND l.account_id IS NULL
  AND akl.account_id IS NOT NULL;

-- Leads restantes com claimed_by que são membros Avivar -> pegar account_id do membro
UPDATE public.leads l
SET account_id = am.account_id
FROM public.avivar_account_members am
WHERE am.user_id = l.claimed_by
  AND am.is_active = true
  AND l.account_id IS NULL;

-- crm_conversations: resolver via lead vinculado
UPDATE public.crm_conversations c
SET account_id = l.account_id
FROM public.leads l
WHERE l.id = c.lead_id
  AND l.account_id IS NOT NULL
  AND c.account_id IS NULL;

-- crm_messages: resolver via conversa vinculada
UPDATE public.crm_messages m
SET account_id = c.account_id
FROM public.crm_conversations c
WHERE c.id = m.conversation_id
  AND c.account_id IS NOT NULL
  AND m.account_id IS NULL;

-- ============================================================
-- ETAPA 3: NOT NULL (crm_conversations e crm_messages) + indices
-- ============================================================

-- Para conversations/messages sem account_id (orfãos), atribuir ao super admin account
UPDATE public.crm_conversations SET account_id = 'a0000001-0000-0000-0000-000000000001' WHERE account_id IS NULL;
UPDATE public.crm_messages SET account_id = 'a0000001-0000-0000-0000-000000000001' WHERE account_id IS NULL;

ALTER TABLE public.crm_conversations ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.crm_messages ALTER COLUMN account_id SET NOT NULL;

-- Indices de performance
CREATE INDEX IF NOT EXISTS idx_leads_account_id ON public.leads(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversations_account_id ON public.crm_conversations(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_account_id ON public.crm_messages(account_id);

-- ============================================================
-- ETAPA 4: Substituir RLS policies
-- ============================================================

-- === crm_conversations ===
DROP POLICY IF EXISTS "Users can view all conversations" ON public.crm_conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.crm_conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.crm_conversations;
DROP POLICY IF EXISTS "Admins can delete conversations" ON public.crm_conversations;

CREATE POLICY "sa_all_crm_conversations" ON public.crm_conversations
FOR ALL USING (public.is_avivar_super_admin(auth.uid()));

CREATE POLICY "acct_select_crm_conversations" ON public.crm_conversations
FOR SELECT USING (account_id = public.get_user_avivar_account_id(auth.uid()));

CREATE POLICY "acct_insert_crm_conversations" ON public.crm_conversations
FOR INSERT WITH CHECK (account_id = public.get_user_avivar_account_id(auth.uid()));

CREATE POLICY "acct_update_crm_conversations" ON public.crm_conversations
FOR UPDATE USING (account_id = public.get_user_avivar_account_id(auth.uid()));

CREATE POLICY "acct_delete_crm_conversations" ON public.crm_conversations
FOR DELETE USING (account_id = public.get_user_avivar_account_id(auth.uid()));

-- === crm_messages ===
DROP POLICY IF EXISTS "Users can view all messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.crm_messages;

CREATE POLICY "sa_all_crm_messages" ON public.crm_messages
FOR ALL USING (public.is_avivar_super_admin(auth.uid()));

CREATE POLICY "acct_select_crm_messages" ON public.crm_messages
FOR SELECT USING (account_id = public.get_user_avivar_account_id(auth.uid()));

CREATE POLICY "acct_insert_crm_messages" ON public.crm_messages
FOR INSERT WITH CHECK (account_id = public.get_user_avivar_account_id(auth.uid()));

CREATE POLICY "acct_update_crm_messages" ON public.crm_messages
FOR UPDATE USING (account_id = public.get_user_avivar_account_id(auth.uid()));

CREATE POLICY "acct_delete_crm_messages" ON public.crm_messages
FOR DELETE USING (account_id = public.get_user_avivar_account_id(auth.uid()));

-- === leads (manter policies CPG + adicionar isolamento Avivar) ===
-- Dropar policies existentes
DROP POLICY IF EXISTS "Authenticated users can view available and own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view available and owned leads" ON public.leads;
DROP POLICY IF EXISTS "Users can claim available leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their claimed leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

-- Super Admin Avivar: acesso total
CREATE POLICY "sa_all_leads" ON public.leads
FOR ALL USING (public.is_avivar_super_admin(auth.uid()));

-- Avivar tenant isolation: leads COM account_id
CREATE POLICY "avivar_acct_select_leads" ON public.leads
FOR SELECT USING (
  account_id IS NOT NULL 
  AND account_id = public.get_user_avivar_account_id(auth.uid())
);

CREATE POLICY "avivar_acct_insert_leads" ON public.leads
FOR INSERT WITH CHECK (
  account_id IS NOT NULL 
  AND account_id = public.get_user_avivar_account_id(auth.uid())
);

CREATE POLICY "avivar_acct_update_leads" ON public.leads
FOR UPDATE USING (
  account_id IS NOT NULL 
  AND account_id = public.get_user_avivar_account_id(auth.uid())
);

CREATE POLICY "avivar_acct_delete_leads" ON public.leads
FOR DELETE USING (
  account_id IS NOT NULL 
  AND account_id = public.get_user_avivar_account_id(auth.uid())
);

-- CPG: leads SEM account_id (marketplace original)
CREATE POLICY "cpg_select_leads" ON public.leads
FOR SELECT USING (
  account_id IS NULL
  AND (
    is_neohub_admin(auth.uid())
    OR has_staff_role(auth.uid(), 'admin'::clinic_staff_role)
    OR has_staff_role(auth.uid(), 'gestao'::clinic_staff_role)
    OR has_staff_role(auth.uid(), 'comercial'::clinic_staff_role)
    OR claimed_by IS NULL
    OR claimed_by = auth.uid()
  )
);

CREATE POLICY "cpg_update_claim_leads" ON public.leads
FOR UPDATE USING (
  account_id IS NULL
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR claimed_by = auth.uid()
    OR (claimed_by IS NULL AND status = 'new')
  )
);

CREATE POLICY "cpg_insert_leads" ON public.leads
FOR INSERT WITH CHECK (
  account_id IS NULL
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "cpg_delete_leads" ON public.leads
FOR DELETE USING (
  account_id IS NULL
  AND has_role(auth.uid(), 'admin'::app_role)
);
