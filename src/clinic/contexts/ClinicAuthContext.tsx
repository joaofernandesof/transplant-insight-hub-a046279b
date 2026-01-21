// ====================================
// ClinicAuthContext - Wrapper de Compatibilidade
// ====================================
// Este arquivo mantém compatibilidade com código Clinic existente.
// Internamente, usa o UnifiedAuthContext.
//
// NOTA: Para novo código, use diretamente:
// import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

import React, { ReactNode, useMemo, useCallback, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  UnifiedAuthProvider as RealProvider, 
  useUnifiedAuth,
  UnifiedUser,
} from '@/contexts/UnifiedAuthContext';

// Tipos legados para Clinic
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

// Hook de compatibilidade
export function useClinicAuth() {
  const unified = useUnifiedAuth();
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [staffLoading, setStaffLoading] = useState(true);

  // Buscar perfil de staff quando usuário mudar
  useEffect(() => {
    async function fetchStaffProfile() {
      if (!unified.user) {
        setStaffProfile(null);
        setCurrentBranch('');
        setStaffLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('staff_profiles')
          .select('*')
          .eq('user_id', unified.user.authUserId)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          // Usuário não é staff de clínica
          setStaffProfile(null);
          setStaffLoading(false);
          return;
        }

        const profile: StaffProfile = {
          id: data.id,
          userId: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role as ClinicStaffRole,
          branch: data.branch,
          additionalBranches: data.additional_branches || [],
          isActive: data.is_active,
        };

        setStaffProfile(profile);

        // Restaurar branch salva ou usar padrão
        const savedBranch = localStorage.getItem('clinic_current_branch');
        const validBranch = savedBranch && (
          profile.branch === savedBranch || 
          profile.additionalBranches.includes(savedBranch) ||
          ['admin', 'gestao'].includes(profile.role)
        );
        setCurrentBranch(validBranch ? savedBranch : profile.branch);
      } catch (error) {
        console.error('[ClinicAuth] Error fetching staff profile:', error);
        setStaffProfile(null);
      }

      setStaffLoading(false);
    }

    fetchStaffProfile();
  }, [unified.user]);

  const switchBranch = useCallback((branch: string) => {
    if (canAccessBranch(branch)) {
      setCurrentBranch(branch);
      localStorage.setItem('clinic_current_branch', branch);
    }
  }, [staffProfile]);

  const canAccessBranch = useCallback((branch: string): boolean => {
    if (!staffProfile) return false;
    if (['admin', 'gestao'].includes(staffProfile.role)) return true;
    return staffProfile.branch === branch || staffProfile.additionalBranches.includes(branch);
  }, [staffProfile]);

  const hasRole = useCallback((role: ClinicStaffRole): boolean => {
    return staffProfile?.role === role;
  }, [staffProfile]);

  const availableBranches = staffProfile ? 
    ['admin', 'gestao'].includes(staffProfile.role) 
      ? [] // Admin/Gestao can see all
      : [staffProfile.branch, ...staffProfile.additionalBranches]
    : [];

  const isAdmin = staffProfile?.role === 'admin';
  const isGestao = staffProfile?.role === 'gestao';
  const canCreateSales = staffProfile ? ['admin', 'gestao', 'comercial'].includes(staffProfile.role) : false;
  const canCreateSurgeries = staffProfile ? ['admin', 'gestao', 'operacao', 'comercial'].includes(staffProfile.role) : false;
  const canCreatePatients = staffProfile ? ['admin', 'gestao', 'comercial', 'operacao', 'recepcao'].includes(staffProfile.role) : false;

  // Logout que limpa dados de clínica
  const logout = useCallback(async () => {
    localStorage.removeItem('clinic_current_branch');
    setStaffProfile(null);
    setCurrentBranch('');
    await unified.logout();
  }, [unified]);

  return {
    user: staffProfile,
    session: unified.session,
    isLoading: unified.isLoading || staffLoading,
    currentBranch,
    availableBranches,
    login: unified.login,
    logout,
    switchBranch,
    canAccessBranch,
    hasRole,
    isAdmin,
    isGestao,
    canCreateSales,
    canCreateSurgeries,
    canCreatePatients,
  };
}

// Provider de compatibilidade
export function ClinicAuthProvider({ children }: { children: ReactNode }) {
  return <RealProvider>{children}</RealProvider>;
}
