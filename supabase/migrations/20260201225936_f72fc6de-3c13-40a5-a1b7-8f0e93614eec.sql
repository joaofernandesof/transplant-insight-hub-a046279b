-- Create table for custom kanbans
CREATE TABLE public.avivar_kanbans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'briefcase',
  color TEXT DEFAULT 'from-blue-500 to-blue-600',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avivar_kanbans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own kanbans" 
ON public.avivar_kanbans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own kanbans" 
ON public.avivar_kanbans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kanbans" 
ON public.avivar_kanbans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own kanbans" 
ON public.avivar_kanbans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_avivar_kanbans_updated_at
BEFORE UPDATE ON public.avivar_kanbans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();