// ============================================
// ModuleGuard - Proteção de Rotas por Módulo
// ============================================
// Usa exclusivamente canAccessModule() para verificar acesso.
// Nenhuma lógica de mapeamento hardcoded.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionAction } from '@/lib/permissions';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModuleGuardProps {
  children: React.ReactNode;
  /** Código do módulo requerido (ex: 'academy_ibramec') */
  moduleCode: string;
  /** Ação requerida (default: 'read') */
  action?: PermissionAction;
  /** Rota de fallback quando acesso negado */
  fallbackRoute?: string;
  /** Mostrar página de acesso negado ao invés de redirecionar */
  showAccessDenied?: boolean;
}

export function ModuleGuard({
  children,
  moduleCode,
  action = 'read',
  fallbackRoute = '/',
  showAccessDenied = false,
}: ModuleGuardProps) {
  const { canAccessModule, isLoading, isAdmin } = usePermissions();
  const location = useLocation();

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verificar acesso via canAccessModule (única fonte de verdade)
  const hasAccess = canAccessModule(moduleCode, action);

  if (!hasAccess) {
    console.warn(`[ModuleGuard] Access denied to ${location.pathname}: module=${moduleCode}, action=${action}`);
    
    if (showAccessDenied) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
          <ShieldX className="h-16 w-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Você não tem permissão para acessar este módulo.
            {!isAdmin && ' Entre em contato com o administrador para solicitar acesso.'}
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar
          </Button>
        </div>
      );
    }
    
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}

// ============================================
// AcademyGuard - Guard específico para Academy
// ============================================

interface AcademyGuardProps {
  children: React.ReactNode;
  /** Código do Academy (ex: 'academy_ibramec') */
  academyCode: string;
  action?: PermissionAction;
}

export function AcademyGuard({ children, academyCode, action = 'read' }: AcademyGuardProps) {
  return (
    <ModuleGuard
      moduleCode={academyCode}
      action={action}
      fallbackRoute="/academy"
      showAccessDenied
    >
      {children}
    </ModuleGuard>
  );
}

// ============================================
// RequireAnyAcademy - Requer acesso a qualquer Academy
// ============================================

interface RequireAnyAcademyProps {
  children: React.ReactNode;
  fallbackRoute?: string;
}

export function RequireAnyAcademy({ children, fallbackRoute = '/' }: RequireAnyAcademyProps) {
  const { canAccessAnyAcademy, isLoading } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canAccessAnyAcademy) {
    console.warn(`[RequireAnyAcademy] No academy access for ${location.pathname}`);
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}

export default ModuleGuard;
