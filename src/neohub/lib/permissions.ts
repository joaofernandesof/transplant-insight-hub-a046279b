// ====================================
// NeoHub RBAC - Sistema de Permissões
// ====================================

export type NeoHubProfile = 
  | 'administrador'
  | 'licenciado'
  | 'colaborador'
  | 'medico'
  | 'aluno'
  | 'paciente'
  | 'cliente_avivar';

export type Portal = 'neocare' | 'neoteam' | 'academy' | 'neolicense' | 'avivar';

// Mapeamento de perfis para portais
export const PROFILE_PORTAL_MAP: Record<NeoHubProfile, Portal[]> = {
  administrador: ['neocare', 'neoteam', 'academy', 'neolicense', 'avivar'],
  licenciado: ['neolicense'],
  colaborador: ['neoteam'],
  medico: ['neoteam'],
  aluno: ['academy'],
  paciente: ['neocare'],
  cliente_avivar: ['avivar'],
};

// Mapeamento de perfis para rotas base
export const PROFILE_ROUTES: Record<NeoHubProfile, string> = {
  administrador: '/admin-dashboard', // Admin vai direto para o Dashboard Admin (Início)
  licenciado: '/neolicense',
  colaborador: '/neoteam',
  medico: '/neoteam/doctor-view',
  aluno: '/academy',
  paciente: '/neocare',
  cliente_avivar: '/avivar',
};

// Nomes amigáveis dos perfis
export const PROFILE_NAMES: Record<NeoHubProfile, string> = {
  administrador: 'Administrador',
  licenciado: 'Licença ByNeoFolic',
  colaborador: 'NeoTeam',
  medico: 'Médico',
  aluno: 'IBRAMEC',
  paciente: 'NeoCare',
  cliente_avivar: 'Avivar',
};

// Nomes amigáveis dos portais
export const PORTAL_NAMES: Record<Portal, string> = {
  neocare: 'NeoCare',
  neoteam: 'NeoTeam',
  academy: 'IBRAMEC',
  neolicense: 'Licença ByNeoFolic',
  avivar: 'Avivar',
};

// Ícones dos perfis (lucide-react)
export const PROFILE_ICONS: Record<NeoHubProfile, string> = {
  administrador: 'Shield',
  licenciado: 'Building2',
  colaborador: 'Users',
  medico: 'Stethoscope',
  aluno: 'GraduationCap',
  paciente: 'Heart',
  cliente_avivar: 'TrendingUp',
};

// Cores dos perfis (Tailwind)
export const PROFILE_COLORS: Record<NeoHubProfile, string> = {
  administrador: 'text-red-500',
  licenciado: 'text-amber-500', // Dourado para Licença ByNeoFolic
  colaborador: 'text-blue-500',
  medico: 'text-cyan-500',
  aluno: 'text-emerald-500', // Verde para IBRAMEC
  paciente: 'text-pink-500',
  cliente_avivar: 'text-orange-500',
};

// Verificar se perfil é admin (bypass de permissões)
export function isAdminProfile(profile: NeoHubProfile | null): boolean {
  return profile === 'administrador';
}

// Verificar se perfil pode acessar portal
export function canAccessPortal(profile: NeoHubProfile | null, portal: Portal): boolean {
  if (!profile) return false;
  if (isAdminProfile(profile)) return true;
  return PROFILE_PORTAL_MAP[profile]?.includes(portal) ?? false;
}

// Verificar se perfil pode acessar rota
export function canAccessRoute(profile: NeoHubProfile | null, route: string): boolean {
  if (!profile) return false;
  if (isAdminProfile(profile)) return true;

  const portal = getPortalFromRoute(route);
  if (!portal) return false;

  return canAccessPortal(profile, portal);
}

// Extrair portal da rota
export function getPortalFromRoute(route: string): Portal | null {
  if (route.startsWith('/neocare')) return 'neocare';
  if (route.startsWith('/neoteam')) return 'neoteam';
  if (route.startsWith('/academy')) return 'academy';
  if (route.startsWith('/neolicense')) return 'neolicense';
  if (route.startsWith('/avivar')) return 'avivar';
  return null;
}

