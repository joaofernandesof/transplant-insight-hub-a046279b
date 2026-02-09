// ====================================
// UnifiedAuthContext - Contexto de Autenticação Único
// ====================================
// Fonte única de verdade para autenticação em todo o sistema
// Integrado com nova arquitetura de permissões (Fase 3)

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// ====================================
// Tipos da Nova Arquitetura
// ====================================

export type ProfileKey = 'administrador' | 'licenciado' | 'colaborador' | 'medico' | 'aluno' | 'paciente' | 'cliente_avivar' | 'ipromed';

export interface UserProfile {
  key: ProfileKey;
  name: string;
  tenant_id?: string;
  clinic_id?: string;
  unit_id?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface Module {
  key: string;
  name: string;
  icon?: string;
}

export interface ModuleOverride {
  module_code: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  reason?: string;
  expires_at?: string;
}

export interface UserContext {
  user: {
    id: string;
    auth_id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
  is_admin: boolean;
  profiles: UserProfile[];
  permissions: string[];
  modules: Module[];
  overrides: ModuleOverride[];
  tenants: Tenant[];
}

// Compatibilidade com código legado
export type NeoHubProfile = ProfileKey;
export type Portal = 'neocare' | 'neoteam' | 'academy' | 'neolicense' | 'avivar' | 'ipromed';

// Mapeamento perfil -> portais
export const PROFILE_PORTAL_MAP: Record<ProfileKey, Portal[]> = {
  administrador: ['neocare', 'neoteam', 'academy', 'neolicense', 'avivar', 'ipromed'],
  licenciado: ['neolicense', 'neoteam'],
  colaborador: ['neoteam'],
  medico: ['neoteam'],
  aluno: ['academy'],
  paciente: ['neocare'],
  cliente_avivar: ['avivar'],
  ipromed: ['ipromed'],
};

export const PROFILE_ROUTES: Record<ProfileKey, string> = {
  administrador: '/admin-dashboard',
  licenciado: '/home',
  colaborador: '/neoteam',
  medico: '/neoteam',
  aluno: '/academy',
  paciente: '/neocare',
  cliente_avivar: '/avivar',
  ipromed: '/ipromed',
};

export const PROFILE_NAMES: Record<ProfileKey, string> = {
  administrador: 'Administrador',
  licenciado: 'Licenciado',
  colaborador: 'Colaborador',
  medico: 'Médico',
  aluno: 'Aluno',
  paciente: 'Paciente',
  cliente_avivar: 'Cliente Avivar',
  ipromed: 'CPG Advocacia',
};

// Helpers
export const isAdminProfile = (profile: ProfileKey | null): boolean => profile === 'administrador';
export const canAccessPortal = (profile: ProfileKey | null, portal: Portal): boolean => {
  if (!profile) return false;
  if (profile === 'administrador') return true;
  return PROFILE_PORTAL_MAP[profile]?.includes(portal) || false;
};
export const canAccessRoute = (profile: ProfileKey | null, route: string): boolean => {
  if (!profile) return false;
  if (profile === 'administrador') return true;
  // TODO: Implementar verificação de rota por permissão
  return true;
};
export const getDefaultRouteForProfile = (profile: ProfileKey): string => PROFILE_ROUTES[profile] || '/';

// ====================================
// Interface do Usuário Unificado
// ====================================

export interface UnifiedUser {
  id: string;
  authUserId: string;
  userId: string; // Alias para compatibilidade
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
  
  // Nova estrutura
  profiles: ProfileKey[];
  permissions: string[]; // Formato: "module_code:action"
  modules: Module[];
  overrides: ModuleOverride[];
  tenants: Tenant[];
  
  // Perfil ativo com escopo
  activeProfileData?: UserProfile;
  
  // Atalhos
  isAdmin: boolean;
  
  // Portais habilitados
  allowedPortals: string[];
  
  // Legado
  legacyRole?: 'admin' | 'licensee';
  clinicName?: string;
  clinicLogoUrl?: string;
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
  profile?: ProfileKey;
}

interface UnifiedAuthContextType {
  // Estado
  user: UnifiedUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Perfil ativo
  activeProfile: ProfileKey | null;
  setActiveProfile: (profile: ProfileKey) => void;
  
  // Tenant ativo
  activeTenant: Tenant | null;
  setActiveTenant: (tenant: Tenant) => void;
  
  // Ações
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  
  // Verificações de permissão (nova arquitetura)
  hasProfile: (profile: ProfileKey) => boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasModule: (moduleKey: string) => boolean;
  canAccess: (portal: Portal) => boolean;
  canAccessCurrentRoute: (route: string) => boolean;
  
  // Nova API de módulos
  canAccessModule: (moduleCode: string, action?: 'read' | 'write' | 'delete') => boolean;
  
  // Atalhos
  isAdmin: boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

const VALID_PROFILES: ProfileKey[] = [
  'administrador', 'licenciado', 'colaborador', 'medico', 'aluno', 'paciente', 'cliente_avivar', 'ipromed'
];

// ====================================
// Provider
// ====================================

export function UnifiedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProfile, setActiveProfileState] = useState<ProfileKey | null>(null);
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);

