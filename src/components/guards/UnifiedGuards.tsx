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

  // Verificar se tem perfil ativo
  if (!activeProfile) {
    return <Navigate to="/select-profile" replace />;
  }

  // Verificar se perfil ativo está na lista permitida
  if (!allowedProfiles.includes(activeProfile)) {
    // Verificar se o usuário tem algum dos perfis permitidos
    const hasAllowedProfile = allowedProfiles.some(p => hasProfile(p));
    if (hasAllowedProfile) {
      // Usuário tem o perfil mas não está ativo, redirecionar para seleção
      return <Navigate to="/select-profile" replace />;
    }
    // Usuário não tem nenhum dos perfis permitidos
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
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
// AdminRoute - Wrapper para rotas admin
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
