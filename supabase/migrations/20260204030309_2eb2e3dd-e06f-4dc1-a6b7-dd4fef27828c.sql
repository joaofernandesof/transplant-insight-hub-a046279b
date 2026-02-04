-- Create client activities table for complete timeline/log
CREATE TABLE public.ipromed_client_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  
  -- Activity categorization
  activity_type TEXT NOT NULL,  -- 'meeting', 'contract', 'document', 'edit', 'note', 'process', 'payment', 'communication'
  action TEXT NOT NULL,         -- 'created', 'updated', 'deleted', 'signed', 'sent', 'received', 'scheduled', 'completed', 'cancelled'
  
  -- Activity details
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- References to other entities (optional)
  reference_type TEXT,          -- 'contract', 'document', 'meeting', 'process'
  reference_id UUID,
  
  -- Actor information
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_client_activities_client ON public.ipromed_client_activities(client_id);
CREATE INDEX idx_client_activities_type ON public.ipromed_client_activities(activity_type);
CREATE INDEX idx_client_activities_created ON public.ipromed_client_activities(created_at DESC);

-- Enable RLS
ALTER TABLE public.ipromed_client_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view client activities"
ON public.ipromed_client_activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert client activities"
ON public.ipromed_client_activities FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create meetings table
CREATE TABLE public.ipromed_client_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.ipromed_legal_clients(id) ON DELETE CASCADE,
  
  -- Meeting info
  title TEXT NOT NULL,
  description TEXT,
  agenda_type TEXT NOT NULL DEFAULT 'custom',  -- 'onboarding', 'acompanhamento', 'renovacao', 'feedback', 'custom'
  agenda_topics JSONB DEFAULT '[]',
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Modality
  modality TEXT NOT NULL DEFAULT 'virtual',  -- 'virtual', 'presencial'
  location TEXT,
  meeting_link TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled',  -- 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
  
  -- Minutes/Notes
  meeting_notes TEXT,
  minutes TEXT,  -- Ata da reunião
  action_items JSONB DEFAULT '[]',
  
  -- Timestamps
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_client_meetings_client ON public.ipromed_client_meetings(client_id);
CREATE INDEX idx_client_meetings_date ON public.ipromed_client_meetings(scheduled_date);
CREATE INDEX idx_client_meetings_status ON public.ipromed_client_meetings(status);

-- Enable RLS
ALTER TABLE public.ipromed_client_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view meetings"
ON public.ipromed_client_meetings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert meetings"
ON public.ipromed_client_meetings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update meetings"
ON public.ipromed_client_meetings FOR UPDATE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_ipromed_client_meetings_updated_at
BEFORE UPDATE ON public.ipromed_client_meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();