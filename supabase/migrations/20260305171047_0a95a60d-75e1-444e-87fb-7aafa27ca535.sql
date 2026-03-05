
-- =============================================
-- Gestão de Performance - NeoRH
-- =============================================

-- Ciclos de avaliação (trimestrais/anuais)
CREATE TABLE rh_performance_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'open',
  cycle_type text NOT NULL DEFAULT 'trimestral',
  auto_eval_weight int NOT NULL DEFAULT 20,
  manager_eval_weight int NOT NULL DEFAULT 50,
  rh_eval_weight int NOT NULL DEFAULT 30,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Avaliações individuais
CREATE TABLE rh_performance_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES rh_performance_cycles(id) ON DELETE CASCADE,
  colaborador_id uuid NOT NULL REFERENCES rh_colaboradores(id) ON DELETE CASCADE,
  evaluator_id uuid,
  evaluator_type text NOT NULL DEFAULT 'auto',
  kpi_score numeric(5,2) DEFAULT 0,
  processos_score numeric(5,2) DEFAULT 0,
  cultura_score numeric(5,2) DEFAULT 0,
  autonomia_score numeric(5,2) DEFAULT 0,
  final_score numeric(5,2),
  grade text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- KPIs por cargo
CREATE TABLE rh_cargo_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id uuid NOT NULL REFERENCES rh_cargos(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  monthly_target numeric(10,2),
  weight numeric(5,2) NOT NULL DEFAULT 1,
  kpi_type text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PDI (Plano de Desenvolvimento Individual)
CREATE TABLE rh_performance_pdis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES rh_colaboradores(id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES rh_performance_cycles(id),
  evaluation_id uuid REFERENCES rh_performance_evaluations(id),
  grade text NOT NULL,
  objective text NOT NULL,
  deadline date NOT NULL,
  status text NOT NULL DEFAULT 'open',
  actions jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Talent Score
CREATE TABLE rh_talent_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES rh_colaboradores(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL DEFAULT 0,
  performance_score numeric(5,2) DEFAULT 0,
  tenure_score numeric(5,2) DEFAULT 0,
  financial_impact_score numeric(5,2) DEFAULT 0,
  leadership_score numeric(5,2) DEFAULT 0,
  performance_weight int NOT NULL DEFAULT 50,
  tenure_weight int NOT NULL DEFAULT 10,
  financial_impact_weight int NOT NULL DEFAULT 20,
  leadership_weight int NOT NULL DEFAULT 20,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Configurações de performance
CREATE TABLE rh_performance_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Alertas de performance
CREATE TABLE rh_performance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid NOT NULL REFERENCES rh_colaboradores(id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES rh_performance_cycles(id),
  alert_type text NOT NULL,
  grade text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE rh_performance_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh_performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh_cargo_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh_performance_pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh_talent_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh_performance_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh_performance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Authenticated users can read all (RBAC enforced at app level)
CREATE POLICY "Authenticated users can read performance cycles" ON rh_performance_cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage performance cycles" ON rh_performance_cycles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read evaluations" ON rh_performance_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage evaluations" ON rh_performance_evaluations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read cargo kpis" ON rh_cargo_kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage cargo kpis" ON rh_cargo_kpis FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read pdis" ON rh_performance_pdis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage pdis" ON rh_performance_pdis FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read talent scores" ON rh_talent_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage talent scores" ON rh_talent_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read performance config" ON rh_performance_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage performance config" ON rh_performance_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read performance alerts" ON rh_performance_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage performance alerts" ON rh_performance_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default configuration
INSERT INTO rh_performance_config (config_key, config_value) VALUES
  ('evaluation_weights', '{"auto": 20, "manager": 50, "rh": 30}'),
  ('grade_thresholds', '{"A": 90, "B": 75, "C": 60, "D": 0}'),
  ('pdi_deadlines', '{"C": 30, "D": 14}'),
  ('talent_score_weights', '{"performance": 50, "tenure": 10, "financial_impact": 20, "leadership": 20}'),
  ('ideal_distribution', '{"A": 15, "B": 65, "C": 15, "D": 5}');
