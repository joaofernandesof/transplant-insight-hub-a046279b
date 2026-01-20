import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type ClinicStaffRole = 'admin' | 'gestao' | 'comercial' | 'operacao' | 'recepcao';

export interface StaffProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: ClinicStaffRole;
  branch: string;
  additionalBranches: string[];
  isActive: boolean;
}

interface ClinicAuthContextType {
  user: StaffProfile | null;
  session: Session | null;
  isLoading: boolean;
  currentBranch: string;
  availableBranches: string[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchBranch: (branch: string) => void;
  canAccessBranch: (branch: string) => boolean;
  hasRole: (role: ClinicStaffRole) => boolean;
  isAdmin: boolean;
  isGestao: boolean;
  canCreateSales: boolean;
  canCreateSurgeries: boolean;
  canCreatePatients: boolean;
}

const ClinicAuthContext = createContext<ClinicAuthContextType | undefined>(undefined);

export function ClinicAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StaffProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBranch, setCurrentBranch] = useState<string>('');

  const fetchStaffProfile = useCallback(async (userId: string): Promise<StaffProfile | null> => {
    const { data, error } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Error fetching staff profile:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role as ClinicStaffRole,
      branch: data.branch,
      additionalBranches: data.additional_branches || [],
      isActive: data.is_active,
    };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        const profile = await fetchStaffProfile(session.user.id);
        setUser(profile);
        if (profile) {
          const savedBranch = localStorage.getItem('clinic_current_branch');
          const validBranch = savedBranch && (
            profile.branch === savedBranch || 
            profile.additionalBranches.includes(savedBranch) ||
            ['admin', 'gestao'].includes(profile.role)
          );
          setCurrentBranch(validBranch ? savedBranch : profile.branch);
        }
      } else {
        setUser(null);
        setCurrentBranch('');
      }
      
      setIsLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profile = await fetchStaffProfile(session.user.id);
        setUser(profile);
        if (profile) {
          const savedBranch = localStorage.getItem('clinic_current_branch');
          const validBranch = savedBranch && (
            profile.branch === savedBranch || 
            profile.additionalBranches.includes(savedBranch) ||
            ['admin', 'gestao'].includes(profile.role)
          );
          setCurrentBranch(validBranch ? savedBranch : profile.branch);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchStaffProfile]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile = await fetchStaffProfile(data.user.id);
        if (!profile) {
          await supabase.auth.signOut();
          return { success: false, error: 'Perfil de funcionário não encontrado' };
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    localStorage.removeItem('clinic_current_branch');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCurrentBranch('');
  };

  const switchBranch = (branch: string) => {
    if (canAccessBranch(branch)) {
      setCurrentBranch(branch);
      localStorage.setItem('clinic_current_branch', branch);
    }
  };

  const canAccessBranch = useCallback((branch: string): boolean => {
    if (!user) return false;
    if (['admin', 'gestao'].includes(user.role)) return true;
    return user.branch === branch || user.additionalBranches.includes(branch);
  }, [user]);

  const hasRole = useCallback((role: ClinicStaffRole): boolean => {
    return user?.role === role;
  }, [user]);

  const availableBranches = user ? 
    ['admin', 'gestao'].includes(user.role) 
      ? [] // Admin/Gestao can see all - we'll fetch dynamically
      : [user.branch, ...user.additionalBranches]
    : [];

  const isAdmin = user?.role === 'admin';
  const isGestao = user?.role === 'gestao';
  const canCreateSales = user ? ['admin', 'gestao', 'comercial'].includes(user.role) : false;
  const canCreateSurgeries = user ? ['admin', 'gestao', 'operacao', 'comercial'].includes(user.role) : false;
  const canCreatePatients = user ? ['admin', 'gestao', 'comercial', 'operacao', 'recepcao'].includes(user.role) : false;

  return (
    <ClinicAuthContext.Provider value={{
      user,
      session,
      isLoading,
      currentBranch,
      availableBranches,
      login,
      logout,
      switchBranch,
      canAccessBranch,
      hasRole,
      isAdmin,
      isGestao,
      canCreateSales,
      canCreateSurgeries,
      canCreatePatients,
    }}>
      {children}
    </ClinicAuthContext.Provider>
  );
}

export function useClinicAuth() {
  const context = useContext(ClinicAuthContext);
  if (!context) {
    throw new Error('useClinicAuth must be used within a ClinicAuthProvider');
  }
  return context;
}
