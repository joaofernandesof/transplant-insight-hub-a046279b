// ====================================
// UnifiedGuards - Guards Unificados
// ====================================
// Usa UnifiedAuthContext para controle de acesso

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth, NeoHubProfile, Portal } from '@/contexts/UnifiedAuthContext';
import { Loader2 } from 'lucide-react';

// ====================================
// ProtectedRoute - Apenas autenticação
// ====================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useUnifiedAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// ====================================
// RouteGuard - Proteção por permissão
// ====================================

interface RouteGuardProps {
  children: React.ReactNode;
  /** Módulo requerido para acessar a rota */
  requiredModule?: string;
  /** Exige que o usuário seja admin */
  adminOnly?: boolean;
  /** Perfis permitidos */
  allowedProfiles?: NeoHubProfile[];
  /** Rota de fallback quando acesso negado */
  fallbackRoute?: string;
}

export function RouteGuard({
  children,
  requiredModule,
  adminOnly = false,
  allowedProfiles,
  fallbackRoute = '/unauthorized',
}: RouteGuardProps) {
  const { user, isLoading, isAdmin, hasProfile, activeProfile } = useUnifiedAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não autenticado
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin bypass - admins podem acessar qualquer coisa
  if (isAdmin) {
    return <>{children}</>;
  }

  // Verificar adminOnly
  if (adminOnly) {
    console.warn(`[RouteGuard] Access denied to ${location.pathname}: adminOnly`);
    return <Navigate to={fallbackRoute} replace />;
  }

  // Verificar perfis permitidos
  if (allowedProfiles && allowedProfiles.length > 0) {
    const hasAllowedProfile = allowedProfiles.some(profile => hasProfile(profile));
    if (!hasAllowedProfile) {
      console.warn(`[RouteGuard] Access denied to ${location.pathname}: profile not allowed`);
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  // TODO: Verificar requiredModule quando sistema de permissões granulares estiver pronto

  return <>{children}</>;
}

// ====================================
// ProfileGuard - Proteção por perfil específico
// ====================================

interface ProfileGuardProps {
  children: React.ReactNode;
  allowedProfiles: NeoHubProfile[];
  fallbackRoute?: string;
}

export function ProfileGuard({
  children,
  allowedProfiles,
  fallbackRoute = '/select-profile',
}: ProfileGuardProps) {
  const { user, isLoading, isAdmin, activeProfile, hasProfile } = useUnifiedAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin bypass
  if (isAdmin) {
    return <>{children}</>;
  }

  // NOVO: Verificar acesso via portalRoles (fonte de verdade)
  const currentPath = location.pathname;
  const portalKeyFromRoute = getPortalKeyFromRoute(currentPath);
  
  if (portalKeyFromRoute) {
    // Para CPG/IPROMED, aceitar ambas as chaves legadas
    const portalKeysToCheck = portalKeyFromRoute === 'ipromed' 
      ? ['ipromed', 'cpg'] 
      : [portalKeyFromRoute];
    
    const hasPortalAccess = portalKeysToCheck.some(key => 
      user.allowedPortals.includes(key)
    );
    
    if (hasPortalAccess) {
      return <>{children}</>;
    }
  }

  // Fallback: verificar via perfis (compatibilidade)
  if (!activeProfile) {
    return <Navigate to="/select-profile" replace />;
  }

  if (!allowedProfiles.includes(activeProfile)) {
    const hasAllowedProfile = allowedProfiles.some(p => hasProfile(p));
    if (hasAllowedProfile) {
      return <Navigate to="/select-profile" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Helper: mapear rota para portal key
function getPortalKeyFromRoute(route: string): string | null {
  if (route.startsWith('/hotleads')) return 'hotleads';
  if (route.startsWith('/neolicense')) return 'neolicense';
  if (route.startsWith('/neoteam')) return 'neoteam';
  if (route.startsWith('/academy')) return 'academy';
  if (route.startsWith('/neocare')) return 'neocare';
  if (route.startsWith('/avivar')) return 'avivar';
  if (route.startsWith('/vision')) return 'vision';
  if (route.startsWith('/neopay')) return 'neopay';
  if (route.startsWith('/neoacademy')) return 'neoacademy';
  if (route.startsWith('/neorh')) return 'neoteam'; // legacy redirect
  if (route.startsWith('/cpg') || route.startsWith('/ipromed')) return 'ipromed';
  return null;
}

// ====================================
// PortalGuard - Proteção por portal
// ====================================

interface PortalGuardProps {
  children: React.ReactNode;
  portal: Portal;
  fallbackRoute?: string;
}

export function PortalGuard({
  children,
  portal,
  fallbackRoute = '/unauthorized',
}: PortalGuardProps) {
  const { user, isLoading, isAdmin, canAccess, activeProfile } = useUnifiedAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin bypass
  if (isAdmin) {
    return <>{children}</>;
  }

  // Verificar se tem perfil ativo
  if (!activeProfile) {
    return <Navigate to="/select-profile" replace />;
  }

  // Verificar acesso ao portal
  if (!canAccess(portal)) {
    console.warn(`[PortalGuard] Access denied to portal ${portal}`);
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}

// ====================================
// AdminRoute - Wrapper para rotas admin (administrador OU super_administrador)
// ====================================

interface AdminRouteProps {
  children: React.ReactNode;
  fallbackRoute?: string;
}

export function AdminRoute({ children, fallbackRoute = '/' }: AdminRouteProps) {
  return (
    <RouteGuard adminOnly fallbackRoute={fallbackRoute}>
      {children}
    </RouteGuard>
  );
}

// ====================================
// SuperAdminRoute - EXCLUSIVO para super_administrador
// ====================================
// SEGURANÇA: Apenas super_administrador pode acessar.
// isAdmin NÃO é suficiente — verificação explícita do perfil.

interface SuperAdminRouteProps {
  children: React.ReactNode;
  fallbackRoute?: string;
}

export function SuperAdminRoute({ children, fallbackRoute = '/unauthorized' }: SuperAdminRouteProps) {
  const { user, isLoading, isSuperAdmin } = useUnifiedAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isSuperAdmin) {
    console.warn(`[SuperAdminRoute] BLOCKED: User ${user.email} tried to access ${location.pathname} without super_admin`);
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}

// ====================================
// ComponentGuard - Proteção de componentes
// ====================================

interface ComponentGuardProps {
  children: React.ReactNode;
  /** Módulo requerido para mostrar o componente */
  requiredModule?: string;
  /** Exige que o usuário seja admin */
  adminOnly?: boolean;
  /** Perfis permitidos */
  allowedProfiles?: NeoHubProfile[];
  /** Componente fallback quando acesso negado (opcional) */
  fallback?: React.ReactNode;
}

export function ComponentGuard({
  children,
  requiredModule,
  adminOnly = false,
  allowedProfiles,
  fallback = null,
}: ComponentGuardProps) {
  const { user, isAdmin, hasProfile, hasModule } = useUnifiedAuth();

  // Não autenticado
  if (!user) {
    return <>{fallback}</>;
  }

  // Admin bypass
  if (isAdmin) {
    return <>{children}</>;
  }

  // Verificar adminOnly
  if (adminOnly) {
    return <>{fallback}</>;
  }

  // Verificar perfis permitidos
  if (allowedProfiles && allowedProfiles.length > 0) {
    const hasAllowedProfile = allowedProfiles.some(profile => hasProfile(profile));
    if (!hasAllowedProfile) {
      return <>{fallback}</>;
    }
  }

  // Verificar módulo requerido
  if (requiredModule && !hasModule(requiredModule)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default RouteGuard;
