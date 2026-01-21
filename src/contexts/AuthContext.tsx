// ====================================
// AuthContext - Wrapper de Compatibilidade
// ====================================
// Este arquivo mantém compatibilidade com código legado.
// Internamente, usa o UnifiedAuthContext.
// 
// NOTA: Para novo código, use diretamente:
// import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

import React, { ReactNode, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { 
  UnifiedAuthProvider as RealProvider, 
  useUnifiedAuth,
  UnifiedUser 
} from './UnifiedAuthContext';

// Interface legada para compatibilidade
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'licensee';
  clinicName?: string;
  city?: string;
  state?: string;
  tier?: string;
  avatarUrl?: string;
}

// Interface legada do contexto
interface LegacyAuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

// Converter UnifiedUser para AppUser (legado)
function toAppUser(user: UnifiedUser | null): AppUser | null {
  if (!user) return null;
  
  return {
    // IMPORTANTE: Usar authUserId (auth.users.id) para compatibilidade
    // com clinics.user_id que referencia auth.users.id
    id: user.authUserId,
    name: user.fullName,
    email: user.email,
    role: user.isAdmin ? 'admin' : 'licensee',
    clinicName: user.clinicName,
    city: user.city || user.addressCity,
    state: user.state || user.addressState,
    tier: user.tier,
    avatarUrl: user.avatarUrl,
  };
}

// Hook de compatibilidade
export function useAuth(): LegacyAuthContextType {
  const unified = useUnifiedAuth();

  // Memoizar para evitar re-renders desnecessários
  const legacyUser = useMemo(() => toAppUser(unified.user), [unified.user]);

  // Wrapper para signup que aceita 3 argumentos
  const legacySignup = async (email: string, password: string, name: string) => {
    return unified.signup({
      email,
      password,
      fullName: name,
    });
  };

  return {
    user: legacyUser,
    session: unified.session,
    isLoading: unified.isLoading,
    login: unified.login,
    signup: legacySignup,
    logout: unified.logout,
    isAdmin: unified.isAdmin,
  };
}

// Provider de compatibilidade (usa o real internamente)
export function AuthProvider({ children }: { children: ReactNode }) {
  return <RealProvider>{children}</RealProvider>;
}

// Re-exportar para código que importa daqui
export { UnifiedAuthProvider } from './UnifiedAuthContext';
