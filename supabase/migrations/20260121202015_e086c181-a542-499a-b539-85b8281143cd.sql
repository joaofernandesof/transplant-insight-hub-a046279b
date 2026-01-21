-- Create table for WhatsApp notification logs
CREATE TABLE IF NOT EXISTS public.neoteam_whatsapp_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  patient_name TEXT,
  patient_phone TEXT,
  message TEXT,
  success BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for NeoTeam settings (including WhatsApp config)
CREATE TABLE IF NOT EXISTS public.neoteam_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB,
  whatsapp_instance_url TEXT,
  whatsapp_api_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.neoteam_whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neoteam_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for logs (admin only read)
CREATE POLICY "Admins can view whatsapp logs"
  ON public.neoteam_whatsapp_logs
  FOR SELECT
  USING (public.is_neohub_admin(auth.uid()));

-- Service role can insert logs
CREATE POLICY "Service role can insert logs"
  ON public.neoteam_whatsapp_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS policies for settings
CREATE POLICY "Admins can manage neoteam settings"
  ON public.neoteam_settings
  FOR ALL
  USING (public.is_neohub_admin(auth.uid()));

-- Add patient_phone column to waiting room if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'neoteam_waiting_room' AND column_name = 'patient_phone'
  ) THEN
    ALTER TABLE public.neoteam_waiting_room ADD COLUMN patient_phone TEXT;
  END IF;
END $$;