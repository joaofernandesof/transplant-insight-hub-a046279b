// ====================================
// RouteGuard - Proteção de Rotas por Permissão
// ====================================
// Bloqueia acesso a rotas se o usuário não tiver permissão

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  /** Módulo requerido para acessar a rota */
  requiredModule?: string;
  /** Exige que o usuário seja admin */
  adminOnly?: boolean;
  /** Perfis permitidos (para NeoHub) */
  allowedProfiles?: string[];
  /** Rota de fallback quando acesso negado */
  fallbackRoute?: string;
}

export function RouteGuard({
  children,
  requiredModule,
  adminOnly = false,
  allowedProfiles,
  fallbackRoute = '/',
}: RouteGuardProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto carrega autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não está autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se é adminOnly e usuário não é admin
  if (adminOnly && !isAdmin) {
    console.warn(`[RouteGuard] Access denied to ${location.pathname}: adminOnly`);
    return <Navigate to={fallbackRoute} replace />;
  }

  // TODO: Integrar com sistema de permissões granulares
  // Quando o sistema de permissões estiver completo, verificar:
  // - requiredModule: hasPermission(requiredModule, 'read')
  // - allowedProfiles: user.profiles.some(p => allowedProfiles.includes(p))

  // Por enquanto, apenas verificação básica
  return <>{children}</>;
}

// ====================================
// ProtectedRoute - Wrapper simplificado
// ====================================
// Apenas verifica se está autenticado

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
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

export default RouteGuard;
