// ====================================
// PortalAuthContext - Wrapper de Compatibilidade
// ====================================
// Este arquivo mantém compatibilidade com código Portal existente.
// Internamente, usa o UnifiedAuthContext.
//
// NOTA: Para novo código, use diretamente:
// import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

import React, { ReactNode, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { 
  UnifiedAuthProvider as RealProvider, 
  useUnifiedAuth,
  UnifiedUser,
} from '@/contexts/UnifiedAuthContext';

// Tipos legados para compatibilidade
export type PortalRole = 'patient' | 'doctor' | 'admin' | 'financial' | 'reception' | 'inventory';

export interface PortalUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  roles: PortalRole[];
  primaryRole: PortalRole;
}

// Mapear perfis NeoHub para roles Portal
function mapProfilesToRoles(user: UnifiedUser | null): PortalRole[] {
  if (!user) return [];
  
  const roleMap: Record<string, PortalRole> = {
    'administrador': 'admin',
    'paciente': 'patient',
    'colaborador': 'doctor', // Aproximação
  };
  
  const roles: PortalRole[] = [];
  for (const profile of user.profiles) {
    const role = roleMap[profile];
    if (role && !roles.includes(role)) {
      roles.push(role);
    }
  }
  
  // Se não tem roles mapeadas, assume patient
  if (roles.length === 0) {
    roles.push('patient');
  }
  
  return roles;
}

// Converter UnifiedUser para PortalUser
function toPortalUser(user: UnifiedUser | null): PortalUser | null {
  if (!user) return null;
  
  const roles = mapProfilesToRoles(user);
  
  return {
    id: user.id,
    user_id: user.authUserId,
    full_name: user.fullName,
    email: user.email,
    phone: user.phone,
    avatar_url: user.avatarUrl,
    roles,
    primaryRole: roles[0] || 'patient',
  };
}

// Hook de compatibilidade
export function usePortalAuth() {
  const unified = useUnifiedAuth();

  const portalUser = useMemo(() => toPortalUser(unified.user), [unified.user]);
  const roles = useMemo(() => mapProfilesToRoles(unified.user), [unified.user]);

  const hasRole = (role: PortalRole) => roles.includes(role);

  // Wrapper para signup do Portal
  const portalSignup = async (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    cpf?: string;
  }) => {
    return unified.signup({
      email: data.email,
      password: data.password,
      fullName: data.full_name,
      phone: data.phone,
      cpf: data.cpf,
      profile: 'paciente', // Portal sempre cria paciente
    });
  };

  return {
    user: portalUser,
    session: unified.session,
    isLoading: unified.isLoading,
    login: unified.login,
    signup: portalSignup,
    logout: unified.logout,
    hasRole,
    isAdmin: unified.isAdmin,
    isDoctor: hasRole('doctor'),
    isPatient: hasRole('patient'),
  };
}

// Provider de compatibilidade
export function PortalAuthProvider({ children }: { children: ReactNode }) {
  return <RealProvider>{children}</RealProvider>;
}
