
-- =====================================================
-- NEOTEAM FINANCIAL MODULE - Tables
-- =====================================================

-- 1. Contas a Pagar
CREATE TABLE public.neoteam_accounts_payable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  amount numeric(12,2) NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','vencido','cancelado')),
  supplier text,
  branch text,
  payment_method text,
  notes text,
  attachment_url text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neoteam_accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view payables"
  ON public.neoteam_accounts_payable FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can insert payables"
  ON public.neoteam_accounts_payable FOR INSERT TO authenticated
  WITH CHECK (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can update payables"
  ON public.neoteam_accounts_payable FOR UPDATE TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can delete payables"
  ON public.neoteam_accounts_payable FOR DELETE TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

-- 2. Contas a Receber
CREATE TABLE public.neoteam_accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  category text NOT NULL DEFAULT 'contrato',
  amount numeric(12,2) NOT NULL,
  due_date date NOT NULL,
  received_date date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','recebido','vencido','cancelado')),
  client_name text,
  contract_id uuid REFERENCES public.clinic_contracts(id),
  branch text,
  payment_method text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neoteam_accounts_receivable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view receivables"
  ON public.neoteam_accounts_receivable FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can insert receivables"
  ON public.neoteam_accounts_receivable FOR INSERT TO authenticated
  WITH CHECK (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can update receivables"
  ON public.neoteam_accounts_receivable FOR UPDATE TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can delete receivables"
  ON public.neoteam_accounts_receivable FOR DELETE TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

-- 3. Categorias financeiras
CREATE TABLE public.neoteam_financial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('receita','despesa')),
  color text DEFAULT '#6366f1',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neoteam_financial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view categories"
  ON public.neoteam_financial_categories FOR SELECT TO authenticated
  USING (is_neoteam_member_safe(auth.uid()) OR is_neohub_admin(auth.uid()));

CREATE POLICY "Admin+ can manage categories"
  ON public.neoteam_financial_categories FOR ALL TO authenticated
  USING (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()))
  WITH CHECK (is_neoteam_admin_or_above(auth.uid()) OR is_neohub_admin(auth.uid()));

-- 4. Seed categories
INSERT INTO public.neoteam_financial_categories (name, type, color) VALUES
  ('Contratos', 'receita', '#10b981'),
  ('Procedimentos', 'receita', '#06b6d4'),
  ('Consultas', 'receita', '#8b5cf6'),
  ('Outros Recebíveis', 'receita', '#f59e0b'),
  ('Aluguel', 'despesa', '#ef4444'),
  ('Folha de Pagamento', 'despesa', '#f97316'),
  ('Fornecedores', 'despesa', '#ec4899'),
  ('Marketing', 'despesa', '#a855f7'),
  ('Manutenção', 'despesa', '#64748b'),
  ('Impostos', 'despesa', '#dc2626'),
  ('Outros', 'despesa', '#6b7280');

-- 5. Audit triggers
CREATE TRIGGER neoteam_audit_accounts_payable
  AFTER INSERT OR UPDATE OR DELETE ON public.neoteam_accounts_payable
  FOR EACH ROW EXECUTE FUNCTION public.neoteam_audit_trigger_fn();

CREATE TRIGGER neoteam_audit_accounts_receivable
  AFTER INSERT OR UPDATE OR DELETE ON public.neoteam_accounts_receivable
  FOR EACH ROW EXECUTE FUNCTION public.neoteam_audit_trigger_fn();

-- 6. Updated_at triggers
CREATE TRIGGER update_neoteam_payable_updated_at
  BEFORE UPDATE ON public.neoteam_accounts_payable
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neoteam_receivable_updated_at
  BEFORE UPDATE ON public.neoteam_accounts_receivable
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
