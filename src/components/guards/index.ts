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

// Re-export types
export type { NeoHubProfile, Portal } from '@/contexts/UnifiedAuthContext';

// Legacy exports for compatibility
export { AdminOnly, IfCanRead, IfCanWrite, IfCanDelete } from './ComponentGuard';
