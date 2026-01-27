// ====================================
// Guards - Exportações Centralizadas
// ====================================

// Guards unificados (principal)
export {
  ProtectedRoute,
  RouteGuard,
  ProfileGuard,
  PortalGuard,
  AdminRoute,
  ComponentGuard,
} from './UnifiedGuards';

// Module guards (nova arquitetura)
export { ModuleGuard, AcademyGuard, RequireAnyAcademy } from './ModuleGuard';

// Mobile guards (controle de acesso mobile)
export { MobileGuard, HideOnMobile, ShowOnMobile } from './MobileGuard';

// Re-export types
export type { NeoHubProfile, Portal } from '@/contexts/UnifiedAuthContext';

// Legacy exports for compatibility
export { AdminOnly, IfCanRead, IfCanWrite, IfCanDelete } from './ComponentGuard';
