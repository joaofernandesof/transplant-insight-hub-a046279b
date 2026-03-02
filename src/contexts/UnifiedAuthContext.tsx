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

export type ProfileKey = 'super_administrador' | 'administrador' | 'gerente' | 'coordenador' | 'supervisor' | 'operador' | 'visualizador' | 'externo';

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

export interface PortalRole {
  portal_id: string;
  portal_slug: string;
  portal_name: string;
  role_id: string;
  role_name: string;
  role_display_name: string;
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
  portals: PortalRole[];
}

// Compatibilidade com código legado
export type NeoHubProfile = ProfileKey;
export type Portal = 'neocare' | 'neoteam' | 'neoacademy' | 'neolicense' | 'avivar' | 'ipromed';

// Mapeamento perfil -> portais
export const PROFILE_PORTAL_MAP: Record<ProfileKey, Portal[]> = {
  super_administrador: ['neocare', 'neoteam', 'neoacademy', 'neolicense', 'avivar', 'ipromed'],
  administrador: ['neocare', 'neoteam', 'neoacademy', 'neolicense', 'avivar', 'ipromed'],
  gerente: ['neocare', 'neoteam', 'neoacademy', 'neolicense', 'avivar', 'ipromed'],
  coordenador: ['neoteam', 'neocare', 'neoacademy'],
  supervisor: ['neoteam', 'neocare'],
  operador: ['neoteam', 'neocare', 'neoacademy', 'neolicense', 'avivar', 'ipromed'],
  visualizador: ['neoteam', 'neocare'],
  externo: [],
};

export const PROFILE_ROUTES: Record<ProfileKey, string> = {
  super_administrador: '/admin-dashboard',
  administrador: '/admin-dashboard',
  gerente: '/neoteam',
  coordenador: '/neoteam',
  supervisor: '/neoteam',
  operador: '/neoteam',
  visualizador: '/neoteam',
  externo: '/',
};

export const PROFILE_NAMES: Record<ProfileKey, string> = {
  super_administrador: 'Super Administrador',
  administrador: 'Administrador',
  gerente: 'Gerente',
  coordenador: 'Coordenador',
  supervisor: 'Supervisor',
  operador: 'Operador',
  visualizador: 'Visualizador',
  externo: 'Externo',
};

// Helpers
export const isAdminProfile = (profile: ProfileKey | null): boolean => 
  profile === 'administrador' || profile === 'super_administrador';
export const canAccessPortal = (profile: ProfileKey | null, portal: Portal): boolean => {
  if (!profile) return false;
  if (profile === 'administrador' || profile === 'super_administrador') return true;
  return PROFILE_PORTAL_MAP[profile]?.includes(portal) || false;
};
// Mapeamento rota-prefixo → perfis permitidos
const ROUTE_PROFILE_MAP: Record<string, ProfileKey[]> = {
  '/admin': ['administrador', 'super_administrador'],
  '/admin-portal': ['administrador', 'super_administrador'],
  '/admin-dashboard': ['administrador', 'super_administrador'],
  '/neocare': ['operador', 'administrador', 'super_administrador'],
  '/neoteam': ['operador', 'gerente', 'coordenador', 'supervisor', 'administrador', 'super_administrador'],
  '/academy': ['operador', 'administrador', 'super_administrador'],
  '/neolicense': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/hotleads': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/avivar': ['operador', 'administrador', 'super_administrador'],
  '/cpg': ['operador', 'administrador', 'super_administrador'],
  '/neopay': ['administrador', 'super_administrador'],
  '/dashboard': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/financial': ['gerente', 'administrador', 'super_administrador'],
  '/marketing': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/store': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/mentorship': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/systems': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/regularization': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/alunos': ['administrador', 'super_administrador'],
  '/comparison': ['administrador', 'super_administrador'],
  '/monitoring': ['administrador', 'super_administrador'],
  '/system-metrics': ['administrador', 'super_administrador'],
  '/certificates': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/license-payments': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/weekly-reports': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/sala-tecnica': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/consolidated-results': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/marketplace': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/neohair': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/vision': ['operador', 'gerente', 'administrador', 'super_administrador'],
  '/flow': ['operador', 'coordenador', 'supervisor', 'gerente', 'administrador', 'super_administrador'],
  '/neorh': ['operador', 'gerente', 'coordenador', 'administrador', 'super_administrador'],
};

