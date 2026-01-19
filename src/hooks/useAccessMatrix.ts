import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NeoHubProfile, Portal, PORTAL_MODULES } from '@/neohub/lib/permissions';
import { toast } from 'sonner';

export type OperationType = 'clinica' | 'academy' | 'consultoria';

export interface ModulePermission {
  id: string;
  moduleCode: string;
  moduleName: string;
  portal: Portal;
  profile: NeoHubProfile;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  blockReason?: string;
}

export interface ModuleInfo {
  code: string;
  name: string;
  route: string;
  icon: string;
}

// Standard block reasons
export const BLOCK_REASONS: Record<string, string> = {
  patient_data: 'Evita exposição indevida de dados clínicos.',
  financial_sensitive: 'Dados financeiros restritos por política de segurança.',
  admin_only: 'Funcionalidade exclusiva para administradores.',
  role_mismatch: 'Perfil não possui responsabilidades neste módulo.',
  compliance: 'Restrição por conformidade regulatória.',
  data_integrity: 'Proteção contra alterações não autorizadas.',
};

export function useAccessMatrix() {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch permissions from database
  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('neohub_module_permissions')
        .select('*')
        .order('portal')
        .order('module_code');

      if (error) throw error;

      const formattedPermissions: ModulePermission[] = data.map(p => ({
        id: p.id,
        moduleCode: p.module_code,
        moduleName: p.module_name,
        portal: p.portal as Portal,
        profile: p.profile as NeoHubProfile,
        canRead: p.can_read ?? false,
        canWrite: p.can_write ?? false,
        canDelete: p.can_delete ?? false,
      }));

      setPermissions(formattedPermissions);
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

  // Get modules by portal
  const getModulesByPortal = useCallback((portal: Portal): ModuleInfo[] => {
    return PORTAL_MODULES[portal] || [];
  }, []);

  // Get permission for a specific module and profile
  const getPermissionForModule = useCallback((
    moduleCode: string, 
    profile: NeoHubProfile
  ): ModulePermission | undefined => {
    return permissions.find(p => p.moduleCode === moduleCode && p.profile === profile);
  }, [permissions]);

  // Update a permission
  const updatePermission = useCallback(async (
    moduleCode: string,
    profile: NeoHubProfile,
    updates: Partial<Pick<ModulePermission, 'canRead' | 'canWrite' | 'canDelete'>>
  ) => {
    try {
      const existing = getPermissionForModule(moduleCode, profile);
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('neohub_module_permissions')
          .update({
            can_read: updates.canRead ?? existing.canRead,
            can_write: updates.canWrite ?? existing.canWrite,
            can_delete: updates.canDelete ?? existing.canDelete,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Find module info
        let moduleInfo: { name: string; portal: Portal } | null = null;
        for (const [portalKey, modules] of Object.entries(PORTAL_MODULES)) {
          const mod = modules.find(m => m.code === moduleCode);
          if (mod) {
            moduleInfo = { name: mod.name, portal: portalKey as Portal };
            break;
          }
        }

        if (!moduleInfo) {
          throw new Error('Module not found');
        }

        // Create new permission
        const { error } = await supabase
          .from('neohub_module_permissions')
          .insert({
            module_code: moduleCode,
            module_name: moduleInfo.name,
            portal: moduleInfo.portal,
            profile: profile,
            can_read: updates.canRead ?? false,
            can_write: updates.canWrite ?? false,
            can_delete: updates.canDelete ?? false,
          });

        if (error) throw error;
      }

      // Refetch permissions
      await fetchPermissions();
      toast.success('Permissão atualizada com sucesso');
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Erro ao atualizar permissão');
    }
  }, [getPermissionForModule, fetchPermissions]);

  // Apply a smart trail (preset configuration)
  const applySmartTrail = useCallback(async (
    trailId: string,
    targetProfiles: NeoHubProfile[]
  ) => {
    // Trail configurations
    const trails: Record<string, Record<string, { read: boolean; write: boolean; delete: boolean }>> = {
      clinica_padrao: {
        // Standard clinic configuration
        neocare_appointments: { read: true, write: true, delete: true },
        neocare_history: { read: true, write: false, delete: false },
        neoteam_schedule: { read: true, write: true, delete: false },
        neoteam_patients: { read: true, write: true, delete: false },
      },
      academy_licenciamento: {
        // Academy with licensing
        academy_courses: { read: true, write: false, delete: false },
        academy_materials: { read: true, write: false, delete: false },
        academy_certificates: { read: true, write: false, delete: false },
        neolicense_dashboard: { read: true, write: false, delete: false },
      },
      consultoria_avivar: {
        // Avivar consulting unit
        avivar_dashboard: { read: true, write: true, delete: false },
        avivar_hotleads: { read: true, write: true, delete: true },
        avivar_marketing: { read: true, write: true, delete: false },
      },
    };

    const trailConfig = trails[trailId];
    if (!trailConfig) {
      toast.error('Trilha não encontrada');
      return;
    }

    try {
      for (const [moduleCode, perms] of Object.entries(trailConfig)) {
        for (const profile of targetProfiles) {
          await updatePermission(moduleCode, profile, {
            canRead: perms.read,
            canWrite: perms.write,
            canDelete: perms.delete,
          });
        }
      }
      
      toast.success('Trilha aplicada com sucesso!');
    } catch (error) {
      console.error('Error applying trail:', error);
      toast.error('Erro ao aplicar trilha');
    }
  }, [updatePermission]);

  // Export permissions as CSV
  const exportAsCSV = useCallback(() => {
    const headers = ['Portal', 'Módulo', 'Perfil', 'Leitura', 'Escrita', 'Exclusão'];
    const rows = permissions.map(p => [
      p.portal,
      p.moduleName,
      p.profile,
      p.canRead ? 'Sim' : 'Não',
      p.canWrite ? 'Sim' : 'Não',
      p.canDelete ? 'Sim' : 'Não',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `access-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Arquivo exportado com sucesso');
  }, [permissions]);

  return {
    permissions,
    isLoading,
    getModulesByPortal,
    getPermissionForModule,
    updatePermission,
    applySmartTrail,
    exportAsCSV,
    refetch: fetchPermissions,
  };
}