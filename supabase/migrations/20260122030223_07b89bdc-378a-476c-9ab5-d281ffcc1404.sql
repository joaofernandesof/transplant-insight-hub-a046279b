-- Create department enum for categorization
CREATE TYPE public.staff_department AS ENUM (
  'clinico',
  'operacoes',
  'comercial',
  'sucesso_paciente',
  'marketing',
  'financeiro',
  'ti_dados',
  'gestao',
  'executivo'
);

-- Create staff roles table
CREATE TABLE public.staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  department staff_department NOT NULL,
  description TEXT,
  default_route VARCHAR(255),
  icon VARCHAR(50) DEFAULT 'User',
  color VARCHAR(50) DEFAULT 'text-gray-500',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table linking users to roles
CREATE TABLE public.staff_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neohub_user_id UUID NOT NULL REFERENCES public.neohub_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.staff_roles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.neoteam_branches(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(neohub_user_id, role_id, branch_id)
);

-- Enable RLS
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for staff_roles (read-only for authenticated, admin can modify)
CREATE POLICY "Authenticated users can read roles"
ON public.staff_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage roles"
ON public.staff_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.neohub_user_profiles nup
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.user_id = auth.uid()
    AND nup.profile = 'administrador'
    AND nup.is_active = true
  )
);

-- RLS policies for staff_user_roles
CREATE POLICY "Users can see own roles"
ON public.staff_user_roles FOR SELECT
TO authenticated
USING (
  neohub_user_id IN (
    SELECT id FROM public.neohub_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage user roles"
ON public.staff_user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.neohub_user_profiles nup
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.user_id = auth.uid()
    AND nup.profile = 'administrador'
    AND nup.is_active = true
  )
);

-- Insert initial roles by department
INSERT INTO public.staff_roles (code, name, department, description, default_route, icon, color) VALUES
-- Clínico
('medico', 'Médico', 'clinico', 'Responsável pelos atendimentos e prontuários', '/neoteam/doctor-view', 'Stethoscope', 'text-cyan-500'),
('triagem', 'Triagem', 'clinico', 'Responsável pela triagem de pacientes', '/neoteam/nursing', 'HeartPulse', 'text-pink-500'),
('enfermagem', 'Enfermagem', 'clinico', 'Suporte clínico e procedimentos', '/neoteam/nursing', 'Heart', 'text-pink-400'),
('responsavel_tecnica', 'Responsável Técnica', 'clinico', 'Supervisão técnica dos procedimentos', '/neoteam/coordination', 'ClipboardCheck', 'text-purple-500'),

-- Operações
('recepcao', 'Recepcionista', 'operacoes', 'Atendimento, agenda e check-in', '/neoteam/reception', 'Phone', 'text-blue-500'),
('supervisor_operacional', 'Supervisor Operacional', 'operacoes', 'Supervisão das operações diárias', '/neoteam/coordination', 'Settings', 'text-slate-600'),
('procedimentos', 'Procedimentos', 'operacoes', 'Execução de procedimentos', '/neoteam/nursing', 'Syringe', 'text-orange-500'),

-- Comercial
('sdr', 'SDR', 'comercial', 'Prospecção e qualificação de leads', '/neoteam/commercial', 'PhoneCall', 'text-green-500'),
('sdr_ibramec', 'SDR IBRAMEC', 'comercial', 'SDR focado no canal IBRAMEC', '/neoteam/commercial', 'PhoneCall', 'text-emerald-500'),
('closer', 'Closer', 'comercial', 'Fechamento de vendas', '/neoteam/commercial', 'Target', 'text-red-500'),
('closer_ibramec', 'Closer IBRAMEC', 'comercial', 'Closer focado no canal IBRAMEC', '/neoteam/commercial', 'Target', 'text-rose-500'),
('supervisor_comercial', 'Supervisor Comercial', 'comercial', 'Gestão da equipe comercial', '/neoteam/commercial', 'TrendingUp', 'text-amber-500'),
('relacionamento_cliente', 'Relacionamento Cliente', 'comercial', 'Pós-venda e relacionamento', '/neoteam/commercial', 'Users', 'text-violet-500'),

