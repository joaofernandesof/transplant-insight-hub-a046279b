// ====================================
// UnifiedAuthContext - Contexto de Autenticação Único
// ====================================
// Fonte única de verdade para autenticação em todo o sistema

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  NeoHubProfile, 
  Portal,
  PROFILE_ROUTES,
  PROFILE_NAMES,
  PROFILE_PORTAL_MAP,
  isAdminProfile,
  canAccessPortal,
  canAccessRoute,
  getDefaultRouteForProfile,
} from '@/neohub/lib/permissions';

// Re-exportar tipos e constantes
export type { NeoHubProfile, Portal };
export { 
  PROFILE_ROUTES, 
  PROFILE_NAMES, 
  PROFILE_PORTAL_MAP,
  isAdminProfile,
  canAccessPortal,
  canAccessRoute,
  getDefaultRouteForProfile,
};

// ====================================
// Tipos
// ====================================

export interface UnifiedUser {
  // Identificadores
  id: string;                    // neohub_users.id
  authUserId: string;            // auth.users.id
  
  // Dados pessoais
  email: string;
  fullName: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  avatarUrl?: string;
  
  // Endereço
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  
  // Outros dados
  maritalStatus?: string;
  nationality?: string;
  
  // Perfis e permissões
  profiles: NeoHubProfile[];
  isAdmin: boolean;
  
  // Dados legados (para compatibilidade)
  legacyRole?: 'admin' | 'licensee';
  clinicName?: string;
  city?: string;
  state?: string;
  tier?: string;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  cpf?: string;
  phone?: string;
  profile?: NeoHubProfile;
}

interface UnifiedAuthContextType {
  // Estado
  user: UnifiedUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Perfil ativo (para usuários com múltiplos perfis)
  activeProfile: NeoHubProfile | null;
  setActiveProfile: (profile: NeoHubProfile) => void;
  
  // Ações de autenticação
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Verificações de permissão
  hasProfile: (profile: NeoHubProfile) => boolean;
  canAccess: (portal: Portal) => boolean;
  canAccessCurrentRoute: (route: string) => boolean;
  hasPermission: (moduleCode: string) => boolean;
  hasModule: (moduleCode: string) => boolean;
  
