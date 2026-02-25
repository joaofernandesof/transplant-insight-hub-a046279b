import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Shield, Save, Loader2, ArrowLeft, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  useNeoTeamRBAC, NeoTeamModule, ModulePermission, ROLE_CONFIG, MODULE_GROUPS, TeamMember,
} from '@/neohub/hooks/useNeoTeamRBAC';

interface PermissionsTabProps {
  memberId: string | null;
  onBack: () => void;
}

type PermMap = Record<NeoTeamModule, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>;

const emptyPerm = () => ({ can_view: false, can_create: false, can_edit: false, can_delete: false });

export function PermissionsTab({ memberId, onBack }: PermissionsTabProps) {
  const { members, fetchPermissions, savePermissions, isAdminOrAbove } = useNeoTeamRBAC();
  const [permMap, setPermMap] = useState<PermMap>({} as PermMap);
  const [isLoadingPerms, setIsLoadingPerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(memberId);

  const member = members.find(m => m.id === selectedMemberId);

  const loadPermissions = useCallback(async (mid: string) => {
    setIsLoadingPerms(true);
    const perms = await fetchPermissions(mid);
    const map: PermMap = {} as PermMap;
    MODULE_GROUPS.forEach(g => g.modules.forEach(m => {
      const existing = perms.find(p => p.module === m.key);
      map[m.key] = existing
        ? { can_view: existing.can_view, can_create: existing.can_create, can_edit: existing.can_edit, can_delete: existing.can_delete }
        : emptyPerm();
    }));
    setPermMap(map);
    setIsLoadingPerms(false);
  }, [fetchPermissions]);

  useEffect(() => {
    if (selectedMemberId) loadPermissions(selectedMemberId);
  }, [selectedMemberId, loadPermissions]);

  const togglePerm = (module: NeoTeamModule, action: keyof ReturnType<typeof emptyPerm>) => {
    setPermMap(prev => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module][action] },
    }));
  };

  const toggleAllInGroup = (groupModules: { key: NeoTeamModule }[], action: keyof ReturnType<typeof emptyPerm>) => {
    const allChecked = groupModules.every(m => permMap[m.key]?.[action]);
    setPermMap(prev => {
      const next = { ...prev };
      groupModules.forEach(m => {
        next[m.key] = { ...next[m.key], [action]: !allChecked };
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedMemberId) return;
    setIsSaving(true);
    const perms = Object.entries(permMap)
      .filter(([, v]) => v.can_view || v.can_create || v.can_edit || v.can_delete)
      .map(([module, v]) => ({
        module: module as NeoTeamModule,
        ...v,
      }));
    await savePermissions(selectedMemberId, perms);
    setIsSaving(false);
  };

  const selectAllPermissions = () => {
    setPermMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        next[key as NeoTeamModule] = { can_view: true, can_create: true, can_edit: true, can_delete: true };
      });
      return next;
    });
  };

  const clearAllPermissions = () => {
    setPermMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        next[key as NeoTeamModule] = emptyPerm();
      });
      return next;
    });
  };

  if (!selectedMemberId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões por Módulo
          </CardTitle>
          <CardDescription>Selecione um membro para gerenciar suas permissões</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedMemberId}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Selecione um membro..." />
            </SelectTrigger>
            <SelectContent>
              {members.filter(m => m.is_active).map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex items-center gap-2">
                    <span>{ROLE_CONFIG[m.role].icon}</span>
                    <span>{m.user_name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissões
              </CardTitle>
              {member && (
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.user_avatar || undefined} />
                    <AvatarFallback className="text-[10px]">{member.user_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{member.user_name}</span>
                  <Badge variant="outline" className={`${ROLE_CONFIG[member.role].color} border text-xs`}>
                    {ROLE_CONFIG[member.role].icon} {ROLE_CONFIG[member.role].label}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAllPermissions}>
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              Marcar Todos
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllPermissions}>
              Limpar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingPerms ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {MODULE_GROUPS.map(group => (
              <div key={group.label} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 border-b">
                  <h3 className="font-semibold text-sm">{group.label}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-[200px]">Módulo</th>
                        {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map(action => (
                          <th key={action} className="text-center text-xs font-medium text-muted-foreground px-2 py-2 w-[90px]">
                            <button
                              className="hover:text-foreground transition-colors cursor-pointer"
                              onClick={() => toggleAllInGroup(group.modules, action)}
                            >
                              {{ can_view: 'Visualizar', can_create: 'Criar', can_edit: 'Editar', can_delete: 'Excluir' }[action]}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.modules.map(mod => (
                        <tr key={mod.key} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 text-sm">{mod.label}</td>
                          {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map(action => (
                            <td key={action} className="text-center px-2 py-2.5">
                              <Checkbox
                                checked={permMap[mod.key]?.[action] ?? false}
                                onCheckedChange={() => togglePerm(mod.key, action)}
                                disabled={!isAdminOrAbove}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
