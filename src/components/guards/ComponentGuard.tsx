// ====================================
// ComponentGuard - Proteção de Componentes por Permissão
// ====================================
// Esconde ou desabilita componentes baseado em permissões

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ComponentGuardProps {
  children: React.ReactNode;
  /** Módulo requerido para exibir o componente */
  requiredModule?: string;
  /** Ação requerida (read, write, delete) */
  requiredAction?: 'read' | 'write' | 'delete';
  /** Exige que o usuário seja admin */
  adminOnly?: boolean;
  /** Perfis permitidos */
  allowedProfiles?: string[];
  /** Comportamento quando não tem permissão: 'hide' ou 'disable' */
  behavior?: 'hide' | 'disable';
  /** Componente alternativo quando não tem permissão */
  fallback?: React.ReactNode;
}

export function ComponentGuard({
  children,
  requiredModule,
  requiredAction = 'read',
  adminOnly = false,
  allowedProfiles,
  behavior = 'hide',
  fallback = null,
}: ComponentGuardProps) {
  const { user, isAdmin } = useAuth();

  // Se não está autenticado, não mostrar
  if (!user) {
    return behavior === 'hide' ? null : <>{fallback}</>;
  }

  // Se é adminOnly e usuário não é admin
  if (adminOnly && !isAdmin) {
    return behavior === 'hide' ? null : <>{fallback}</>;
  }

  // TODO: Integrar com sistema de permissões granulares
  // Quando o sistema de permissões estiver completo, verificar:
  // - requiredModule + requiredAction: hasPermission(requiredModule, requiredAction)
  // - allowedProfiles: user.profiles.some(p => allowedProfiles.includes(p))

  // Por enquanto, apenas verificação básica
  return <>{children}</>;
}

// ====================================
// AdminOnly - Wrapper para conteúdo admin
// ====================================

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return (
    <ComponentGuard adminOnly fallback={fallback}>
      {children}
    </ComponentGuard>
  );
}

// ====================================
// IfCanRead / IfCanWrite / IfCanDelete
// ====================================
// Wrappers semânticos para permissões específicas

interface PermissionWrapperProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function IfCanRead({ module, children, fallback }: PermissionWrapperProps) {
  return (
    <ComponentGuard requiredModule={module} requiredAction="read" fallback={fallback}>
      {children}
    </ComponentGuard>
  );
}

export function IfCanWrite({ module, children, fallback }: PermissionWrapperProps) {
  return (
    <ComponentGuard requiredModule={module} requiredAction="write" fallback={fallback}>
      {children}
    </ComponentGuard>
  );
}

export function IfCanDelete({ module, children, fallback }: PermissionWrapperProps) {
  return (
    <ComponentGuard requiredModule={module} requiredAction="delete" fallback={fallback}>
      {children}
    </ComponentGuard>
  );
}

export default ComponentGuard;
