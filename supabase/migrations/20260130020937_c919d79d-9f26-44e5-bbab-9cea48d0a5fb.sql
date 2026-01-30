-- ==========================================
-- NeoHair - Portal de Tratamento Capilar
-- ==========================================

-- Tabela de avaliações capilares dos pacientes
CREATE TABLE public.neohair_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados básicos do paciente
  full_name TEXT NOT NULL,
  age INTEGER,
  city TEXT,
  state TEXT,
  phone TEXT,
  
  -- Fotos da avaliação
  photo_front_url TEXT,
  photo_top_url TEXT,
  photo_left_url TEXT,
  photo_right_url TEXT,
  photo_back_url TEXT,
  
  -- Questionário clínico
  hair_loss_started_at TEXT, -- 'menos_1_ano', '1_3_anos', '3_5_anos', 'mais_5_anos'
  family_history_father BOOLEAN DEFAULT false,
  family_history_mother BOOLEAN DEFAULT false,
  family_history_grandparents BOOLEAN DEFAULT false,
  previous_treatments TEXT[], -- ['minoxidil', 'finasterida', 'dutasterida', 'laser', 'mesoterapia', 'prp', 'transplante']
  current_medications TEXT,
  health_conditions TEXT[], -- ['diabetes', 'hipertensao', 'tireoide', 'anemia', 'estresse', 'nenhum']
  scalp_condition TEXT, -- 'oleoso', 'seco', 'normal', 'caspa', 'dermatite'
  
  -- Expectativa estética
  expectation_level TEXT, -- 'recuperar_tudo', 'melhorar_significativo', 'manter', 'entender_opcoes'
  main_concern TEXT,
  
  -- Resultados da avaliação (calculados por IA ou regras)
  baldness_grade INTEGER CHECK (baldness_grade BETWEEN 1 AND 7), -- Escala Norwood-Hamilton
  baldness_pattern TEXT, -- 'frontal', 'coroa', 'difuso', 'misto'
  transplant_score INTEGER DEFAULT 0 CHECK (transplant_score BETWEEN 0 AND 100),
  treatment_recommendation TEXT, -- 'kit_basico', 'kit_avancado', 'consulta_medica', 'transplante'
  ai_analysis TEXT, -- Análise detalhada da IA
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'needs_review', 'archived')),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de produtos NeoHair (kits de tratamento)
CREATE TABLE public.neohair_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  
  -- Categorização
  category TEXT NOT NULL DEFAULT 'kit' CHECK (category IN ('kit', 'produto_avulso', 'consulta', 'exame')),
  level TEXT CHECK (level IN ('basico', 'intermediario', 'avancado', 'premium')),
  target_grades INTEGER[], -- Graus de calvície recomendados [1,2,3,4,5,6,7]
  
  -- Preços
  price DECIMAL(10,2) NOT NULL,
  compare_price DECIMAL(10,2), -- Preço "de" para desconto
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT, -- 'mensal', 'trimestral', 'semestral', 'anual'
  
  -- Conteúdo do kit
  included_items JSONB DEFAULT '[]'::jsonb, -- [{name, quantity, description}]
  
  -- Integração com Stripe
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  stripe_recurring_price_id TEXT,
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de pedidos NeoHair
CREATE TABLE public.neohair_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  evaluation_id UUID REFERENCES public.neohair_evaluations(id),
  
  -- Itens do pedido
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{product_id, name, quantity, price}]
  
  -- Valores
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Pagamento
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Entrega
  shipping_address JSONB,
  shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered')),
  tracking_code TEXT,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  next_billing_date DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de leads de transplante
