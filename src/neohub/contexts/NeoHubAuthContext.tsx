// ====================================
// NeoHubAuthContext - Wrapper de Compatibilidade
// ====================================
// Este arquivo mantém compatibilidade com código NeoHub existente.
// Internamente, usa o UnifiedAuthContext.
//
// NOTA: Para novo código, use diretamente:
// import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

// Re-exportar tudo do UnifiedAuthContext
export {
  // Provider e Hook
  UnifiedAuthProvider as NeoHubAuthProvider,
  useUnifiedAuth as useNeoHubAuth,
  
  // Tipos
  type UnifiedUser as NeoHubUser,
  type NeoHubProfile,
  type Portal,
  
  // Constantes e funções de permissão
  PROFILE_ROUTES,
  PROFILE_NAMES,
  PROFILE_PORTAL_MAP,
  isAdminProfile,
  canAccessPortal,
  canAccessRoute,
  getDefaultRouteForProfile,
} from '@/contexts/UnifiedAuthContext';
