-- Create contacts table (unique phone per user)
CREATE TABLE public.avivar_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  company_name VARCHAR(255),
  notes TEXT,
  tags TEXT[],
  source VARCHAR(100) DEFAULT 'whatsapp',
  first_contact_at TIMESTAMPTZ DEFAULT now(),
  last_contact_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT avivar_contacts_user_phone_unique UNIQUE (user_id, phone)
);

-- Add contact_id to avivar_kanban_leads to link leads to contacts
ALTER TABLE public.avivar_kanban_leads 
ADD COLUMN contact_id UUID REFERENCES public.avivar_contacts(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.avivar_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Users can view their own contacts"
ON public.avivar_contacts FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own contacts"
ON public.avivar_contacts FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own contacts"
ON public.avivar_contacts FOR UPDATE
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own contacts"
ON public.avivar_contacts FOR DELETE
USING (auth.uid()::text = user_id::text);

-- Index for faster lookups
CREATE INDEX idx_avivar_contacts_user_phone ON public.avivar_contacts(user_id, phone);
CREATE INDEX idx_avivar_contacts_last_contact ON public.avivar_contacts(user_id, last_contact_at DESC);
CREATE INDEX idx_avivar_kanban_leads_contact_id ON public.avivar_kanban_leads(contact_id);

-- Function to get or create contact when WhatsApp message arrives
CREATE OR REPLACE FUNCTION public.get_or_create_avivar_contact(
  p_user_id UUID,
  p_phone VARCHAR,
  p_name VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contact_id UUID;
BEGIN
  -- Try to find existing contact
  SELECT id INTO v_contact_id
  FROM public.avivar_contacts
  WHERE user_id = p_user_id AND phone = p_phone
  LIMIT 1;
  
  -- Create if not exists
  IF v_contact_id IS NULL THEN
    INSERT INTO public.avivar_contacts (user_id, phone, name, source)
    VALUES (p_user_id, p_phone, p_name, 'whatsapp')
    RETURNING id INTO v_contact_id;
  ELSE
    -- Update last contact time and name if provided
    UPDATE public.avivar_contacts
    SET last_contact_at = now(),
        name = COALESCE(p_name, name),
        updated_at = now()
    WHERE id = v_contact_id;
  END IF;
  
  RETURN v_contact_id;
END;
$$;

-- Function to create lead from contact (when new WhatsApp contact arrives)
CREATE OR REPLACE FUNCTION public.create_lead_from_contact(
  p_contact_id UUID,
  p_kanban_id UUID,
  p_column_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_contact RECORD;
  v_lead_id UUID;
BEGIN
  -- Get contact info
  SELECT * INTO v_contact FROM public.avivar_contacts WHERE id = p_contact_id;
  
  IF v_contact IS NULL THEN
    RAISE EXCEPTION 'Contact not found';
  END IF;
  
  -- Create lead
  INSERT INTO public.avivar_kanban_leads (
    user_id, kanban_id, column_id, contact_id, name, phone, email, source
  ) VALUES (
    v_contact.user_id, p_kanban_id, p_column_id, p_contact_id, 
    COALESCE(v_contact.name, 'Novo Lead'), v_contact.phone, v_contact.email, 'whatsapp_auto'
  )
  RETURNING id INTO v_lead_id;
  
  RETURN v_lead_id;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_avivar_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path TO 'public';

CREATE TRIGGER update_avivar_contacts_updated_at
BEFORE UPDATE ON public.avivar_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_avivar_contacts_updated_at();