CREATE TABLE public.neohair_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID REFERENCES public.neohair_evaluations(id) NOT NULL,
  patient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Dados do lead
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  patient_city TEXT,
  patient_state TEXT,
  
  -- Classificação
  transplant_score INTEGER DEFAULT 0,
  baldness_grade INTEGER,
  lead_priority TEXT DEFAULT 'normal' CHECK (lead_priority IN ('low', 'normal', 'high', 'urgent')),
  lead_source TEXT DEFAULT 'neohair' CHECK (lead_source IN ('neohair', 'vision', 'indicacao', 'marketing')),
  
  -- Atribuição
  assigned_to UUID REFERENCES auth.users(id), -- Médico/Licenciado responsável
  assigned_at TIMESTAMPTZ,
  
  -- Status do funil
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'scheduled', 'converted', 'lost', 'declined')),
  status_reason TEXT, -- Motivo de perdido/recusado
  
  -- Consulta agendada
  scheduled_date DATE,
  scheduled_time TIME,
  consultation_type TEXT, -- 'presencial', 'online'
  consultation_unit TEXT,
  
  -- Conversão
  converted_at TIMESTAMPTZ,
  surgery_value DECIMAL(10,2),
  commission_value DECIMAL(10,2),
  
  -- Contatos
  last_contact_at TIMESTAMPTZ,
  contact_attempts INTEGER DEFAULT 0,
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de histórico de evolução do paciente
CREATE TABLE public.neohair_evolution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  evaluation_id UUID REFERENCES public.neohair_evaluations(id),
  
  -- Fotos de acompanhamento
  photo_front_url TEXT,
  photo_top_url TEXT,
  photo_left_url TEXT,
  photo_right_url TEXT,
  
  -- Questionário de evolução
  treatment_adherence TEXT, -- 'diario', 'quase_sempre', 'as_vezes', 'raramente'
  perceived_improvement TEXT, -- 'muito_melhor', 'um_pouco_melhor', 'igual', 'piorou'
  side_effects TEXT,
  observations TEXT,
  
  -- Análise
  ai_comparison TEXT, -- Comparação com avaliação anterior
  improvement_score INTEGER CHECK (improvement_score BETWEEN 0 AND 100),
  
  month_number INTEGER, -- Mês de tratamento
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de configuração de distribuição de leads
CREATE TABLE public.neohair_lead_distribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Configuração
  is_active BOOLEAN DEFAULT true,
  max_leads_per_day INTEGER DEFAULT 5,
  max_leads_per_month INTEGER DEFAULT 100,
  
  -- Filtros de região
  accepted_states TEXT[],
  accepted_cities TEXT[],
  
  -- Nível e capacidade
  professional_level TEXT DEFAULT 'standard' CHECK (professional_level IN ('standard', 'premium', 'exclusive')),
  priority_score INTEGER DEFAULT 50,
  
  -- Comissões
  commission_percentage DECIMAL(5,2) DEFAULT 5.00,
  lead_fee DECIMAL(10,2) DEFAULT 200.00,
  
  -- Contadores
  leads_received_today INTEGER DEFAULT 0,
  leads_received_month INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_neohair_evaluations_user ON public.neohair_evaluations(user_id);
CREATE INDEX idx_neohair_evaluations_status ON public.neohair_evaluations(status);
CREATE INDEX idx_neohair_evaluations_score ON public.neohair_evaluations(transplant_score DESC);
CREATE INDEX idx_neohair_orders_user ON public.neohair_orders(user_id);
CREATE INDEX idx_neohair_orders_status ON public.neohair_orders(payment_status);
CREATE INDEX idx_neohair_leads_status ON public.neohair_leads(status);
CREATE INDEX idx_neohair_leads_assigned ON public.neohair_leads(assigned_to);
CREATE INDEX idx_neohair_leads_score ON public.neohair_leads(transplant_score DESC);
CREATE INDEX idx_neohair_evolution_user ON public.neohair_evolution(user_id);
CREATE INDEX idx_neohair_distribution_user ON public.neohair_lead_distribution(professional_user_id);

