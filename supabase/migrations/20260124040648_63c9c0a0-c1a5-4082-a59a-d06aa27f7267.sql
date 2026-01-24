-- Create table to persist AI-generated survey insights
CREATE TABLE public.survey_ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.course_classes(id) ON DELETE CASCADE,
  insights JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint so we only keep latest insights per class
CREATE UNIQUE INDEX survey_ai_insights_class_id_key ON public.survey_ai_insights(class_id);

-- Enable RLS
ALTER TABLE public.survey_ai_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read insights
CREATE POLICY "Authenticated users can view survey insights"
  ON public.survey_ai_insights FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert/update insights
CREATE POLICY "Authenticated users can create survey insights"
  ON public.survey_ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update survey insights"
  ON public.survey_ai_insights FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_survey_ai_insights_updated_at
  BEFORE UPDATE ON public.survey_ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();