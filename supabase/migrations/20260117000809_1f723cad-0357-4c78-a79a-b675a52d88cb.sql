-- =============================================
-- 1. HOTLEADS SYSTEM
-- =============================================

-- Leads table for capturing patient interests
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    city TEXT,
    state TEXT,
    source TEXT DEFAULT 'landing_page',
    interest_level TEXT DEFAULT 'warm' CHECK (interest_level IN ('cold', 'warm', 'hot')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'converted', 'lost')),
    notes TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Leads RLS: Clinics see their assigned leads, admins see all
CREATE POLICY "Clinics can view their own leads"
ON public.leads FOR SELECT TO authenticated
USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clinics can update their own leads"
ON public.leads FOR UPDATE TO authenticated
USING (
    clinic_id IN (SELECT id FROM public.clinics WHERE user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can insert leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. STORAGE FOR PROFILE PHOTOS
-- =============================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read for avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =============================================
-- 3. ADMIN SETTINGS SYSTEM
-- =============================================

-- Settings table for admin configurations
CREATE TABLE public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "All authenticated users can read settings"
ON public.admin_settings FOR SELECT TO authenticated
USING (true);

-- Only admins can modify settings
CREATE POLICY "Only admins can modify settings"
ON public.admin_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings for page visibility
INSERT INTO public.admin_settings (key, value, description) VALUES
('page_visibility', '{"university": true, "regularization": true, "materials": true, "marketing": true, "store": true, "financial": true, "mentorship": true, "systems": true, "career": true, "hotleads": true, "community": true}', 'Controla quais páginas estão visíveis para os licenciados'),
('page_content', '{}', 'Conteúdo customizado das páginas'),
('general_settings', '{"allow_signups": true, "maintenance_mode": false}', 'Configurações gerais do sistema');

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();