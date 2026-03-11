-- Table to log all AI API usage across the platform
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  user_name text,
  portal text NOT NULL DEFAULT 'unknown',
  module text NOT NULL DEFAULT 'unknown',
  action text NOT NULL DEFAULT 'ai_request',
  edge_function text NOT NULL,
  ai_model text,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost_usd numeric(10,6) DEFAULT 0,
  processing_time_ms integer,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_portal ON public.ai_usage_logs(portal);
CREATE INDEX idx_ai_usage_logs_module ON public.ai_usage_logs(module);
CREATE INDEX idx_ai_usage_logs_edge_function ON public.ai_usage_logs(edge_function);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ai_usage_logs"
  ON public.ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
