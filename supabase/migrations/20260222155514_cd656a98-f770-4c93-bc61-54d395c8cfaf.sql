
-- Tabela de logs de execução de Edge Functions
CREATE TABLE public.edge_function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  execution_time_ms integer,
  status text DEFAULT 'success',
  tokens_input integer,
  tokens_output integer,
  model_used text,
  estimated_cost_usd numeric(10,6),
  account_id uuid,
  user_id uuid,
  metadata jsonb DEFAULT '{}',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas de monitoramento
CREATE INDEX idx_efl_function_name ON public.edge_function_logs(function_name);
CREATE INDEX idx_efl_created_at ON public.edge_function_logs(created_at DESC);
CREATE INDEX idx_efl_account_id ON public.edge_function_logs(account_id);
CREATE INDEX idx_efl_user_id ON public.edge_function_logs(user_id);
CREATE INDEX idx_efl_status ON public.edge_function_logs(status);

-- Enable RLS
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

-- Apenas Super Admin (adm@neofolic.com.br) pode ler os logs
CREATE POLICY "Super admin can read all logs"
  ON public.edge_function_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = '00294ac4-0194-47bc-95ef-6efb83c316f7'::uuid
  );

-- Inserção via service_role (Edge Functions) - sem policy de INSERT para anon/authenticated
-- O INSERT será feito com service_role key que bypassa RLS
