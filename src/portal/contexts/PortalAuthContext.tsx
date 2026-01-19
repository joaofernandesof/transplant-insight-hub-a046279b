import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface PortalAuthContextType {
  user: PortalUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (role: PortalRole) => boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isPatient: boolean;
}

interface SignupData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  cpf?: string;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPortalUser = async (userId: string): Promise<PortalUser | null> => {
    try {
      // Fetch portal user
      const { data: portalUser, error: userError } = await supabase
        .from('portal_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (userError || !portalUser) {
        return null;
      }

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('portal_user_roles')
        .select('role')
        .eq('portal_user_id', portalUser.id);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return null;
      }

      const roles = (rolesData || []).map(r => r.role as PortalRole);
      const primaryRole = roles[0] || 'patient';

      return {
        id: portalUser.id,
        user_id: portalUser.user_id,
        full_name: portalUser.full_name,
        email: portalUser.email,
        phone: portalUser.phone,
        avatar_url: portalUser.avatar_url,
        roles,
        primaryRole,
      };
    } catch (error) {
      console.error('Error fetching portal user:', error);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);

      if (currentSession?.user) {
        const portalUser = await fetchPortalUser(currentSession.user.id);
        setUser(portalUser);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);

      if (currentSession?.user) {
        const portalUser = await fetchPortalUser(currentSession.user.id);
        setUser(portalUser);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const portalUser = await fetchPortalUser(data.user.id);
        if (!portalUser) {
          await supabase.auth.signOut();
          return { success: false, error: 'Usuário não cadastrado no Portal Neo Folic' };
        }
        setUser(portalUser);
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
          emailRedirectTo: window.location.origin + '/portal',
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        // Create portal user
        const { data: portalUser, error: portalError } = await supabase
          .from('portal_users')
          .insert({
            user_id: authData.user.id,
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            cpf: data.cpf,
          })
          .select()
          .single();

        if (portalError) {
          return { success: false, error: 'Erro ao criar perfil do portal' };
        }

        // Assign patient role by default
        await supabase
          .from('portal_user_roles')
          .insert({
            portal_user_id: portalUser.id,
            role: 'patient',
          });

        // Create patient record
        await supabase
          .from('portal_patients')
          .insert({
            portal_user_id: portalUser.id,
          });

        toast.success('Conta criada com sucesso!');
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const hasRole = (role: PortalRole) => {
    return user?.roles.includes(role) || false;
  };

  const value: PortalAuthContextType = {
    user,
    session,
    isLoading,
    login,
    signup,
    logout,
    hasRole,
    isAdmin: hasRole('admin'),
    isDoctor: hasRole('doctor'),
    isPatient: hasRole('patient'),
  };

  return (
    <PortalAuthContext.Provider value={value}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const context = useContext(PortalAuthContext);
  if (context === undefined) {
    throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  }
  return context;
}
