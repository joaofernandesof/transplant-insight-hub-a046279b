
-- Table to store licensee WhatsApp contact settings
CREATE TABLE public.hotleads_licensee_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  licensee_name TEXT NOT NULL,
  clinic_name TEXT NOT NULL,
  clinic_city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hotleads_licensee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
ON public.hotleads_licensee_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.hotleads_licensee_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.hotleads_licensee_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_hotleads_licensee_settings_updated_at
BEFORE UPDATE ON public.hotleads_licensee_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
