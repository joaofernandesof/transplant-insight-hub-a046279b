import React, { createContext, useContext, useEffect, useState } from 'react';
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
} from '../lib/permissions';

// Re-exportar tipos e constantes para compatibilidade
export type { NeoHubProfile, Portal };
export { 
  PROFILE_ROUTES, 
  PROFILE_NAMES, 
  PROFILE_PORTAL_MAP,
  isAdminProfile,
  canAccessPortal,
  canAccessRoute,
};

// Interface do usuário do NeoHub
export interface NeoHubUser {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  avatarUrl?: string;
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  maritalStatus?: string;
  nationality?: string;
  profiles: NeoHubProfile[];
  isAdmin: boolean;
}

interface NeoHubAuthContextType {
  user: NeoHubUser | null;
  session: Session | null;
  isLoading: boolean;
  activeProfile: NeoHubProfile | null;
  setActiveProfile: (profile: NeoHubProfile) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasProfile: (profile: NeoHubProfile) => boolean;
  canAccess: (portal: Portal) => boolean;
  canAccessCurrentRoute: (route: string) => boolean;
  refreshUser: () => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  cpf?: string;
  phone?: string;
  profile: NeoHubProfile;
}

const NeoHubAuthContext = createContext<NeoHubAuthContextType | undefined>(undefined);

// Lista de perfis válidos para validação
const VALID_PROFILES: NeoHubProfile[] = [
  'administrador', 'licenciado', 'colaborador', 'aluno', 'paciente', 'cliente_avivar'
];

export function NeoHubAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NeoHubUser | null>(null);
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

  const setActiveProfile = (profile: NeoHubProfile) => {
    // Verificar se o usuário possui este perfil
    if (user && !user.profiles.includes(profile) && !user.isAdmin) {
      console.warn('User does not have this profile:', profile);
      return;
    }
    setActiveProfileState(profile);
    localStorage.setItem('neohub_active_profile', profile);
  };

  const fetchUserData = async (authUser: User): Promise<NeoHubUser | null> => {
    try {
      // Buscar dados do usuário na tabela neohub_users
      const { data: userData, error: userError } = await supabase
        .from('neohub_users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (userError || !userData) {
        console.log('NeoHub user not found, checking legacy tables...');
        return null;
      }

      // Buscar perfis do usuário
      const { data: profilesData } = await supabase
        .from('neohub_user_profiles')
        .select('profile')
        .eq('neohub_user_id', userData.id)
        .eq('is_active', true);

      const profiles = (profilesData || [])
        .map(p => p.profile as NeoHubProfile)
        .filter(p => VALID_PROFILES.includes(p));

      // Verificar se é admin (via tabela user_roles legada OU perfil administrador)
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
        id: userData.id,
        userId: userData.user_id,
        email: userData.email,
        fullName: userData.full_name,
        cpf: userData.cpf,
        birthDate: userData.birth_date,
        phone: userData.phone,
        avatarUrl: userData.avatar_url,
        addressCep: userData.address_cep,
        addressStreet: userData.address_street,
        addressNumber: userData.address_number,
        addressComplement: userData.address_complement,
        addressNeighborhood: userData.address_neighborhood,
        addressCity: userData.address_city,
        addressState: userData.address_state,
        maritalStatus: userData.marital_status,
        nationality: userData.nationality,
        profiles,
        isAdmin,
      };
    } catch (error) {
      console.error('Error fetching NeoHub user:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (!session?.user) return;
    const userData = await fetchUserData(session.user);
    setUser(userData);
  };

  useEffect(() => {
    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session?.user) {
          setTimeout(async () => {
            const userData = await fetchUserData(session.user);
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

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user).then(userData => {
          setUser(userData);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Erro ao criar usuário' };
      }

      const { data: neoHubUser, error: userError } = await supabase
        .from('neohub_users')
        .insert({
          user_id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          cpf: data.cpf,
          phone: data.phone,
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating NeoHub user:', userError);
        return { success: false, error: 'Erro ao criar perfil de usuário' };
      }

      const { error: profileError } = await supabase
        .from('neohub_user_profiles')
        .insert({
          neohub_user_id: neoHubUser.id,
          profile: data.profile,
        });

      if (profileError) {
        console.error('Error assigning profile:', profileError);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveProfileState(null);
    localStorage.removeItem('neohub_active_profile');
  };

  const hasProfile = (profile: NeoHubProfile): boolean => {
    if (user?.isAdmin) return true;
    return user?.profiles.includes(profile) || false;
  };

  const canAccess = (portal: Portal): boolean => {
    if (!user || !activeProfile) return false;
    return canAccessPortal(activeProfile, portal);
  };

  const canAccessCurrentRoute = (route: string): boolean => {
    if (!user || !activeProfile) return false;
    return canAccessRoute(activeProfile, route);
  };

  return (
    <NeoHubAuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        activeProfile,
        setActiveProfile,
        login,
        signup,
        logout,
        hasProfile,
        canAccess,
        canAccessCurrentRoute,
        refreshUser,
      }}
    >
      {children}
    </NeoHubAuthContext.Provider>
  );
}

export function useNeoHubAuth() {
  const context = useContext(NeoHubAuthContext);
  if (!context) {
    throw new Error('useNeoHubAuth must be used within NeoHubAuthProvider');
  }
  return context;
}