  // Carregar perfil ativo do localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem('neohub_active_profile');
    if (storedProfile && VALID_PROFILES.includes(storedProfile as ProfileKey)) {
      setActiveProfileState(storedProfile as ProfileKey);
    }
    const storedTenant = localStorage.getItem('neohub_active_tenant');
    if (storedTenant) {
      try {
        setActiveTenantState(JSON.parse(storedTenant));
      } catch (e) {}
    }
  }, []);

  // Atualizar perfil ativo
  const setActiveProfile = useCallback((profile: ProfileKey) => {
    if (user && !user.profiles.includes(profile) && !user.isAdmin) {
      console.warn('[UnifiedAuth] User does not have this profile:', profile);
      return;
    }
    setActiveProfileState(profile);
    localStorage.setItem('neohub_active_profile', profile);
  }, [user]);

  // Atualizar tenant ativo
  const setActiveTenant = useCallback((tenant: Tenant) => {
    setActiveTenantState(tenant);
    localStorage.setItem('neohub_active_tenant', JSON.stringify(tenant));
  }, []);

  // Buscar dados do usuário usando a nova função get_user_context()
  const fetchUserData = useCallback(async (authUser: User): Promise<UnifiedUser | null> => {
    try {
      // 1. Tentar usar a nova função get_user_context()
      const { data: contextData, error: contextError } = await supabase.rpc('get_user_context');

      if (contextData && !contextError && typeof contextData === 'object') {
        const ctx = contextData as unknown as UserContext;
        
      if (ctx.user) {
          const profiles = (ctx.profiles || []).map(p => p.key).filter(k => VALID_PROFILES.includes(k));
          // Usar is_admin da RPC (fonte única de verdade)
          const isAdmin = ctx.is_admin === true || profiles.includes('administrador');
          
          // Definir perfil ativo se ainda não definido
          if (!activeProfile && profiles.length > 0) {
            const defaultProfile = profiles[0];
            setActiveProfileState(defaultProfile);
            localStorage.setItem('neohub_active_profile', defaultProfile);
          }
          
          // Definir tenant ativo se ainda não definido
          if (!activeTenant && ctx.tenants && ctx.tenants.length > 0) {
            setActiveTenantState(ctx.tenants[0]);
            localStorage.setItem('neohub_active_tenant', JSON.stringify(ctx.tenants[0]));
          }

          // Permissões no formato "module_code:action"
          const permissions = Array.isArray(ctx.permissions) ? ctx.permissions : [];

          // Buscar allowed_portals do neohub_users
          const { data: portalData } = await supabase
            .from('neohub_users')
            .select('allowed_portals')
            .eq('user_id', ctx.user.auth_id)
            .single();

          return {
            id: ctx.user.id,
            authUserId: ctx.user.auth_id,
            userId: ctx.user.auth_id,
            email: ctx.user.email,
            fullName: ctx.user.full_name,
            phone: ctx.user.phone,
            avatarUrl: ctx.user.avatar_url,
            profiles,
            permissions,
            modules: ctx.modules || [],
            overrides: ctx.overrides || [],
            tenants: ctx.tenants || [],
            activeProfileData: ctx.profiles?.[0],
            isAdmin,
            allowedPortals: portalData?.allowed_portals || [],
            legacyRole: isAdmin ? 'admin' : profiles.includes('licenciado') ? 'licensee' : undefined,
          };
        }
      }

      // 2. Fallback: buscar dados antigos
      console.log('[UnifiedAuth] get_user_context failed, using fallback...');
      
      const { data: neoHubData } = await supabase
        .from('neohub_users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (neoHubData) {
        // Buscar perfis antigos
        const { data: profilesData } = await supabase
          .from('neohub_user_profiles')
          .select('profile')
          .eq('neohub_user_id', neoHubData.id)
          .eq('is_active', true);

        const profiles = (profilesData || [])
          .map(p => p.profile as ProfileKey)
          .filter(p => VALID_PROFILES.includes(p));

        const isAdminByProfile = profiles.includes('administrador');
        
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .eq('role', 'admin')
          .single();
        
        const isAdminByRole = !!roleData;
        const isAdmin = isAdminByProfile || isAdminByRole;

        if (isAdminByRole && !isAdminByProfile) {
          profiles.unshift('administrador');
        }

        return {
          id: neoHubData.id,
          authUserId: neoHubData.user_id,
          userId: neoHubData.user_id,
          email: neoHubData.email,
          fullName: neoHubData.full_name,
          phone: neoHubData.phone,
          avatarUrl: neoHubData.avatar_url,
          profiles,
          permissions: [],
          modules: [],
          overrides: [],
          tenants: [],
          isAdmin,
          allowedPortals: neoHubData.allowed_portals || [],
          legacyRole: isAdmin ? 'admin' : profiles.includes('licenciado') ? 'licensee' : undefined,
          clinicName: neoHubData.clinic_name,
          clinicLogoUrl: neoHubData.clinic_logo_url,
        };
      }

      // 3. Fallback final: tabela profiles legada
      const { data: legacyProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (legacyProfile) {
        // Check if user is a student (has class enrollments)
        const { data: enrollmentData } = await supabase
          .from('class_enrollments')
          .select('id')
          .eq('user_id', authUser.id)
          .limit(1);
        
        const isStudent = (enrollmentData && enrollmentData.length > 0);
        
        const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: authUser.id });
        const legacyRole = (roleData as 'admin' | 'licensee') || (isStudent ? undefined : 'licensee');
        const isAdmin = legacyRole === 'admin';
        
        // Determine profile: admin > student > licensee
        let profiles: ProfileKey[];
        if (isAdmin) {
          profiles = ['administrador'];
        } else if (isStudent) {
          profiles = ['aluno'];
        } else {
          profiles = ['licenciado'];
        }

        return {
          id: legacyProfile.id || authUser.id,
          authUserId: authUser.id,
          userId: authUser.id,
          email: legacyProfile.email,
          fullName: legacyProfile.name,
          phone: legacyProfile.phone,
          avatarUrl: legacyProfile.avatar_url,
          profiles,
          permissions: [],
          modules: [],
          overrides: [],
          tenants: [],
          isAdmin,
          allowedPortals: [],
          legacyRole,
          clinicName: legacyProfile.clinic_name,
          clinicLogoUrl: legacyProfile.clinic_logo_url,
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
  }, [activeProfile, activeTenant]);

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
          setTimeout(async () => {
            const userData = await fetchUserData(currentSession.user);
            setUser(userData);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setActiveProfileState(null);
          setActiveTenantState(null);
          localStorage.removeItem('neohub_active_profile');
          localStorage.removeItem('neohub_active_tenant');
          setIsLoading(false);
        }
      }
    );

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

  // Signup com nova arquitetura
  const signup = useCallback(async (data: SignupData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: data.fullName },
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

      // Criar em neohub_users
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

      // Atribuir perfil na nova estrutura
      const profileKey = data.profile || 'paciente';
      
      // Buscar ID do perfil
      const { data: profileDef } = await supabase
        .from('profile_definitions')
        .select('id')
        .eq('key', profileKey)
        .single();

      if (profileDef) {
        // Inserir na nova tabela
        await supabase
          .from('user_profile_assignments')
          .insert({
            user_id: neoHubUser.id,
            profile_id: profileDef.id,
            tenant_id: '00000000-0000-0000-0000-000000000001', // Neo Group default
          });
      }

      // Também inserir na tabela antiga para compatibilidade
      await supabase
        .from('neohub_user_profiles')
        .insert([{
          neohub_user_id: neoHubUser.id,
          profile: profileKey as any,
        }]);

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
    setActiveTenantState(null);
    localStorage.removeItem('neohub_active_profile');
    localStorage.removeItem('neohub_active_tenant');
  }, []);

  // ====================================
  // Verificações de Permissão (Nova Arquitetura)
  // ====================================

  const hasProfile = useCallback((profile: ProfileKey): boolean => {
    if (user?.isAdmin) return true;
    return user?.profiles.includes(profile) || false;
  }, [user]);

  // Nova: verifica permissão atômica (formato: "module_code:action")
  const hasPermission = useCallback((permissionKey: string): boolean => {
    if (user?.isAdmin) return true;
    return user?.permissions.includes(permissionKey) || false;
  }, [user]);

  // Nova API de módulos: canAccessModule(moduleCode, action)
  // Esta é a função principal de autorização - fonte única de verdade
  const canAccessModule = useCallback((
    moduleCode: string,
    action: 'read' | 'write' | 'delete' = 'read'
  ): boolean => {
    if (user?.isAdmin) return true;
    const key = `${moduleCode}:${action}`;
    return user?.permissions.includes(key) || false;
  }, [user]);

  // Nova: verifica módulo
  const hasModule = useCallback((moduleKey: string): boolean => {
    if (user?.isAdmin) return true;
    return user?.modules.some(m => m.key === moduleKey) || false;
  }, [user]);

  const canAccess = useCallback((portal: Portal): boolean => {
    if (!user || !activeProfile) return false;
    return canAccessPortal(activeProfile, portal);
  }, [user, activeProfile]);

  const canAccessCurrentRoute = useCallback((route: string): boolean => {
    if (!user || !activeProfile) return false;
    return canAccessRoute(activeProfile, route);
  }, [user, activeProfile]);

  return (
    <UnifiedAuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        activeProfile,
        setActiveProfile,
        activeTenant,
        setActiveTenant,
        login,
        signup,
        logout,
        refreshUser,
        hasProfile,
        canAccessModule,
        hasPermission,
        hasModule,
        canAccess,
        canAccessCurrentRoute,
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

export const useAuth = useUnifiedAuth;
export const useNeoHubAuth = useUnifiedAuth;
export const AuthProvider = UnifiedAuthProvider;
export const NeoHubAuthProvider = UnifiedAuthProvider;
