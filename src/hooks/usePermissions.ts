// ============================================
// usePermissions - Hook Central de Autorização
// ============================================
// Este é o ÚNICO ponto de verificação de permissões no frontend.
// Todas as verificações usam os dados retornados pela RPC get_user_context().
// Nenhuma lógica de mapeamento perfil→módulo existe aqui.

import { useCallback, useMemo } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import {
  PermissionAction,
  hasModulePermission,
  getAccessibleModules,
  getAccessibleAcademyModules,
  canAccessAnyAcademy,
  ACADEMY_MODULE_INFO,
  AcademyModuleCode,
} from '@/lib/permissions';

export interface UsePermissionsReturn {
  // Estado
  permissions: string[];
  isAdmin: boolean;
  isLoading: boolean;
  
  // Verificações principais
  canAccessModule: (moduleCode: string, action?: PermissionAction) => boolean;
  
  // Helpers Academy
  accessibleAcademyModules: AcademyModuleCode[];
  canAccessAnyAcademy: boolean;
  getAcademyModuleInfo: (moduleCode: AcademyModuleCode) => typeof ACADEMY_MODULE_INFO[AcademyModuleCode];
  
  // Helpers genéricos
  accessibleModules: string[];
  canRead: (moduleCode: string) => boolean;
  canWrite: (moduleCode: string) => boolean;
  canDelete: (moduleCode: string) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, isLoading, isAdmin } = useUnifiedAuth();
  
  const permissions = useMemo(() => user?.permissions || [], [user]);
  
  /**
   * Verifica se o usuário pode acessar um módulo com uma ação específica.
   * Esta é a função principal de autorização - todas as verificações passam por aqui.
   * 
   * @param moduleCode - Código do módulo (ex: 'academy_ibramec')
   * @param action - Ação desejada ('read' | 'write' | 'delete')
   * @returns boolean
   */
  const canAccessModule = useCallback((
    moduleCode: string,
    action: PermissionAction = 'read'
  ): boolean => {
    // Admin tem bypass total
    if (isAdmin) return true;
    
    // Verificar se a permissão existe no array retornado pela RPC
    return hasModulePermission(permissions, moduleCode, action);
  }, [permissions, isAdmin]);
  
  // Módulos acessíveis (com read)
  const accessibleModules = useMemo(
    () => getAccessibleModules(permissions),
    [permissions]
  );
  
  // Módulos Academy acessíveis
  const accessibleAcademyModules = useMemo(
    () => getAccessibleAcademyModules(permissions),
    [permissions]
  );
  
  // Pode acessar qualquer Academy
  const canAccessAnyAcademyValue = useMemo(
    () => isAdmin || canAccessAnyAcademy(permissions),
    [permissions, isAdmin]
  );
  
  // Helpers de ação
  const canRead = useCallback(
    (moduleCode: string) => canAccessModule(moduleCode, 'read'),
    [canAccessModule]
  );
  
  const canWrite = useCallback(
    (moduleCode: string) => canAccessModule(moduleCode, 'write'),
    [canAccessModule]
  );
  
  const canDelete = useCallback(
    (moduleCode: string) => canAccessModule(moduleCode, 'delete'),
    [canAccessModule]
  );
  
  // Info do módulo Academy
  const getAcademyModuleInfo = useCallback(
    (moduleCode: AcademyModuleCode) => ACADEMY_MODULE_INFO[moduleCode],
    []
  );
  
  return {
    permissions,
    isAdmin,
    isLoading,
    canAccessModule,
    accessibleAcademyModules,
    canAccessAnyAcademy: canAccessAnyAcademyValue,
    getAcademyModuleInfo,
    accessibleModules,
    canRead,
    canWrite,
    canDelete,
  };
}

export default usePermissions;
