// ============================================
// MobileGuard - Proteção de Rotas para Mobile
// ============================================
// Bloqueia acesso a módulos sensíveis em ambiente Capacitor
// Exibe tela amigável de "módulo não disponível"

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useMobileEnvironment, isRouteBlockedOnMobile, isModuleBlockedOnMobile } from '@/hooks/useMobileEnvironment';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { ShieldX, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileGuardProps {
  children: React.ReactNode;
  /** Código do módulo a verificar */
  moduleCode?: string;
  /** Rota de fallback quando bloqueado */
  fallbackRoute?: string;
  /** Mostrar tela de bloqueio ao invés de redirecionar */
  showBlockedScreen?: boolean;
}

/**
 * Tela exibida quando um módulo está bloqueado no mobile
 */
function MobileBlockedScreen({ 
  moduleName = 'Este módulo',
  onBack,
}: { 
  moduleName?: string;
  onBack?: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Smartphone className="h-10 w-10 text-muted-foreground" />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">
        Módulo não disponível
      </h1>
      
      <p className="text-muted-foreground max-w-sm mb-6">
        {moduleName} não está disponível na versão mobile do aplicativo. 
        Por favor, acesse através de um navegador web para utilizar esta funcionalidade.
      </p>
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button 
          variant="default" 
          onClick={onBack || (() => window.history.back())}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/academy'}
          className="w-full"
        >
          Ir para Academy
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-8">
        Versão mobile • Alguns recursos estão disponíveis apenas na versão web
      </p>
    </div>
  );
}

/**
 * Guard para bloquear rotas/módulos em ambiente mobile
 */
export function MobileGuard({ 
  children, 
  moduleCode,
  fallbackRoute = '/academy',
  showBlockedScreen = true,
}: MobileGuardProps) {
  const location = useLocation();
  const { isNative, shouldBlockSensitiveModules } = useMobileEnvironment();
  const { isModuleEnabledOnMobile } = useFeatureFlags();

  // Se não está em ambiente nativo, renderizar normalmente
  if (!isNative) {
    return <>{children}</>;
  }

  // Verificar se a rota atual está bloqueada
  const isRouteBlocked = isRouteBlockedOnMobile(location.pathname);
  
  // Verificar se o módulo específico está bloqueado
  const isModuleBlocked = moduleCode 
    ? isModuleBlockedOnMobile(moduleCode) || !isModuleEnabledOnMobile(moduleCode)
    : false;

  // Se rota ou módulo bloqueado
  if (isRouteBlocked || isModuleBlocked) {
    if (showBlockedScreen) {
      return <MobileBlockedScreen onBack={() => window.history.back()} />;
    }
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}

/**
 * Componente para ocultar conteúdo em ambiente mobile
 */
export function HideOnMobile({ children }: { children: React.ReactNode }) {
  const { isNative } = useMobileEnvironment();
  
  if (isNative) return null;
  return <>{children}</>;
}

/**
 * Componente para mostrar conteúdo apenas em ambiente mobile
 */
export function ShowOnMobile({ children }: { children: React.ReactNode }) {
  const { isNative } = useMobileEnvironment();
  
  if (!isNative) return null;
  return <>{children}</>;
}

export default MobileGuard;
