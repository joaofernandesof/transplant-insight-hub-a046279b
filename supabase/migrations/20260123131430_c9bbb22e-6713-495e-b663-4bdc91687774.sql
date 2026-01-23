
-- Create table for class schedule (cronograma de aulas)
CREATE TABLE public.class_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.course_classes(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  day_date DATE,
  day_title TEXT NOT NULL,
  day_theme TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for schedule items (atividades do dia)
CREATE TABLE public.class_schedule_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.class_schedule(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  activity TEXT NOT NULL,
  location TEXT,
  instructor TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedule_items ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow enrolled students and admins to view
CREATE POLICY "Users can view class schedule" 
ON public.class_schedule 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM class_enrollments ce 
    WHERE ce.class_id = class_schedule.class_id 
    AND ce.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can view schedule items" 
ON public.class_schedule_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM class_schedule cs 
    JOIN class_enrollments ce ON ce.class_id = cs.class_id 
    WHERE cs.id = class_schedule_items.schedule_id 
    AND ce.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Admin can manage schedules
CREATE POLICY "Admins can manage class schedule" 
ON public.class_schedule 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage schedule items" 
ON public.class_schedule_items 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_class_schedule_class_id ON public.class_schedule(class_id);
CREATE INDEX idx_class_schedule_items_schedule_id ON public.class_schedule_items(schedule_id);
