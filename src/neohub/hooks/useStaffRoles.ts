import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface StaffRole {
  id: string;
  code: string;
  name: string;
  department: string;
  description: string | null;
  default_route: string | null;
  icon: string;
  color: string;
  is_active: boolean;
}

export interface UserStaffRole {
  role_code: string;
  role_name: string;
  department: string;
  default_route: string;
  icon: string;
  color: string;
  branch_id: string | null;
  branch_name: string | null;
}

export interface StaffUserRole {
  id: string;
  neohub_user_id: string;
  role_id: string;
  branch_id: string | null;
  granted_at: string;
  is_active: boolean;
  role?: StaffRole;
}

export function useStaffRoles() {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  // Fetch all available roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['staff-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .eq('is_active', true)
        .order('department', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as StaffRole[];
    },
  });

  // Fetch current user's roles
  const { data: myRoles = [], isLoading: isLoadingMyRoles } = useQuery({
    queryKey: ['my-staff-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('get_user_staff_roles', { p_user_id: user.id });

      if (error) throw error;
      return data as UserStaffRole[];
    },
    enabled: !!user?.id,
  });

  // Group roles by department
  const rolesByDepartment = roles.reduce((acc, role) => {
    const dept = role.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(role);
    return acc;
  }, {} as Record<string, StaffRole[]>);

  // Department labels
  const departmentLabels: Record<string, string> = {
    clinico: 'Clínico',
    operacoes: 'Operações',
    comercial: 'Comercial',
    sucesso_paciente: 'Sucesso do Paciente',
    marketing: 'Marketing',
    financeiro: 'Financeiro',
    ti_dados: 'TI & Dados',
    gestao: 'Gestão',
    executivo: 'Executivo',
  };

  // Assign role to user
  const assignRole = useMutation({
    mutationFn: async ({
      neohubUserId,
      roleId,
      branchId,
    }: {
      neohubUserId: string;
      roleId: string;
      branchId?: string;
    }) => {
      const { error } = await supabase
        .from('staff_user_roles')
        .insert({
          neohub_user_id: neohubUserId,
          role_id: roleId,
          branch_id: branchId || null,
          granted_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-user-roles'] });
      toast.success('Cargo atribuído com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atribuir cargo: ${error.message}`);
    },
  });

  // Remove role from user
  const removeRole = useMutation({
    mutationFn: async (userRoleId: string) => {
      const { error } = await supabase
        .from('staff_user_roles')
        .update({ is_active: false })
        .eq('id', userRoleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-user-roles'] });
      toast.success('Cargo removido com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover cargo: ${error.message}`);
    },
  });

  // Get user's roles by user ID
  const getUserRoles = async (userId: string): Promise<UserStaffRole[]> => {
    const { data, error } = await supabase
      .rpc('get_user_staff_roles', { p_user_id: userId });

    if (error) throw error;
    return data as UserStaffRole[];
  };

  // Fetch all user role assignments (for admin)
  const useUserRolesQuery = (neohubUserId?: string) => {
    return useQuery({
      queryKey: ['staff-user-roles', neohubUserId],
      queryFn: async () => {
        let query = supabase
          .from('staff_user_roles')
          .select(`
            *,
            role:staff_roles(*)
          `)
          .eq('is_active', true);

        if (neohubUserId) {
          query = query.eq('neohub_user_id', neohubUserId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as StaffUserRole[];
      },
      enabled: !!neohubUserId || true,
    });
  };

  return {
    roles,
    myRoles,
    rolesByDepartment,
    departmentLabels,
    isLoading: isLoadingRoles || isLoadingMyRoles,
    assignRole,
    removeRole,
    getUserRoles,
    useUserRolesQuery,
  };
}

// Department icons for UI
export const DEPARTMENT_ICONS: Record<string, string> = {
  clinico: 'Stethoscope',
  operacoes: 'Settings',
  comercial: 'TrendingUp',
  sucesso_paciente: 'Star',
  marketing: 'Megaphone',
  financeiro: 'DollarSign',
  ti_dados: 'BarChart',
  gestao: 'Users',
  executivo: 'Crown',
};

export const DEPARTMENT_COLORS: Record<string, string> = {
  clinico: 'bg-cyan-500',
  operacoes: 'bg-blue-500',
  comercial: 'bg-green-500',
  sucesso_paciente: 'bg-yellow-500',
  marketing: 'bg-pink-500',
  financeiro: 'bg-emerald-500',
  ti_dados: 'bg-purple-500',
  gestao: 'bg-indigo-500',
  executivo: 'bg-amber-500',
};
