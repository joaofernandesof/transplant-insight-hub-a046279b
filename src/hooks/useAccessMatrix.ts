import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ====================================
// Types
// ====================================

export interface RbacRole {
  id: string;
  name: string;
  displayName: string;
  hierarchyLevel: number;
}

export interface RbacPortal {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  orderIndex: number;
}

export interface RbacModule {
  id: string;
  portalId: string;
  portalSlug: string;
  code: string;
  name: string;
  icon: string | null;
  orderIndex: number;
}

export interface RbacPermission {
  id: string;
  roleId: string;
  moduleId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  canConfigure: boolean;
}

export type PermissionField = 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canApprove' | 'canExport' | 'canConfigure';

// ====================================
// Hook
// ====================================

export function useAccessMatrix() {
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [portals, setPortals] = useState<RbacPortal[]>([]);
  const [modules, setModules] = useState<RbacModule[]>([]);
  const [permissions, setPermissions] = useState<RbacPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data in parallel
  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rolesRes, portalsRes, modulesRes, permsRes] = await Promise.all([
        supabase.from('roles').select('*').order('hierarchy_level'),
        supabase.from('portals').select('*').eq('is_active', true).order('order_index'),
        supabase.from('modules').select('*, portals!inner(slug)').eq('is_active', true).order('order_index'),
        supabase.from('role_module_permissions').select('*'),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (portalsRes.error) throw portalsRes.error;
      if (modulesRes.error) throw modulesRes.error;
      if (permsRes.error) throw permsRes.error;

      setRoles((rolesRes.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        displayName: r.display_name || r.name,
        hierarchyLevel: r.hierarchy_level ?? 99,
      })));

      setPortals((portalsRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        icon: p.icon,
        orderIndex: p.order_index ?? 0,
      })));

      setModules((modulesRes.data || []).map((m: any) => ({
        id: m.id,
        portalId: m.portal_id,
        portalSlug: (m as any).portals?.slug || '',
        code: m.code,
        name: m.name,
        icon: m.icon,
        orderIndex: m.order_index ?? 0,
      })));

      setPermissions((permsRes.data || []).map((p: any) => ({
        id: p.id,
        roleId: p.role_id,
        moduleId: p.module_id,
        canView: p.can_view ?? false,
        canCreate: p.can_create ?? false,
        canEdit: p.can_edit ?? false,
        canDelete: p.can_delete ?? false,
        canApprove: p.can_approve ?? false,
        canExport: p.can_export ?? false,
        canConfigure: p.can_configure ?? false,
      })));
    } catch (error) {
      console.error('Error fetching access matrix:', error);
      toast.error('Erro ao carregar matriz de acesso');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Get modules grouped by portal
  const modulesByPortal = useMemo(() => {
    const map: Record<string, RbacModule[]> = {};
    for (const mod of modules) {
      if (!map[mod.portalId]) map[mod.portalId] = [];
      map[mod.portalId].push(mod);
    }
    return map;
  }, [modules]);

  // Get permission for a specific role + module
  const getPermission = useCallback((roleId: string, moduleId: string): RbacPermission | undefined => {
    return permissions.find(p => p.roleId === roleId && p.moduleId === moduleId);
  }, [permissions]);

  // Update or create permission
  const updatePermission = useCallback(async (
    roleId: string,
    moduleId: string,
    updates: Partial<Pick<RbacPermission, PermissionField>>
  ) => {
    try {
      // Super admin can't be edited
      const role = roles.find(r => r.id === roleId);
      if (role?.name === 'super_administrador') {
        toast.info('Super Administrador possui acesso total e não pode ser alterado.');
        return;
      }

      const existing = getPermission(roleId, moduleId);

      const dbUpdates: Record<string, boolean> = {};
      if (updates.canView !== undefined) dbUpdates.can_view = updates.canView;
      if (updates.canCreate !== undefined) dbUpdates.can_create = updates.canCreate;
      if (updates.canEdit !== undefined) dbUpdates.can_edit = updates.canEdit;
      if (updates.canDelete !== undefined) dbUpdates.can_delete = updates.canDelete;
      if (updates.canApprove !== undefined) dbUpdates.can_approve = updates.canApprove;
      if (updates.canExport !== undefined) dbUpdates.can_export = updates.canExport;
      if (updates.canConfigure !== undefined) dbUpdates.can_configure = updates.canConfigure;

      if (existing) {
        const { error } = await supabase
          .from('role_module_permissions')
          .update(dbUpdates)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('role_module_permissions')
          .insert({
            role_id: roleId,
            module_id: moduleId,
            can_view: updates.canView ?? false,
            can_create: updates.canCreate ?? false,
            can_edit: updates.canEdit ?? false,
            can_delete: updates.canDelete ?? false,
            can_approve: updates.canApprove ?? false,
            can_export: updates.canExport ?? false,
            can_configure: updates.canConfigure ?? false,
          });
        if (error) throw error;
      }

      // Refetch
      await fetchAll();
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Erro ao atualizar permissão');
    }
  }, [roles, getPermission, fetchAll]);

  // Portal summary: how many modules a role can view in a portal
  const getPortalSummary = useCallback((portalId: string, roleId: string) => {
    const portalModules = modulesByPortal[portalId] || [];
    const role = roles.find(r => r.id === roleId);
    const isSuperAdmin = role?.name === 'super_administrador';

    let viewCount = 0, createCount = 0, editCount = 0, deleteCount = 0;
    for (const mod of portalModules) {
      if (isSuperAdmin) {
        viewCount++; createCount++; editCount++; deleteCount++;
      } else {
        const perm = getPermission(roleId, mod.id);
        if (perm?.canView) viewCount++;
        if (perm?.canCreate) createCount++;
        if (perm?.canEdit) editCount++;
        if (perm?.canDelete) deleteCount++;
      }
    }
    return { viewCount, createCount, editCount, deleteCount, total: portalModules.length };
  }, [modulesByPortal, roles, getPermission]);

  // Export as CSV
  const exportAsCSV = useCallback(() => {
    const headers = ['Portal', 'Módulo', 'Função', 'Visualizar', 'Criar', 'Editar', 'Excluir'];
    const rows: string[][] = [];

    for (const portal of portals) {
      const portalMods = modulesByPortal[portal.id] || [];
      for (const mod of portalMods) {
        for (const role of roles) {
          const perm = getPermission(role.id, mod.id);
          const isSA = role.name === 'super_administrador';
          rows.push([
            portal.name,
            mod.name,
            role.displayName,
            isSA || perm?.canView ? 'Sim' : 'Não',
            isSA || perm?.canCreate ? 'Sim' : 'Não',
            isSA || perm?.canEdit ? 'Sim' : 'Não',
            isSA || perm?.canDelete ? 'Sim' : 'Não',
          ]);
        }
      }
    }

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `access-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo exportado com sucesso');
  }, [portals, roles, modulesByPortal, getPermission]);

  return {
    roles,
    portals,
    modules,
    permissions,
    modulesByPortal,
    isLoading,
    getPermission,
    updatePermission,
    getPortalSummary,
    exportAsCSV,
    refetch: fetchAll,
  };
}
