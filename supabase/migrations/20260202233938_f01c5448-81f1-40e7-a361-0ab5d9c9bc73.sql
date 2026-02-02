-- =============================================
-- AVIVAR CRM ONBOARDING SYSTEM
-- Sistema de onboarding obrigatório bloqueante
-- =============================================

-- Tabela para controlar progresso do onboarding por usuário
CREATE TABLE IF NOT EXISTS public.avivar_onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Etapas completadas (ordem obrigatória)
  whatsapp_connected BOOLEAN DEFAULT FALSE,
  funnels_setup BOOLEAN DEFAULT FALSE,
  columns_setup BOOLEAN DEFAULT FALSE,
  ai_agent_created BOOLEAN DEFAULT FALSE,
  knowledge_base_setup BOOLEAN DEFAULT FALSE,
  ai_routing_configured BOOLEAN DEFAULT FALSE,
  column_checklists_setup BOOLEAN DEFAULT FALSE,
  crm_activated BOOLEAN DEFAULT FALSE,
  
  -- Etapa atual (para tracking)
  current_step INTEGER DEFAULT 1,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_step_completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avivar_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own onboarding progress"
  ON public.avivar_onboarding_progress
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own onboarding progress"
  ON public.avivar_onboarding_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding progress"
  ON public.avivar_onboarding_progress
  FOR UPDATE
  USING (user_id = auth.uid());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_avivar_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_avivar_onboarding_progress_updated_at
  BEFORE UPDATE ON public.avivar_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_avivar_onboarding_updated_at();

-- =============================================
-- AVIVAR COLUMN CHECKLISTS (Campos obrigatórios por coluna)
-- =============================================

CREATE TABLE IF NOT EXISTS public.avivar_column_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID NOT NULL REFERENCES public.avivar_kanban_columns(id) ON DELETE CASCADE,
  
  -- Definição do campo obrigatório
  field_key TEXT NOT NULL, -- ex: 'scheduled_date', 'email', 'phone'
  field_label TEXT NOT NULL, -- ex: 'Data de Agendamento'
  field_type TEXT NOT NULL DEFAULT 'text', -- text, date, datetime, boolean, select
  is_required BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  
  -- Opções para campo tipo select
  options JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avivar_column_checklists ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (herdadas do kanban do usuário)
CREATE POLICY "Users can view column checklists"
  ON public.avivar_column_checklists
  FOR SELECT
  USING (
    column_id IN (
      SELECT c.id FROM avivar_kanban_columns c
      JOIN avivar_kanbans k ON k.id = c.kanban_id
      WHERE k.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage column checklists"
  ON public.avivar_column_checklists
  FOR ALL
  USING (
    column_id IN (
      SELECT c.id FROM avivar_kanban_columns c
      JOIN avivar_kanbans k ON k.id = c.kanban_id
      WHERE k.user_id = auth.uid()
    )
  );

-- =============================================
-- Adicionar campo de instrução IA obrigatória às colunas
-- (já existe ai_instruction, mas vamos garantir)
-- =============================================

-- Adicionar campo custom_fields aos leads para armazenar dados do checklist
-- (já existe, apenas garantindo)

-- =============================================
-- FUNCTION: Verificar se onboarding está completo
-- =============================================

CREATE OR REPLACE FUNCTION public.is_avivar_onboarding_complete(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT crm_activated FROM public.avivar_onboarding_progress WHERE user_id = _user_id),
    FALSE
  )
$$;

-- =============================================
-- FUNCTION: Obter status do onboarding
-- =============================================

CREATE OR REPLACE FUNCTION public.get_avivar_onboarding_status(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  progress RECORD;
BEGIN
  SELECT * INTO progress FROM public.avivar_onboarding_progress WHERE user_id = _user_id;
  
  IF progress IS NULL THEN
    -- Criar registro inicial
    INSERT INTO public.avivar_onboarding_progress (user_id)
    VALUES (_user_id)
    RETURNING * INTO progress;
  END IF;
  
  result := jsonb_build_object(
    'is_complete', progress.crm_activated,
    'current_step', progress.current_step,
    'steps', jsonb_build_object(
      'whatsapp_connected', progress.whatsapp_connected,
      'funnels_setup', progress.funnels_setup,
      'columns_setup', progress.columns_setup,
      'ai_agent_created', progress.ai_agent_created,
      'knowledge_base_setup', progress.knowledge_base_setup,
      'ai_routing_configured', progress.ai_routing_configured,
      'column_checklists_setup', progress.column_checklists_setup,
      'crm_activated', progress.crm_activated
    ),
    'started_at', progress.started_at,
    'completed_at', progress.completed_at
  );
  
  RETURN result;
END;
$$;

-- =============================================
-- FUNCTION: Verificar se lead pode mover para coluna
-- (Checa checklists obrigatórios)
-- =============================================

CREATE OR REPLACE FUNCTION public.can_move_lead_to_column(
  _lead_id UUID,
  _target_column_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_data RECORD;
  checklist_item RECORD;
  missing_fields JSONB := '[]'::JSONB;
  custom_fields JSONB;
  field_value TEXT;
BEGIN
  -- Get lead data
  SELECT * INTO lead_data FROM avivar_kanban_leads WHERE id = _lead_id;
  
  IF lead_data IS NULL THEN
    RETURN jsonb_build_object('can_move', false, 'error', 'Lead não encontrado');
  END IF;
  
  custom_fields := COALESCE(lead_data.custom_fields, '{}'::JSONB);
  
  -- Check each required field for target column
  FOR checklist_item IN 
    SELECT * FROM avivar_column_checklists 
    WHERE column_id = _target_column_id AND is_required = true
    ORDER BY order_index
  LOOP
    -- Check standard fields
    CASE checklist_item.field_key
      WHEN 'phone' THEN field_value := lead_data.phone;
      WHEN 'email' THEN field_value := lead_data.email;
      WHEN 'name' THEN field_value := lead_data.name;
      WHEN 'notes' THEN field_value := lead_data.notes;
      ELSE field_value := custom_fields->>checklist_item.field_key;
    END CASE;
    
    -- If field is empty, add to missing
    IF field_value IS NULL OR TRIM(field_value) = '' THEN
      missing_fields := missing_fields || jsonb_build_object(
        'field_key', checklist_item.field_key,
        'field_label', checklist_item.field_label,
        'field_type', checklist_item.field_type
      );
    END IF;
  END LOOP;
  
  IF jsonb_array_length(missing_fields) > 0 THEN
    RETURN jsonb_build_object(
      'can_move', false,
      'missing_fields', missing_fields,
      'message', 'Complete os campos obrigatórios antes de mover o lead'
    );
  END IF;
  
  RETURN jsonb_build_object('can_move', true);
END;
$$;