export const canAccessRoute = (profile: ProfileKey | null, route: string): boolean => {
  if (!profile) return false;
  if (profile === 'administrador') return true;
  
  // Encontrar a regra mais específica (prefixo mais longo)
  const matchingPrefix = Object.keys(ROUTE_PROFILE_MAP)
    .filter(prefix => route.startsWith(prefix))
    .sort((a, b) => b.length - a.length)[0];
  
  if (!matchingPrefix) return true; // Rotas não mapeadas são públicas
  
  return ROUTE_PROFILE_MAP[matchingPrefix].includes(profile);
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
  
  // NOVO: Portais com roles (fonte de verdade)
  portalRoles: PortalRole[];
  
  // Perfil ativo com escopo
  activeProfileData?: UserProfile;
  
  // Atalhos
  isAdmin: boolean;
  
  // Portais habilitados (derivado de portalRoles)
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
  'super_administrador', 'administrador', 'gerente', 'coordenador', 'supervisor', 'operador', 'visualizador', 'externo'
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

  // Carregar perfil ativo do localStorage (será revalidado após fetch do user)
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

  // SEGURANÇA: Revalidar perfil ativo quando os dados do usuário carregam
  // Previne escalonamento de privilégios via manipulação do localStorage
  useEffect(() => {
    if (!user) return;
    if (activeProfile && !user.isAdmin && !user.profiles.includes(activeProfile)) {
      console.warn('[UnifiedAuth] SECURITY: activeProfile', activeProfile, 'not in user profiles, resetting.');
      const validProfile = user.profiles[0] || null;
      setActiveProfileState(validProfile);
      if (validProfile) {
        localStorage.setItem('neohub_active_profile', validProfile);
      } else {
        localStorage.removeItem('neohub_active_profile');
      }
    }
  }, [user, activeProfile]);

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

          // Portal roles do novo modelo
          const portalRoles: PortalRole[] = Array.isArray(ctx.portals) ? ctx.portals : [];
          
          // Derivar allowedPortals dos portal roles (fonte de verdade)
          const allowedPortalsFromRoles = [...new Set(portalRoles.map(pr => pr.portal_slug))];

          // Buscar dados extras do neohub_users
          const { data: portalData } = await supabase
            .from('neohub_users')
            .select('address_city, address_state, clinic_name, clinic_logo_url, tier')
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
            portalRoles,
            activeProfileData: ctx.profiles?.[0],
            isAdmin,
            allowedPortals: allowedPortalsFromRoles,
            legacyRole: isAdmin ? 'admin' : profiles.includes('licenciado') ? 'licensee' : undefined,
            addressCity: portalData?.address_city || undefined,
            addressState: portalData?.address_state || undefined,
            clinicName: portalData?.clinic_name || undefined,
            clinicLogoUrl: portalData?.clinic_logo_url || undefined,
            tier: portalData?.tier || undefined,
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
          portalRoles: [],
          isAdmin,
          allowedPortals: neoHubData.allowed_portals || [],
          legacyRole: isAdmin ? 'admin' : profiles.includes('licenciado') ? 'licensee' : undefined,
          clinicName: neoHubData.clinic_name,
          clinicLogoUrl: neoHubData.clinic_logo_url,
          addressCity: neoHubData.address_city || undefined,
          addressState: neoHubData.address_state || undefined,
          tier: neoHubData.tier || undefined,
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
          portalRoles: [],
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
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('signOut error (ignored):', e);
    }
    setUser(null);
    setSession(null);
    setActiveProfileState(null);
    setActiveTenantState(null);
    localStorage.removeItem('neohub_active_profile');
    localStorage.removeItem('neohub_active_tenant');
    window.location.href = '/login';
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