-- RLS
ALTER TABLE public.neohair_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neohair_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neohair_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neohair_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neohair_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neohair_lead_distribution ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para avaliações
CREATE POLICY "Usuários podem ver suas próprias avaliações"
ON public.neohair_evaluations FOR SELECT
USING (auth.uid() = user_id OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Usuários podem criar suas próprias avaliações"
ON public.neohair_evaluations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias avaliações"
ON public.neohair_evaluations FOR UPDATE
USING (auth.uid() = user_id OR public.is_neohub_admin(auth.uid()));

-- Políticas RLS para produtos (públicos)
CREATE POLICY "Produtos ativos são visíveis publicamente"
ON public.neohair_products FOR SELECT
USING (is_active = true OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins podem gerenciar produtos"
ON public.neohair_products FOR ALL
USING (public.is_neohub_admin(auth.uid()));

-- Políticas RLS para pedidos
CREATE POLICY "Usuários podem ver seus próprios pedidos"
ON public.neohair_orders FOR SELECT
USING (auth.uid() = user_id OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Usuários podem criar seus próprios pedidos"
ON public.neohair_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios pedidos"
ON public.neohair_orders FOR UPDATE
USING (auth.uid() = user_id OR public.is_neohub_admin(auth.uid()));

-- Políticas RLS para leads
CREATE POLICY "Leads visíveis para responsáveis e admins"
ON public.neohair_leads FOR SELECT
USING (
  public.is_neohub_admin(auth.uid()) OR 
  assigned_to = auth.uid() OR
  patient_user_id = auth.uid()
);

CREATE POLICY "Sistema pode criar leads"
ON public.neohair_leads FOR INSERT
WITH CHECK (public.is_neohub_admin(auth.uid()) OR patient_user_id = auth.uid());

CREATE POLICY "Responsáveis podem atualizar seus leads"
ON public.neohair_leads FOR UPDATE
USING (
  public.is_neohub_admin(auth.uid()) OR 
  assigned_to = auth.uid()
);

-- Políticas RLS para evolução
CREATE POLICY "Usuários podem ver sua própria evolução"
ON public.neohair_evolution FOR SELECT
USING (auth.uid() = user_id OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Usuários podem criar sua própria evolução"
ON public.neohair_evolution FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para distribuição
CREATE POLICY "Profissionais podem ver sua própria config"
ON public.neohair_lead_distribution FOR SELECT
USING (auth.uid() = professional_user_id OR public.is_neohub_admin(auth.uid()));

CREATE POLICY "Admins podem gerenciar distribuição"
ON public.neohair_lead_distribution FOR ALL
USING (public.is_neohub_admin(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_neohair_evaluations_updated_at
  BEFORE UPDATE ON public.neohair_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neohair_products_updated_at
  BEFORE UPDATE ON public.neohair_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neohair_orders_updated_at
  BEFORE UPDATE ON public.neohair_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neohair_leads_updated_at
  BEFORE UPDATE ON public.neohair_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_neohair_distribution_updated_at
  BEFORE UPDATE ON public.neohair_lead_distribution
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir produtos iniciais
INSERT INTO public.neohair_products (name, short_description, description, category, level, target_grades, price, compare_price, is_recurring, recurring_interval, display_order, included_items) VALUES
('Kit Prevenção', 'Ideal para quem está no início da queda', 'Kit completo para prevenção e fortalecimento capilar, ideal para graus iniciais de calvície.', 'kit', 'basico', ARRAY[1,2], 297.00, 397.00, true, 'mensal', 1, '[{"name": "Shampoo Anticapilar", "quantity": 1}, {"name": "Tônico Capilar", "quantity": 1}, {"name": "Vitaminas", "quantity": 1}]'::jsonb),
('Kit Tratamento', 'Para quem precisa reverter a queda', 'Kit avançado com tratamento completo para reverter a miniaturização dos fios.', 'kit', 'intermediario', ARRAY[2,3,4], 497.00, 697.00, true, 'mensal', 2, '[{"name": "Shampoo Anticapilar", "quantity": 1}, {"name": "Minoxidil 5%", "quantity": 2}, {"name": "Finasterida 1mg", "quantity": 1}, {"name": "Vitaminas", "quantity": 1}]'::jsonb),
('Kit Restauração', 'Tratamento intensivo completo', 'Kit premium com todos os recursos para máxima recuperação capilar.', 'kit', 'avancado', ARRAY[3,4,5], 697.00, 997.00, true, 'mensal', 3, '[{"name": "Shampoo Anticapilar", "quantity": 1}, {"name": "Minoxidil 5%", "quantity": 2}, {"name": "Finasterida 1mg", "quantity": 1}, {"name": "Dutasterida 0.5mg", "quantity": 1}, {"name": "Vitaminas Premium", "quantity": 1}, {"name": "Laser Cap", "quantity": 1}]'::jsonb),
('Kit Maximum', 'Solução mais completa do mercado', 'Kit exclusivo com acompanhamento médico e todos os recursos disponíveis.', 'kit', 'premium', ARRAY[4,5,6,7], 997.00, 1497.00, true, 'mensal', 4, '[{"name": "Todos os itens do Kit Restauração", "quantity": 1}, {"name": "Consulta médica mensal", "quantity": 1}, {"name": "Mesoterapia capilar", "quantity": 1}, {"name": "Suporte prioritário", "quantity": 1}]'::jsonb),
('Consulta Médica Online', 'Avaliação com especialista', 'Consulta online com médico especialista em tricologia.', 'consulta', NULL, NULL, 250.00, NULL, false, NULL, 10, '[]'::jsonb),
('Consulta Médica Presencial', 'Avaliação presencial completa', 'Consulta presencial com exames e análise detalhada.', 'consulta', NULL, NULL, 450.00, NULL, false, NULL, 11, '[]'::jsonb);