// Obter módulos permitidos por perfil
export interface ModulePermission {
  moduleCode: string;
  moduleName: string;
  portal: Portal;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

// Módulos por portal (para menus dinâmicos)
export const PORTAL_MODULES: Record<Portal, { code: string; name: string; route: string; icon: string }[]> = {
  neocare: [
    { code: 'neocare_home', name: 'Início', route: '/neocare', icon: 'Home' },
    { code: 'neocare_appointments', name: 'Meus Agendamentos', route: '/neocare/appointments', icon: 'Calendar' },
    { code: 'neocare_history', name: 'Histórico Clínico', route: '/neocare/my-records', icon: 'FileText' },
    { code: 'neocare_payments', name: 'Pagamentos', route: '/neocare/my-invoices', icon: 'CreditCard' },
    { code: 'neocare_teleconsultation', name: 'Teleconsulta', route: '/neocare/teleconsultation', icon: 'Video' },
    { code: 'neocare_support', name: 'Suporte', route: '/neocare/support', icon: 'HelpCircle' },
    { code: 'neocare_profile', name: 'Configurações', route: '/neocare/settings', icon: 'Settings' },
  ],
  neoteam: [
    { code: 'neoteam_home', name: 'Início', route: '/neoteam', icon: 'Home' },
    { code: 'neoteam_schedule', name: 'Agenda', route: '/neoteam/schedule', icon: 'Calendar' },
    { code: 'neoteam_waiting_room', name: 'Sala de Espera', route: '/neoteam/waiting-room', icon: 'Clock' },
    { code: 'neoteam_patients', name: 'Pacientes', route: '/neoteam/patients', icon: 'Users' },
    { code: 'neoteam_medical_records', name: 'Prontuários', route: '/neoteam/medical-records', icon: 'FileText' },
    { code: 'neoteam_documents', name: 'Documentos', route: '/neoteam/documents', icon: 'Folder' },
    { code: 'neoteam_profile', name: 'Configurações', route: '/neoteam/settings', icon: 'Settings' },
  ],
  academy: [
    { code: 'academy_home', name: 'Início', route: '/academy', icon: 'Home' },
    { code: 'academy_courses', name: 'Cursos', route: '/academy/courses', icon: 'BookOpen' },
    { code: 'academy_materials', name: 'Materiais', route: '/academy/materials', icon: 'FileText' },
    { code: 'academy_certificates', name: 'Certificados', route: '/academy/certificates', icon: 'Award' },
    { code: 'academy_community', name: 'Comunidade', route: '/academy/community', icon: 'Users' },
    { code: 'academy_career', name: 'Carreira', route: '/academy/career', icon: 'TrendingUp' },
    { code: 'academy_profile', name: 'Configurações', route: '/academy/profile', icon: 'Settings' },
  ],
  neolicense: [
    { code: 'neolicense_home', name: 'Início', route: '/neolicense', icon: 'Home' },
    { code: 'neolicense_dashboard', name: 'Dashboard', route: '/neolicense/dashboard', icon: 'BarChart3' },
    { code: 'neolicense_hotleads', name: 'HotLeads', route: '/neolicense/hotleads', icon: 'Flame' },
    { code: 'neolicense_surgery', name: 'Cirurgias', route: '/neolicense/surgery', icon: 'Calendar' },
    { code: 'neolicense_university', name: 'Universidade', route: '/neolicense/university', icon: 'GraduationCap' },
    { code: 'neolicense_materials', name: 'Materiais', route: '/neolicense/materials', icon: 'FileText' },
    { code: 'neolicense_partners', name: 'Parceiros', route: '/neolicense/partners', icon: 'Handshake' },
    { code: 'neolicense_gamification', name: 'Conquistas', route: '/neolicense/achievements', icon: 'Trophy' },
    { code: 'neolicense_referral', name: 'Indicações', route: '/neolicense/referral', icon: 'Users' },
    { code: 'neolicense_regularization', name: 'Regularização', route: '/neolicense/structure', icon: 'Building' },
    { code: 'neolicense_profile', name: 'Perfil', route: '/neolicense/profile', icon: 'Settings' },
  ],
  avivar: [
    { code: 'avivar_home', name: 'Início', route: '/avivar', icon: 'Home' },
    { code: 'avivar_dashboard', name: 'Dashboard', route: '/avivar/dashboard', icon: 'BarChart3' },
    { code: 'avivar_hotleads', name: 'HotLeads', route: '/avivar/hotleads', icon: 'Flame' },
    { code: 'avivar_traffic', name: 'Tráfego', route: '/avivar/traffic', icon: 'TrendingUp' },
    { code: 'avivar_marketing', name: 'Marketing', route: '/avivar/marketing', icon: 'Megaphone' },
    { code: 'avivar_mentorship', name: 'Mentoria', route: '/avivar/mentorship', icon: 'Users' },
    { code: 'avivar_profile', name: 'Perfil', route: '/avivar/profile', icon: 'Settings' },
  ],
};

// Obter rota padrão para perfil
export function getDefaultRouteForProfile(profile: NeoHubProfile): string {
  return PROFILE_ROUTES[profile] || '/';
}

// Obter primeiro portal disponível para lista de perfis
export function getFirstAvailablePortal(profiles: NeoHubProfile[]): Portal | null {
  // Admin vai direto para o dashboard, não precisa de portal específico
  if (profiles.includes('administrador')) return null;
  
  for (const profile of profiles) {
    const portals = PROFILE_PORTAL_MAP[profile];
    if (portals?.length > 0) {
      return portals[0];
    }
  }
  return null;
}
