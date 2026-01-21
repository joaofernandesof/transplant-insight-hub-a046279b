-- Create daily_metrics table for daily metric entries
CREATE TABLE public.daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  leads_novos INTEGER DEFAULT 0,
  tempo_uso_atendente INTEGER DEFAULT 0,
  atividades_atendente INTEGER DEFAULT 0,
  atividades_robo INTEGER DEFAULT 0,
  mensagens_enviadas_atendente INTEGER DEFAULT 0,
  mensagens_enviadas_robo INTEGER DEFAULT 0,
  mensagens_recebidas INTEGER DEFAULT 0,
  tarefas_realizadas INTEGER DEFAULT 0,
  tarefas_atrasadas INTEGER DEFAULT 0,
  agendamentos INTEGER DEFAULT 0,
  vendas_realizadas INTEGER DEFAULT 0,
  leads_descartados INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(clinic_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own clinic daily metrics"
ON public.daily_metrics
FOR SELECT
USING (
  clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert their own clinic daily metrics"
ON public.daily_metrics
FOR INSERT
WITH CHECK (
  clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their own clinic daily metrics"
ON public.daily_metrics
FOR UPDATE
USING (
  clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_metrics_updated_at
BEFORE UPDATE ON public.daily_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_daily_metrics_clinic_date ON public.daily_metrics(clinic_id, metric_date DESC);