-- Sucesso do Paciente
('sucesso_paciente', 'Sucesso do Paciente', 'sucesso_paciente', 'Acompanhamento e satisfação', '/neoteam/patient-success', 'Star', 'text-yellow-500'),

-- Marketing
('social_media', 'Social Media', 'marketing', 'Gestão de redes sociais', '/neoteam/marketing', 'Instagram', 'text-fuchsia-500'),
('video_maker', 'Vídeo Maker', 'marketing', 'Produção de conteúdo audiovisual', '/neoteam/marketing', 'Video', 'text-indigo-500'),
('gestor_growth', 'Gestor de Growth', 'marketing', 'Estratégias de crescimento', '/neoteam/marketing', 'Rocket', 'text-lime-500'),
('diretor_marketing', 'Diretor de Marketing', 'marketing', 'Direção de marketing', '/neoteam/coordination', 'Megaphone', 'text-pink-600'),

-- Financeiro
('auxiliar_financeiro', 'Auxiliar Financeiro', 'financeiro', 'Suporte às operações financeiras', '/neoteam/financial', 'Calculator', 'text-green-600'),
('financeiro', 'Financeiro', 'financeiro', 'Gestão financeira', '/neoteam/financial', 'DollarSign', 'text-emerald-600'),

-- TI/Dados
('analista_dados', 'Analista de Dados', 'ti_dados', 'Análise e relatórios de dados', '/neoteam/analytics', 'BarChart', 'text-blue-600'),
('especialista_crm', 'Especialista CRM', 'ti_dados', 'Automações e integrações', '/neoteam/analytics', 'Workflow', 'text-cyan-600'),
('gestor_ia', 'Gestor de IA', 'ti_dados', 'Gestão de inteligência artificial', '/neoteam/analytics', 'Brain', 'text-purple-600'),

-- Gestão
('lider_equipe', 'Líder de Equipe', 'gestao', 'Liderança de equipe operacional', '/neoteam/coordination', 'Users', 'text-blue-700'),
('gerente_geral', 'Gerente Geral', 'gestao', 'Gestão geral da operação', '/neoteam', 'Briefcase', 'text-slate-700'),
('coordenacao', 'Coordenação', 'gestao', 'Coordenação de processos', '/neoteam/coordination', 'Network', 'text-indigo-600'),

-- Executivo
('ceo', 'CEO', 'executivo', 'Chief Executive Officer', '/admin', 'Crown', 'text-amber-600'),
('socio', 'Sócio Proprietário', 'executivo', 'Sócio proprietário da empresa', '/admin', 'Building', 'text-yellow-600'),
('diretor_juridico', 'Diretor Jurídico', 'executivo', 'Direção jurídica', '/admin', 'Scale', 'text-gray-600');

-- Create role permissions table for granular module access
CREATE TABLE public.staff_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.staff_roles(id) ON DELETE CASCADE,
  module_code VARCHAR(100) NOT NULL,
  can_read BOOLEAN DEFAULT false,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role_id, module_code)
);

ALTER TABLE public.staff_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read role permissions"
ON public.staff_role_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage role permissions"
ON public.staff_role_permissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.neohub_user_profiles nup
    JOIN public.neohub_users nu ON nu.id = nup.neohub_user_id
    WHERE nu.user_id = auth.uid()
    AND nup.profile = 'administrador'
    AND nup.is_active = true
  )
);

-- Create function to get user staff roles
CREATE OR REPLACE FUNCTION public.get_user_staff_roles(p_user_id UUID)
RETURNS TABLE(
  role_code VARCHAR,
  role_name VARCHAR,
  department staff_department,
  default_route VARCHAR,
  icon VARCHAR,
  color VARCHAR,
  branch_id UUID,
  branch_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.code,
    sr.name,
    sr.department,
    sr.default_route,
    sr.icon,
    sr.color,
    sur.branch_id,
    nb.name as branch_name
  FROM staff_user_roles sur
  JOIN staff_roles sr ON sr.id = sur.role_id
  JOIN neohub_users nu ON nu.id = sur.neohub_user_id
  LEFT JOIN neoteam_branches nb ON nb.id = sur.branch_id
  WHERE nu.user_id = p_user_id
    AND sur.is_active = true
    AND sr.is_active = true;
END;
$$;