import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export type NeoTeamRole = 'MASTER' | 'ADMIN' | 'PROFISSIONAL' | 'OPERACIONAL';

export type NeoTeamModule =
  | 'clinico_agenda' | 'clinico_agenda_cirurgica' | 'clinico_sala_espera'
  | 'clinico_pacientes' | 'clinico_prontuarios' | 'clinico_visao_medico'
  | 'operacoes_tarefas' | 'operacoes_documentos' | 'operacoes_pos_venda'
  | 'operacoes_limpeza' | 'operacoes_educacao'
  | 'gestao_eventos' | 'gestao_galerias'
  | 'admin_equipe' | 'admin_relatorios' | 'admin_configuracoes';

export interface TeamMember {
  id: string;
  user_id: string;
  role: NeoTeamRole;
  is_active: boolean;
  doctor_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  doctor_name?: string;
}

export interface ModulePermission {
  id: string;
  team_member_id: string;
  module: NeoTeamModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface AvailableUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export const ROLE_CONFIG: Record<NeoTeamRole, { label: string; color: string; icon: string; level: number }> = {
  MASTER: { label: 'Master', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700', icon: '👑', level: 4 },
  ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700', icon: '🛠', level: 3 },
  PROFISSIONAL: { label: 'Profissional', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700', icon: '👨‍⚕️', level: 2 },
  OPERACIONAL: { label: 'Operacional', color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300 border-slate-300 dark:border-slate-700', icon: '👩‍💼', level: 1 },
};

export const MODULE_GROUPS = [
  {
    label: 'Clínico',
    modules: [
      { key: 'clinico_agenda' as NeoTeamModule, label: 'Agenda' },
      { key: 'clinico_agenda_cirurgica' as NeoTeamModule, label: 'Agenda Cirúrgica' },
      { key: 'clinico_sala_espera' as NeoTeamModule, label: 'Sala de Espera' },
      { key: 'clinico_pacientes' as NeoTeamModule, label: 'Pacientes' },
      { key: 'clinico_prontuarios' as NeoTeamModule, label: 'Prontuários' },
      { key: 'clinico_visao_medico' as NeoTeamModule, label: 'Visão do Médico' },
    ],
  },
  {
    label: 'Operações',
    modules: [
      { key: 'operacoes_tarefas' as NeoTeamModule, label: 'Tarefas' },
      { key: 'operacoes_documentos' as NeoTeamModule, label: 'Documentos' },
      { key: 'operacoes_pos_venda' as NeoTeamModule, label: 'Pós-Venda' },
      { key: 'operacoes_limpeza' as NeoTeamModule, label: 'Limpeza' },
      { key: 'operacoes_educacao' as NeoTeamModule, label: 'Educação' },
    ],
  },
  {
    label: 'Gestão',
    modules: [
      { key: 'gestao_eventos' as NeoTeamModule, label: 'Eventos' },
      { key: 'gestao_galerias' as NeoTeamModule, label: 'Galerias' },
    ],
  },
  {
    label: 'Administração',
    modules: [
      { key: 'admin_equipe' as NeoTeamModule, label: 'Equipe' },
      { key: 'admin_relatorios' as NeoTeamModule, label: 'Relatórios' },
      { key: 'admin_configuracoes' as NeoTeamModule, label: 'Configurações' },
    ],
  },
];

export function useNeoTeamRBAC() {
  const { user, isAdmin: isNeoHubAdmin } = useUnifiedAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myRole, setMyRole] = useState<NeoTeamRole | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      // Fetch team members
      const { data: teamData, error } = await supabase
        .from('neoteam_team_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!teamData || teamData.length === 0) {
        setMembers([]);
        setMyRole(null);
        setIsLoading(false);
        return;
      }

      // Get user details from neohub_users
      const userIds = teamData.map(m => m.user_id);
      const { data: usersData } = await supabase
        .from('neohub_users')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      // Get linked doctors
      const doctorIds = teamData.filter(m => m.doctor_id).map(m => m.doctor_id!);
      let doctorsData: any[] = [];
      if (doctorIds.length > 0) {
        const { data } = await supabase
          .from('neoteam_doctors')
          .select('id, full_name')
          .in('id', doctorIds);
        doctorsData = data || [];
      }

      const usersMap = new Map((usersData || []).map(u => [u.user_id, u]));
      const doctorsMap = new Map(doctorsData.map((d: any) => [d.id, d]));

      const enriched: TeamMember[] = teamData.map(m => {
        const u = usersMap.get(m.user_id);
        const d = m.doctor_id ? doctorsMap.get(m.doctor_id) : null;
        return {
          ...m,
          role: m.role as NeoTeamRole,
          user_name: u?.full_name || 'Usuário desconhecido',
          user_email: u?.email || '',
          user_avatar: u?.avatar_url || null,
          doctor_name: d?.full_name || null,
        };
      });

      setMembers(enriched);

      // Set my role
      const me = enriched.find(m => m.user_id === user.id);
      setMyRole(me?.role || null);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Erro ao carregar equipe');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = useCallback(async (userId: string, role: NeoTeamRole, doctorId?: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('neoteam_team_members')
        .insert({
          user_id: userId,
          role,
          doctor_id: doctorId || null,
          created_by: user.id,
        });
      if (error) throw error;

      // Audit log
      await supabase.from('neoteam_audit_log').insert({
        actor_user_id: user.id,
        action: 'member_added',
        target_user_id: userId,
        resource_type: 'neoteam_team_members',
        new_values: { role, doctor_id: doctorId },
      });

      await fetchMembers();
      toast.success('Membro adicionado com sucesso');
      return true;
    } catch (error: any) {
      if (error?.code === '23505') {
        toast.error('Este usuário já é membro da equipe');
      } else {
        toast.error('Erro ao adicionar membro');
      }
      console.error(error);
      return false;
    }
  }, [user, fetchMembers]);

