// ============================================
// MobileAppWrapper - Wrapper para App Mobile
// ============================================
// Aplica configurações e guards específicos para ambiente Capacitor
// Deve envolver todo o conteúdo do app em ambiente mobile

import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useMobileEnvironment, isRouteBlockedOnMobile } from '@/hooks/useMobileEnvironment';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileAppWrapperProps {
  children: React.ReactNode;
}

/**
 * Tela de Splash para ambiente mobile
 */
function MobileSplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-4xl font-bold text-primary">N</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">NeoHub</h1>
        <Loader2 className="h-6 w-6 animate-spin text-white/70 mx-auto mt-4" />
      </div>
    </div>
  );
}

/**
 * Tela de Loading para transições
 */
function MobileLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    </div>
  );
}

/**
 * Tela de acesso negado para rotas bloqueadas
 */
function MobileBlockedRouteScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <Smartphone className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h1 className="text-xl font-bold mb-2 text-center">
        Recurso não disponível
      </h1>
      
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Este recurso não está disponível na versão mobile. 
        Acesse pelo navegador web para utilizar todas as funcionalidades.
      </p>
      
      <Button 
        variant="default"
        onClick={() => window.location.href = '/academy'}
        className="w-full max-w-xs"
      >
        Ir para Academy
      </Button>
    </div>
  );
}

/**
 * Wrapper principal para ambiente mobile
 * Aplica guards e configurações específicas
 */
export function MobileAppWrapper({ children }: MobileAppWrapperProps) {
  const location = useLocation();
  const { isNative, platform, shouldBlockSensitiveModules } = useMobileEnvironment();
  const { isLoading: authLoading, user } = useUnifiedAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Mostrar splash screen por 2 segundos no mobile
  useEffect(() => {
    if (isNative) {
      const timer = setTimeout(() => setShowSplash(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
    }
  }, [isNative]);

  // Se está em web, renderizar normalmente
  if (!isNative) {
    return <>{children}</>;
  }

  // Mostrar splash screen inicial
  if (showSplash) {
    return <MobileSplashScreen />;
  }

  // Mostrar loading durante autenticação
  if (authLoading) {
    return <MobileLoadingScreen />;
  }

  // Verificar se a rota atual está bloqueada no mobile
  if (shouldBlockSensitiveModules && isRouteBlockedOnMobile(location.pathname)) {
    // Permitir rotas públicas
    const publicRoutes = ['/login', '/reset-password', '/privacy-policy', '/terms'];
    const isPublicRoute = publicRoutes.some(r => location.pathname.startsWith(r));
    
    if (!isPublicRoute) {
      return <MobileBlockedRouteScreen />;
    }
  }

  // Para usuários não autenticados em mobile, permitir apenas rotas públicas
  if (!user) {
    const publicRoutes = ['/login', '/reset-password', '/privacy-policy', '/terms', '/indicacao'];
    const isPublicRoute = publicRoutes.some(r => location.pathname.startsWith(r));
    
    if (!isPublicRoute && location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
  }

  // Renderizar normalmente com guardrails
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
