-- Remove duplicated roles with variations (keep only the main ones)
DELETE FROM public.staff_roles WHERE code IN (
  'sdr_ibramec',
  'closer_ibramec',
  'responsavel_tecnica',
  'supervisor_operacional',
  'supervisor_comercial',
  'diretor_marketing',
  'gestor_growth',
  'video_maker',
  'social_media',
  'analista_dados',
  'especialista_crm',
  'gestor_ia',
  'lider_equipe',
  'diretor_juridico',
  'auxiliar_financeiro'
);

-- Update remaining roles for clarity
UPDATE public.staff_roles SET 
  name = 'SDR / Pré-Vendas',
  description = 'Prospecção, qualificação e agendamento de leads'
WHERE code = 'sdr';

UPDATE public.staff_roles SET 
  name = 'Closer / Vendedor',
  description = 'Fechamento de vendas e negociações'
WHERE code = 'closer';

UPDATE public.staff_roles SET 
  name = 'Gerente / Coordenador',
  description = 'Gestão de equipes e processos'
WHERE code = 'gerente_geral';

UPDATE public.staff_roles SET 
  name = 'CEO / Diretor',
  description = 'Direção executiva e estratégica',
  default_route = '/admin-dashboard'
WHERE code = 'ceo';

UPDATE public.staff_roles SET 
  name = 'Sócio / Proprietário',
  description = 'Proprietário ou sócio da empresa',
  default_route = '/admin-dashboard'
WHERE code = 'socio';

-- Update enfermagem to include técnicos
UPDATE public.staff_roles SET 
  name = 'Enfermagem / Técnico',
  description = 'Suporte clínico, procedimentos e preparação'
WHERE code = 'enfermagem';

-- Simplify triagem
UPDATE public.staff_roles SET 
  name = 'Triagem / Avaliação',
  description = 'Triagem de pacientes e avaliação inicial'
WHERE code = 'triagem';

-- Simplify procedimentos
UPDATE public.staff_roles SET 
  name = 'Técnico de Procedimentos',
  description = 'Execução e assistência em procedimentos clínicos'
WHERE code = 'procedimentos';

-- Simplify recepcao
UPDATE public.staff_roles SET 
  name = 'Recepção / Atendimento',
  description = 'Check-in, agendamento e atendimento ao cliente'
WHERE code = 'recepcao';

-- Add Marketing role (consolidated)
INSERT INTO public.staff_roles (code, name, department, description, default_route, icon, color) 
VALUES ('marketing', 'Marketing / Growth', 'marketing', 'Marketing digital, conteúdo e crescimento', '/neoteam/marketing', 'Megaphone', 'text-pink-500')
ON CONFLICT (code) DO NOTHING;

-- Add TI role (consolidated)
INSERT INTO public.staff_roles (code, name, department, description, default_route, icon, color) 
VALUES ('ti', 'TI / Automações', 'ti_dados', 'Tecnologia, automações e integrações', '/neoteam/analytics', 'Workflow', 'text-purple-500')
ON CONFLICT (code) DO NOTHING;

-- Rename coordenacao to be clearer
UPDATE public.staff_roles SET 
  name = 'Supervisão / Coordenação',
  description = 'Supervisão operacional e coordenação de áreas'
WHERE code = 'coordenacao';