  const updateMemberRole = useCallback(async (memberId: string, newRole: NeoTeamRole) => {
    if (!user) return false;
    const member = members.find(m => m.id === memberId);
    if (!member) return false;

    // Prevent demoting self
    if (member.user_id === user.id) {
      toast.error('Você não pode alterar seu próprio papel');
      return false;
    }

    // Prevent removing last MASTER
    if (member.role === 'MASTER' && newRole !== 'MASTER') {
      const masterCount = members.filter(m => m.role === 'MASTER' && m.is_active).length;
      if (masterCount <= 1) {
        toast.error('Não é possível remover o último MASTER do sistema');
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from('neoteam_team_members')
        .update({ role: newRole })
        .eq('id', memberId);
      if (error) throw error;

      await supabase.from('neoteam_audit_log').insert({
        actor_user_id: user.id,
        action: 'role_changed',
        target_user_id: member.user_id,
        resource_type: 'neoteam_team_members',
        resource_id: memberId,
        old_values: { role: member.role },
        new_values: { role: newRole },
      });

      await fetchMembers();
      toast.success('Papel atualizado com sucesso');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar papel');
      return false;
    }
  }, [user, members, fetchMembers]);

  const toggleMemberActive = useCallback(async (memberId: string) => {
    if (!user) return false;
    const member = members.find(m => m.id === memberId);
    if (!member) return false;

    if (member.user_id === user.id) {
      toast.error('Você não pode inativar a si mesmo');
      return false;
    }

    if (member.role === 'MASTER' && member.is_active) {
      const masterCount = members.filter(m => m.role === 'MASTER' && m.is_active).length;
      if (masterCount <= 1) {
        toast.error('Não é possível inativar o último MASTER do sistema');
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from('neoteam_team_members')
        .update({ is_active: !member.is_active })
        .eq('id', memberId);
      if (error) throw error;

      await supabase.from('neoteam_audit_log').insert({
        actor_user_id: user.id,
        action: member.is_active ? 'member_deactivated' : 'member_reactivated',
        target_user_id: member.user_id,
        resource_type: 'neoteam_team_members',
        resource_id: memberId,
        old_values: { is_active: member.is_active },
        new_values: { is_active: !member.is_active },
      });

      await fetchMembers();
      toast.success(member.is_active ? 'Membro inativado' : 'Membro reativado');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar status');
      return false;
    }
  }, [user, members, fetchMembers]);

  // Fetch permissions for a member
  const fetchPermissions = useCallback(async (memberId: string): Promise<ModulePermission[]> => {
    const { data, error } = await supabase
      .from('neoteam_module_permissions')
      .select('*')
      .eq('team_member_id', memberId);
    if (error) {
      console.error(error);
      return [];
    }
    return (data || []) as ModulePermission[];
  }, []);

  const savePermissions = useCallback(async (memberId: string, permissions: Partial<ModulePermission>[]) => {
    if (!user) return false;
    try {
      // Delete existing
      await supabase.from('neoteam_module_permissions').delete().eq('team_member_id', memberId);

      // Insert new
      const rows = permissions.map(p => ({
        team_member_id: memberId,
        module: p.module!,
        can_view: p.can_view ?? false,
        can_create: p.can_create ?? false,
        can_edit: p.can_edit ?? false,
        can_delete: p.can_delete ?? false,
      }));

      if (rows.length > 0) {
        const { error } = await supabase.from('neoteam_module_permissions').insert(rows);
        if (error) throw error;
      }

      await supabase.from('neoteam_audit_log').insert({
        actor_user_id: user.id,
        action: 'permissions_updated',
        target_user_id: members.find(m => m.id === memberId)?.user_id || null,
        resource_type: 'neoteam_module_permissions',
        resource_id: memberId,
        new_values: { modules_count: rows.length },
      });

      toast.success('Permissões salvas com sucesso');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar permissões');
      return false;
    }
  }, [user, members]);

  // Search available users from NeoHub
  const searchAvailableUsers = useCallback(async (query: string): Promise<AvailableUser[]> => {
    if (query.length < 2) return [];
    const existingUserIds = members.map(m => m.user_id);

    const { data, error } = await supabase
      .from('neohub_users')
      .select('id, user_id, full_name, email, avatar_url')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(10);

    if (error) {
      console.error(error);
      return [];
    }

    return (data || [])
      .filter(u => !existingUserIds.includes(u.user_id))
      .map(u => ({
        id: u.id,
        user_id: u.user_id,
        full_name: u.full_name || 'Sem nome',
        email: u.email || '',
        avatar_url: u.avatar_url,
      }));
  }, [members]);

  // Fetch available doctors for linking
  const fetchAvailableDoctors = useCallback(async (): Promise<{ id: string; name: string }[]> => {
    const { data, error } = await supabase
      .from('neoteam_doctors')
      .select('id, full_name')
      .order('full_name');
    if (error) {
      console.error(error);
      return [];
    }
    return (data || []).map((d: any) => ({ id: d.id, name: d.full_name }));
  }, []);

  const isAdminOrAbove = myRole === 'MASTER' || myRole === 'ADMIN' || isNeoHubAdmin;
  const isMaster = myRole === 'MASTER' || isNeoHubAdmin;
  const hasNoMembers = !isLoading && members.length === 0;

  // Bootstrap: auto-register the current user as MASTER if no members exist
  const bootstrapMaster = useCallback(async () => {
    if (!user || !hasNoMembers) return false;
    try {
      const { error } = await supabase
        .from('neoteam_team_members')
        .insert({
          user_id: user.id,
          role: 'MASTER' as NeoTeamRole,
          created_by: user.id,
        });
      if (error) throw error;

      await supabase.from('neoteam_audit_log').insert({
        actor_user_id: user.id,
        action: 'bootstrap_master',
        target_user_id: user.id,
        resource_type: 'neoteam_team_members',
        new_values: { role: 'MASTER' },
      });

      await fetchMembers();
      toast.success('Você foi cadastrado como MASTER da equipe');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Erro ao inicializar equipe');
      return false;
    }
  }, [user, hasNoMembers, fetchMembers]);

  return {
    members,
    isLoading,
    myRole,
    isAdminOrAbove,
    isMaster,
    hasNoMembers,
    addMember,
    updateMemberRole,
    toggleMemberActive,
    fetchPermissions,
    savePermissions,
    searchAvailableUsers,
    fetchAvailableDoctors,
    bootstrapMaster,
    refetch: fetchMembers,
  };
}
