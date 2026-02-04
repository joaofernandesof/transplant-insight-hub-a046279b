-- Tabela para os funis comerciais do CPG
CREATE TABLE public.cpg_sales_funnels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Colunas/Estágios dos funis
CREATE TABLE public.cpg_sales_funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.cpg_sales_funnels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Leads do funil comercial
CREATE TABLE public.cpg_sales_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funnel_id UUID NOT NULL REFERENCES public.cpg_sales_funnels(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.cpg_sales_funnel_stages(id) ON DELETE CASCADE,
  client_id UUID,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  specialty VARCHAR(255),
  company_name VARCHAR(255),
  notes TEXT,
  source VARCHAR(100),
  assigned_to UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cpg_sales_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpg_sales_funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpg_sales_leads ENABLE ROW LEVEL SECURITY;

-- Policies for sales funnels (todos podem ler, admins podem escrever)
CREATE POLICY "Anyone can read sales funnels" ON public.cpg_sales_funnels
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sales funnels" ON public.cpg_sales_funnels
  FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Policies for stages
CREATE POLICY "Anyone can read funnel stages" ON public.cpg_sales_funnel_stages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage funnel stages" ON public.cpg_sales_funnel_stages
  FOR ALL USING (public.is_neohub_admin(auth.uid()));

-- Policies for leads (authenticated users can manage)
CREATE POLICY "Authenticated users can view leads" ON public.cpg_sales_leads
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert leads" ON public.cpg_sales_leads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update leads" ON public.cpg_sales_leads
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete leads" ON public.cpg_sales_leads
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_cpg_sales_funnels_updated_at
  BEFORE UPDATE ON public.cpg_sales_funnels
  FOR EACH ROW EXECUTE FUNCTION public.update_avivar_journey_updated_at();

CREATE TRIGGER update_cpg_sales_funnel_stages_updated_at
  BEFORE UPDATE ON public.cpg_sales_funnel_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_avivar_journey_updated_at();

CREATE TRIGGER update_cpg_sales_leads_updated_at
  BEFORE UPDATE ON public.cpg_sales_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_avivar_journey_updated_at();

-- Inserir os funis padrão
INSERT INTO public.cpg_sales_funnels (name, description, icon, color, order_index) VALUES
  ('Funil Contencioso', 'Cliente já chega com o problema - processo em andamento', 'scale', 'from-red-500 to-orange-500', 0),
  ('Funil Comercial', 'Assessoria Jurídica Preventiva - captação de novos clientes', 'briefcase', 'from-blue-500 to-indigo-500', 1);

-- Inserir estágios do Funil Contencioso
INSERT INTO public.cpg_sales_funnel_stages (funnel_id, name, description, color, order_index) 
SELECT 
  f.id,
  stage.name,
  stage.description,
  stage.color,
  stage.order_index
FROM public.cpg_sales_funnels f
CROSS JOIN (VALUES
  ('Leads de Entrada', 'Novos leads que chegaram', 'from-gray-500 to-gray-600', 0),
  ('Triagem', 'Coletando informações iniciais', 'from-yellow-500 to-amber-600', 1),
  ('Processo Informado', 'Cliente informou processo em andamento', 'from-orange-500 to-orange-600', 2),
  ('Aguardando Documentos', 'Solicitar documentos do processo para análise (SLA: 24h úteis)', 'from-pink-500 to-rose-600', 3),
  ('Reunião Agendada', 'Reunião de apresentação agendada', 'from-blue-500 to-blue-600', 4),
  ('Em Negociação', 'SPIN Selling + Apresentação + Fechamento', 'from-purple-500 to-purple-600', 5),
  ('Follow-up', 'Pessoas que não fecharam ainda', 'from-cyan-500 to-cyan-600', 6),
  ('Clientes', 'Pessoas que fecharam contrato', 'from-emerald-500 to-green-600', 7),
  ('Descartados', 'Pessoas que não querem', 'from-slate-500 to-slate-600', 8)
) AS stage(name, description, color, order_index)
WHERE f.name = 'Funil Contencioso';

-- Inserir estágios do Funil Comercial (Assessoria Preventiva)
INSERT INTO public.cpg_sales_funnel_stages (funnel_id, name, description, color, order_index) 
SELECT 
  f.id,
  stage.name,
  stage.description,
  stage.color,
  stage.order_index
FROM public.cpg_sales_funnels f
CROSS JOIN (VALUES
  ('Leads de Entrada', 'Pessoas que clicaram para saber mais', 'from-gray-500 to-gray-600', 0),
  ('Triagem', 'Coletando informações do lead', 'from-yellow-500 to-amber-600', 1),
  ('Tentando Agendar', 'Tentando agendar call ou reunião presencial', 'from-orange-500 to-orange-600', 2),
  ('Agendados', 'Reunião de consultoria agendada', 'from-blue-500 to-blue-600', 3),
  ('Em Negociação', 'SPIN Selling + Apresentação + Precificação', 'from-purple-500 to-purple-600', 4),
  ('Follow-up', 'Pessoas que não fecharam ainda', 'from-cyan-500 to-cyan-600', 5),
  ('Clientes', 'Pessoas que fecharam contrato', 'from-emerald-500 to-green-600', 6),
  ('Descartados', 'Pessoas que não querem', 'from-slate-500 to-slate-600', 7)
) AS stage(name, description, color, order_index)
WHERE f.name = 'Funil Comercial';