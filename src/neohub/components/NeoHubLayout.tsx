import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useNeoHubAuth, NeoHubProfile, PROFILE_ROUTES } from '../contexts/NeoHubAuthContext';
import { Loader2 } from 'lucide-react';

interface NeoHubLayoutProps {
  children?: React.ReactNode;
}

export function NeoHubLayout({ children }: NeoHubLayoutProps) {
  const { user, isLoading, activeProfile, setActiveProfile } = useNeoHubAuth();
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
  const { user, activeProfile, isLoading } = useNeoHubAuth();

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
