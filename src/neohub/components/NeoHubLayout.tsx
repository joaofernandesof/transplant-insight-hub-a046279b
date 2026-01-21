// ====================================
// NeoHubLayout - Layouts e Guards para NeoHub
// ====================================
// Usa UnifiedAuthContext via wrapper de compatibilidade

import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { 
  useUnifiedAuth,
  NeoHubProfile, 
  Portal,
  PROFILE_ROUTES,
  canAccessPortal,
} from '@/contexts/UnifiedAuthContext';
import { Loader2 } from 'lucide-react';

interface NeoHubLayoutProps {
  children?: React.ReactNode;
}

export function NeoHubLayout({ children }: NeoHubLayoutProps) {
  const { user, isLoading, activeProfile, setActiveProfile } = useUnifiedAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se não está logado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se usuário tem apenas um perfil, definir automaticamente
  if (user.profiles.length === 1 && !activeProfile) {
    setActiveProfile(user.profiles[0]);
    return <Navigate to={PROFILE_ROUTES[user.profiles[0]]} replace />;
  }

  // Se tem múltiplos perfis e nenhum selecionado, mostrar seleção
  if (user.profiles.length > 1 && !activeProfile && location.pathname === '/') {
    return <Navigate to="/select-profile" replace />;
  }

  return <>{children || <Outlet />}</>;
}

// HOC para proteger rotas por perfil
interface ProfileGuardProps {
  allowedProfiles: NeoHubProfile[];
  children: React.ReactNode;
}

export function ProfileGuard({ allowedProfiles, children }: ProfileGuardProps) {
  const { user, activeProfile, isLoading } = useUnifiedAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin tem acesso total
  if (user.isAdmin) {
    return <>{children}</>;
  }

  // Verificar se o usuário tem algum dos perfis permitidos
  const hasAccess = allowedProfiles.some(profile => user.profiles.includes(profile));

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar se o perfil ativo é um dos permitidos
  if (activeProfile && !allowedProfiles.includes(activeProfile)) {
    return <Navigate to="/select-profile" replace />;
  }

  return <>{children}</>;
}

// HOC para proteger rotas por portal
interface PortalGuardProps {
  portal: Portal;
  children: React.ReactNode;
}

export function PortalGuard({ portal, children }: PortalGuardProps) {
  const { user, activeProfile, isLoading } = useUnifiedAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin tem acesso total
  if (user.isAdmin) {
    return <>{children}</>;
  }

  // Verificar se o perfil ativo pode acessar o portal
  if (!activeProfile || !canAccessPortal(activeProfile, portal)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