  // Atalhos
  isAdmin: boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

// Lista de perfis válidos
const VALID_PROFILES: NeoHubProfile[] = [
  'administrador', 'licenciado', 'colaborador', 'aluno', 'paciente', 'cliente_avivar'
];

// ====================================
// Provider
// ====================================

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProfile, setActiveProfileState] = useState<NeoHubProfile | null>(null);

  // Carregar perfil ativo do localStorage
  useEffect(() => {
    const stored = localStorage.getItem('neohub_active_profile');
    if (stored && VALID_PROFILES.includes(stored as NeoHubProfile)) {
      setActiveProfileState(stored as NeoHubProfile);
    }
  }, []);

  // Atualizar perfil ativo
  const setActiveProfile = useCallback((profile: NeoHubProfile) => {
    if (user && !user.profiles.includes(profile) && !user.isAdmin) {
      console.warn('[UnifiedAuth] User does not have this profile:', profile);
      return;
    }
    setActiveProfileState(profile);
    localStorage.setItem('neohub_active_profile', profile);
  }, [user]);

  // Buscar dados do usuário
  const fetchUserData = useCallback(async (authUser: User): Promise<UnifiedUser | null> => {
    try {
      // 1. Tentar buscar em neohub_users (tabela principal)
      const { data: neoHubData, error: neoHubError } = await supabase
        .from('neohub_users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (neoHubData) {
        // Buscar perfis do usuário
        const { data: profilesData } = await supabase
          .from('neohub_user_profiles')
          .select('profile')
          .eq('neohub_user_id', neoHubData.id)
          .eq('is_active', true);

        const profiles = (profilesData || [])
          .map(p => p.profile as NeoHubProfile)
          .filter(p => VALID_PROFILES.includes(p));

        // Verificar se é admin (via tabela user_roles OU perfil administrador)
        const isAdminByProfile = profiles.includes('administrador');
        
        let isAdminByRole = false;
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .eq('role', 'admin')
          .single();
        
        isAdminByRole = !!roleData;
        const isAdmin = isAdminByProfile || isAdminByRole;

        // Se for admin por role mas não tem perfil administrador, adicionar
        if (isAdminByRole && !isAdminByProfile) {
          profiles.unshift('administrador');
        }

        return {
          id: neoHubData.id,
          authUserId: neoHubData.user_id,
          email: neoHubData.email,
          fullName: neoHubData.full_name,
          cpf: neoHubData.cpf,
          birthDate: neoHubData.birth_date,
          phone: neoHubData.phone,
          avatarUrl: neoHubData.avatar_url,
          addressCep: neoHubData.address_cep,
          addressStreet: neoHubData.address_street,
          addressNumber: neoHubData.address_number,
          addressComplement: neoHubData.address_complement,
          addressNeighborhood: neoHubData.address_neighborhood,
          addressCity: neoHubData.address_city,
          addressState: neoHubData.address_state,
          maritalStatus: neoHubData.marital_status,
          nationality: neoHubData.nationality,
          profiles,
          isAdmin,
          // Mapear para legado se for licenciado
          legacyRole: isAdmin ? 'admin' : profiles.includes('licenciado') ? 'licensee' : undefined,
        };
      }

      // 2. Fallback: buscar em profiles (tabela legada)
      console.log('[UnifiedAuth] NeoHub user not found, checking legacy profiles...');
      
      const { data: legacyProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (legacyProfile) {
        // Buscar role legado
        const { data: roleData } = await supabase
          .rpc('get_user_role', { _user_id: authUser.id });

        const legacyRole = (roleData as 'admin' | 'licensee') || 'licensee';
        const isAdmin = legacyRole === 'admin';

        // Mapear role legado para perfil NeoHub
        const profiles: NeoHubProfile[] = [];
        if (isAdmin) {
          profiles.push('administrador');
        }
        if (legacyRole === 'licensee' || !legacyRole) {
          profiles.push('licenciado');
        }

        return {
          id: legacyProfile.id || authUser.id,
          authUserId: authUser.id,
          email: legacyProfile.email,
          fullName: legacyProfile.name,
          phone: legacyProfile.phone,
          avatarUrl: legacyProfile.avatar_url,
          addressCity: legacyProfile.city,
          addressState: legacyProfile.state,
          profiles,
          isAdmin,
          legacyRole,
          clinicName: legacyProfile.clinic_name,
          city: legacyProfile.city,
          state: legacyProfile.state,
          tier: legacyProfile.tier,
        };
      }

      console.warn('[UnifiedAuth] No user profile found for:', authUser.id);
      return null;
    } catch (error) {
      console.error('[UnifiedAuth] Error fetching user:', error);
      return null;
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!session?.user) return;
    const userData = await fetchUserData(session.user);
    setUser(userData);
  }, [session, fetchUserData]);

  // Setup auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);

        if (currentSession?.user) {
          // Defer to avoid deadlock
          setTimeout(async () => {
            const userData = await fetchUserData(currentSession.user);
            setUser(userData);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setActiveProfileState(null);
          localStorage.removeItem('neohub_active_profile');
          setIsLoading(false);
        }
      }
    );

    // Check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        fetchUserData(existingSession.user).then(userData => {
          setUser(userData);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email ou senha incorretos' };
        }
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  // Signup
  const signup = useCallback(async (data: SignupData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          return { success: false, error: 'Este email já está cadastrado' };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Erro ao criar usuário' };
      }

      // Criar registro em neohub_users
      const { data: neoHubUser, error: userError } = await supabase
        .from('neohub_users')
        .insert({
          user_id: authData.user.id,
          email: data.email.trim(),
          full_name: data.fullName,
          cpf: data.cpf,
          phone: data.phone,
        })
        .select()
        .single();

      if (userError) {
        console.error('[UnifiedAuth] Error creating NeoHub user:', userError);
        return { success: false, error: 'Erro ao criar perfil de usuário' };
      }

      // Atribuir perfil
      const profile = data.profile || 'paciente'; // Padrão: paciente
      const { error: profileError } = await supabase
        .from('neohub_user_profiles')
        .insert({
          neohub_user_id: neoHubUser.id,
          profile,
        });

      if (profileError) {
        console.error('[UnifiedAuth] Error assigning profile:', profileError);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setActiveProfileState(null);
    localStorage.removeItem('neohub_active_profile');
  }, []);

  // Permission checks
  const hasProfile = useCallback((profile: NeoHubProfile): boolean => {
    if (user?.isAdmin) return true;
    return user?.profiles.includes(profile) || false;
  }, [user]);

  const canAccess = useCallback((portal: Portal): boolean => {
    if (!user || !activeProfile) return false;
    return canAccessPortal(activeProfile, portal);
  }, [user, activeProfile]);

  const canAccessCurrentRoute = useCallback((route: string): boolean => {
    if (!user || !activeProfile) return false;
    return canAccessRoute(activeProfile, route);
  }, [user, activeProfile]);

  // TODO: Implementar verificação granular de módulos
  const hasPermission = useCallback((moduleCode: string): boolean => {
    if (user?.isAdmin) return true;
    // Por enquanto, apenas verifica se usuário está autenticado
    return !!user;
  }, [user]);

  const hasModule = useCallback((moduleCode: string): boolean => {
    if (user?.isAdmin) return true;
    // Por enquanto, apenas verifica se usuário está autenticado
    return !!user;
  }, [user]);

  return (
    <UnifiedAuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        activeProfile,
        setActiveProfile,
        login,
        signup,
        logout,
        refreshUser,
        hasProfile,
        canAccess,
        canAccessCurrentRoute,
        hasPermission,
        hasModule,
        isAdmin: user?.isAdmin || false,
      }}
    >
      {children}
    </UnifiedAuthContext.Provider>
  );
}

// ====================================
// Hook
// ====================================

export function useUnifiedAuth() {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within UnifiedAuthProvider');
  }
  return context;
}

// ====================================
// Aliases para compatibilidade
// ====================================

// Alias para código legado que usa useAuth
export const useAuth = useUnifiedAuth;

// Alias para código NeoHub que usa useNeoHubAuth
export const useNeoHubAuth = useUnifiedAuth;

// Provider aliases
export const AuthProvider = UnifiedAuthProvider;
export const NeoHubAuthProvider = UnifiedAuthProvider;
