import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'licensee' | 'colaborador' | 'aluno' | 'paciente';

export interface ModulePermission {
  id: string;
  module_code: string;
  module_name: string;
  module_category: string;
  profile: AppRole;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

export const ACCESS_PROFILES = [
  { id: 'admin' as AppRole, name: 'Administrador', color: 'text-amber-600 bg-amber-100', icon: 'Crown' },
  { id: 'licensee' as AppRole, name: 'Licenciado', color: 'text-blue-600 bg-blue-100', icon: 'Shield' },
  { id: 'colaborador' as AppRole, name: 'Colaborador', color: 'text-green-600 bg-green-100', icon: 'Building2' },
  { id: 'aluno' as AppRole, name: 'Aluno', color: 'text-purple-600 bg-purple-100', icon: 'GraduationCap' },
  { id: 'paciente' as AppRole, name: 'Paciente', color: 'text-rose-600 bg-rose-100', icon: 'Heart' },
];

export function useModulePermissions() {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('module_permissions')
        .select('*')
        .order('module_category')
        .order('module_code');

      if (error) throw error;

      setPermissions((data || []).map(p => ({
        ...p,
        profile: p.profile as AppRole,
      })));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const getPermissionMatrix = useCallback(() => {
    const matrix: Record<string, Record<string, { read: boolean; write: boolean; delete: boolean }>> = {};
    
    permissions.forEach(p => {
      if (!matrix[p.module_code]) {
        matrix[p.module_code] = {};
      }
      matrix[p.module_code][p.profile] = {
        read: p.can_read ?? false,
        write: p.can_write ?? false,
        delete: p.can_delete ?? false,
      };
    });
    
    return matrix;
  }, [permissions]);

  const updatePermission = useCallback(async (
    moduleCode: string,
    profile: AppRole,
    field: 'can_read' | 'can_write' | 'can_delete',
    value: boolean
  ) => {
    // Don't allow changing admin permissions
    if (profile === 'admin') {
      toast.info('O perfil Administrador possui acesso total e não pode ser alterado.');
      return;
    }

    try {
      const existing = permissions.find(p => p.module_code === moduleCode && p.profile === profile);
      
      let updates: Partial<ModulePermission> = { [field]: value };
      
      // If disabling read, also disable write and delete
      if (field === 'can_read' && !value) {
        updates = { can_read: false, can_write: false, can_delete: false };
      }
      // If enabling write or delete, also enable read
      else if ((field === 'can_write' || field === 'can_delete') && value) {
        updates = { ...updates, can_read: true };
      }

      if (existing) {
        const { error } = await supabase
          .from('module_permissions')
          .update(updates)
          .eq('id', existing.id);

        if (error) throw error;
      }

      // Update local state
      setPermissions(prev => prev.map(p => 
        p.module_code === moduleCode && p.profile === profile
          ? { ...p, ...updates }
          : p
      ));

    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Erro ao atualizar permissão');
    }
  }, [permissions]);

  const saveAllPermissions = useCallback(async () => {
    setIsSaving(true);
    try {
      // Permissions are saved individually as they're changed
      toast.success('Permissões salvas com sucesso!');
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    permissions,
    isLoading,
    isSaving,
    getPermissionMatrix,
    updatePermission,
    saveAllPermissions,
    refetch: fetchPermissions,
  };
}
