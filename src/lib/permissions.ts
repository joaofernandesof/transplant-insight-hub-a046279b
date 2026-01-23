// ============================================
// permissions.ts - Sistema Único de Autorização
// ============================================
// Fonte única de verdade para permissões no frontend.
// Todas as verificações passam por canAccessModule().
// Nenhuma lógica hardcoded de perfil→módulo.

// ============================================
// TIPOS
// ============================================

export type PermissionAction = 'read' | 'write' | 'delete';

export interface ModulePermission {
  moduleCode: string;
  action: PermissionAction;
}

// Módulos Academy segmentados por empresa
export const ACADEMY_MODULES = {
  IBRAMEC: 'academy_ibramec',
  BYNEOFOLIC: 'academy_byneofolic',
  AVIVAR: 'academy_avivar',
  OPERACAO_NEOFOLIC: 'academy_operacao_neofolic',
} as const;

export type AcademyModuleCode = typeof ACADEMY_MODULES[keyof typeof ACADEMY_MODULES];

// Metadados dos módulos Academy para UI
export const ACADEMY_MODULE_INFO: Record<AcademyModuleCode, { name: string; description: string; icon: string; color: string }> = {
  academy_ibramec: {
    name: 'Academy IBRAMEC',
    description: 'Formação presencial e online em tricologia',
    icon: 'GraduationCap',
    color: 'from-blue-500 to-blue-600',
  },
  academy_byneofolic: {
    name: 'Academy ByNeofolic',
    description: 'Treinamentos e certificações para licenciados',
    icon: 'Award',
    color: 'from-emerald-500 to-emerald-600',
  },
  academy_avivar: {
    name: 'Academy Avivar',
    description: 'Conteúdos exclusivos do programa Avivar',
    icon: 'Sparkles',
    color: 'from-purple-500 to-purple-600',
  },
  academy_operacao_neofolic: {
    name: 'Academy Operação NeoFolic',
    description: 'Treinamentos operacionais internos',
    icon: 'Settings',
    color: 'from-orange-500 to-orange-600',
  },
};

// ============================================
// PARSER DE PERMISSÕES
// ============================================

/**
 * Converte array de strings "module:action" para estrutura tipada
 */
export function parsePermissions(permissions: string[]): ModulePermission[] {
  return permissions
    .filter(p => p && p.includes(':'))
    .map(p => {
      const [moduleCode, action] = p.split(':');
      return { moduleCode, action: action as PermissionAction };
    });
}

/**
 * Verifica se uma permissão específica existe no array
 */
export function hasModulePermission(
  permissions: string[],
  moduleCode: string,
  action: PermissionAction = 'read'
): boolean {
  const key = `${moduleCode}:${action}`;
  return permissions.includes(key);
}

/**
 * Retorna todos os módulos que o usuário pode acessar (read)
 */
export function getAccessibleModules(permissions: string[]): string[] {
  return permissions
    .filter(p => p.endsWith(':read'))
    .map(p => p.replace(':read', ''));
}

/**
 * Retorna apenas os módulos Academy acessíveis
 */
export function getAccessibleAcademyModules(permissions: string[]): AcademyModuleCode[] {
  const academyPrefix = 'academy_';
  return getAccessibleModules(permissions)
    .filter(m => m.startsWith(academyPrefix)) as AcademyModuleCode[];
}

/**
 * Verifica se o usuário pode acessar qualquer Academy
 */
export function canAccessAnyAcademy(permissions: string[]): boolean {
  return getAccessibleAcademyModules(permissions).length > 0;
}

// ============================================
// CONSTANTES DE MÓDULOS (para referência)
// ============================================

export const ALL_MODULE_CODES = {
  // Academy
  ...ACADEMY_MODULES,
  
  // NeoCare
  NEOCARE_APPOINTMENTS: 'neocare_appointments',
  NEOCARE_DOCUMENTS: 'neocare_documents',
  NEOCARE_HISTORY: 'neocare_history',
  NEOCARE_PROFILE: 'neocare_profile',
  
  // NeoTeam
  NEOTEAM_SCHEDULE: 'neoteam_schedule',
  NEOTEAM_PATIENTS: 'neoteam_patients',
  NEOTEAM_WAITING_ROOM: 'neoteam_waiting_room',
  NEOTEAM_DOCUMENTS: 'neoteam_documents',
  
  // NeoLicense
  NEOLICENSE_DASHBOARD: 'neolicense_dashboard',
  NEOLICENSE_HOTLEADS: 'neolicense_hotleads',
  NEOLICENSE_SURGERY: 'neolicense_surgery',
  NEOLICENSE_MATERIALS: 'neolicense_materials',
  
  // Avivar
  AVIVAR_DASHBOARD: 'avivar_dashboard',
  AVIVAR_HOTLEADS: 'avivar_hotleads',
  AVIVAR_MARKETING: 'avivar_marketing',
} as const;

export type ModuleCode = typeof ALL_MODULE_CODES[keyof typeof ALL_MODULE_CODES];
