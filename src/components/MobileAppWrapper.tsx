// ============================================
// MobileAppWrapper - Wrapper para App Mobile
// ============================================
// Aplica configurações e guards específicos para ambiente Capacitor
// Deve envolver todo o conteúdo do app em ambiente mobile

import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useMobileEnvironment, isRouteBlockedOnMobile } from '@/hooks/useMobileEnvironment';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2 } from 'lucide-react';

interface MobileAppWrapperProps {
  children: React.ReactNode;
}

/**

/**
 * Tela de Loading simples para transições
 */
function MobileLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Wrapper principal para ambiente mobile
 * Aplica guards e configurações específicas
 */
export function MobileAppWrapper({ children }: MobileAppWrapperProps) {
  const location = useLocation();
  const { isNative, shouldBlockSensitiveModules } = useMobileEnvironment();
  const { isLoading: authLoading, user } = useUnifiedAuth();

  // Se está em web, renderizar normalmente
  if (!isNative) {
    return <>{children}</>;
  }

  // Mostrar loading durante autenticação
  if (authLoading) {
    return <MobileLoadingScreen />;
  }

  // Para usuários não autenticados em mobile, permitir apenas rotas públicas
  if (!user) {
    const publicRoutes = ['/login', '/reset-password', '/privacy-policy', '/terms', '/indicacao'];
    const isPublicRoute = publicRoutes.some(r => location.pathname.startsWith(r));
    
    if (!isPublicRoute && location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }

  // Usuário autenticado: redirecionar rotas bloqueadas para o seletor de portais
  if (shouldBlockSensitiveModules && isRouteBlockedOnMobile(location.pathname)) {
    const allowedRoutes = ['/login', '/reset-password', '/privacy-policy', '/terms', '/select-profile'];
    const isAllowed = allowedRoutes.some(r => location.pathname.startsWith(r));
    
    if (!isAllowed) {
      return <Navigate to="/select-profile" replace />;
    }
  }

  // Renderizar normalmente — HomeRouter cuida do roteamento em "/" e "/home"
  return <>{children}</>;
}

/**
 * Hook para obter informações de ambiente mobile em componentes
 */
export function useMobileAppContext() {
  const { isNative, platform, shouldBlockSensitiveModules } = useMobileEnvironment();
  const { user, isLoading } = useUnifiedAuth();

  return {
    isNative,
    platform,
    shouldBlockSensitiveModules,
    user,
    isLoading,
    // Helpers
    canAccessRoute: (route: string) => {
      if (!isNative) return true;
      return !isRouteBlockedOnMobile(route);
    },
  };
}

export default MobileAppWrapper;
