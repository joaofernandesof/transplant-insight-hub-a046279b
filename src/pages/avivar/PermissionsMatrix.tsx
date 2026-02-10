/**
 * PermissionsMatrix - Matriz de Permissões redesenhada
 * Layout com seletor de função, categorias agrupadas e checkboxes coloridos
 */

import { useState, useCallback } from 'react';
import { 
  Shield, 
  Save,
  Info,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

type RoleId = 'admin' | 'coordenador' | 'sdr' | 'atendente';

interface RoleConfig {
  id: RoleId;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface PermissionItem {
  key: string;
  label: string;
}

interface PermissionCategory {
  key: string;
  label: string;
  icon: string;
  items: PermissionItem[];
}

type ActionType = 'view' | 'create' | 'edit' | 'delete';

// ============================================
// DATA
// ============================================

const ROLES: RoleConfig[] = [
  { id: 'admin', label: 'Administrador', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
  { id: 'coordenador', label: 'Coordenador', color: 'text-purple-700', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
  { id: 'sdr', label: 'SDR', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300' },
  { id: 'atendente', label: 'Atendente', color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-300' },
];

const ACTIONS: { key: ActionType; label: string; color: string; checkColor: string; headerBg: string }[] = [
  { key: 'view', label: 'Visualizar', color: 'text-blue-600', checkColor: 'data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-blue-300', headerBg: 'bg-blue-50 text-blue-700' },
  { key: 'create', label: 'Inserir', color: 'text-emerald-600', checkColor: 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 border-emerald-300', headerBg: 'bg-emerald-50 text-emerald-700' },
  { key: 'edit', label: 'Alterar', color: 'text-amber-600', checkColor: 'data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 border-amber-300', headerBg: 'bg-amber-50 text-amber-700' },
  { key: 'delete', label: 'Excluir', color: 'text-red-600', checkColor: 'data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 border-red-300', headerBg: 'bg-red-50 text-red-700' },
];

const CATEGORIES: PermissionCategory[] = [
  {
    key: 'leads',
    label: 'Leads / Funis',
    icon: '📊',
    items: [
      { key: 'leads_view', label: 'Ver leads' },
      { key: 'leads_create', label: 'Criar leads' },
      { key: 'leads_edit', label: 'Editar leads' },
      { key: 'leads_delete', label: 'Excluir leads' },
      { key: 'leads_move', label: 'Mover no Kanban' },
    ],
  },
  {
    key: 'chats',
    label: 'Chats / Inbox',
    icon: '💬',
    items: [
      { key: 'chats_view', label: 'Ver conversas' },
      { key: 'chats_send', label: 'Enviar mensagens' },
      { key: 'chats_assign', label: 'Atribuir conversas' },
      { key: 'chats_close', label: 'Encerrar conversas' },
    ],
  },
  {
    key: 'agenda',
    label: 'Agenda',
    icon: '📅',
    items: [
      { key: 'agenda_view', label: 'Ver agendamentos' },
      { key: 'agenda_create', label: 'Criar agendamentos' },
      { key: 'agenda_edit', label: 'Editar agendamentos' },
      { key: 'agenda_cancel', label: 'Cancelar agendamentos' },
    ],
  },
  {
    key: 'followup',
    label: 'Follow-up',
    icon: '🔄',
    items: [
      { key: 'followup_view', label: 'Ver follow-ups' },
      { key: 'followup_create', label: 'Criar regras' },
      { key: 'followup_edit', label: 'Editar regras' },
      { key: 'followup_pause', label: 'Pausar / cancelar' },
    ],
  },
  {
    key: 'ai',
    label: 'Configurações IA',
    icon: '🤖',
    items: [
      { key: 'ai_agents', label: 'Configurar agentes' },
      { key: 'ai_prompts', label: 'Editar prompts' },
      { key: 'ai_toggle', label: 'Ativar / desativar IA' },
    ],
  },
  {
    key: 'team',
    label: 'Equipe',
    icon: '👥',
    items: [
      { key: 'team_view', label: 'Ver membros' },
      { key: 'team_add', label: 'Adicionar membros' },
      { key: 'team_edit', label: 'Editar membros' },
      { key: 'team_remove', label: 'Remover membros' },
    ],
  },
  {
    key: 'reports',
    label: 'Relatórios',
    icon: '📈',
    items: [
      { key: 'reports_view', label: 'Ver dashboards' },
      { key: 'reports_export', label: 'Exportar dados' },
    ],
  },
];

// Default permissions per role
function buildDefaultPermissions(): Record<RoleId, Record<string, Record<ActionType, boolean>>> {
  const allTrue = (items: PermissionItem[]) => {
    const result: Record<string, Record<ActionType, boolean>> = {};
    items.forEach(i => { result[i.key] = { view: true, create: true, edit: true, delete: true }; });
    return result;
  };
  const allFalse = (items: PermissionItem[]) => {
    const result: Record<string, Record<ActionType, boolean>> = {};
    items.forEach(i => { result[i.key] = { view: false, create: false, edit: false, delete: false }; });
    return result;
  };

  const allItems = CATEGORIES.flatMap(c => c.items);

  return {
    admin: allTrue(allItems),
    coordenador: (() => {
      const perms = allTrue(allItems);
      // Coordenador: tudo exceto config IA delete
      CATEGORIES.find(c => c.key === 'ai')?.items.forEach(i => {
        perms[i.key] = { view: true, create: false, edit: false, delete: false };
      });
      return perms;
    })(),
    sdr: (() => {
      const perms = allFalse(allItems);
      // SDR: leads, agenda, followup full; chats view+send; team view; reports view
      ['leads_view', 'leads_create', 'leads_edit', 'leads_move'].forEach(k => { if (perms[k]) { perms[k].view = true; perms[k].create = true; perms[k].edit = true; } });
      ['leads_delete'].forEach(k => { if (perms[k]) { perms[k].view = true; } });
      ['chats_view', 'chats_send'].forEach(k => { if (perms[k]) { perms[k].view = true; perms[k].create = true; } });
      ['agenda_view', 'agenda_create', 'agenda_edit'].forEach(k => { if (perms[k]) { perms[k].view = true; perms[k].create = true; perms[k].edit = true; } });
      ['followup_view', 'followup_create', 'followup_edit'].forEach(k => { if (perms[k]) { perms[k].view = true; perms[k].create = true; perms[k].edit = true; } });
      ['team_view'].forEach(k => { if (perms[k]) perms[k].view = true; });
      ['reports_view'].forEach(k => { if (perms[k]) perms[k].view = true; });
      return perms;
    })(),
    atendente: (() => {
      const perms = allFalse(allItems);
      ['leads_view', 'leads_edit'].forEach(k => { if (perms[k]) { perms[k].view = true; perms[k].edit = true; } });
      ['chats_view', 'chats_send', 'chats_close'].forEach(k => { if (perms[k]) { perms[k].view = true; perms[k].create = true; } });
      ['agenda_view'].forEach(k => { if (perms[k]) perms[k].view = true; });
      return perms;
    })(),
  };
}

// ============================================
// COMPONENT
// ============================================

export default function PermissionsMatrix() {
  const [selectedRole, setSelectedRole] = useState<RoleId>('admin');
  const [permissions, setPermissions] = useState(buildDefaultPermissions);
  const [hasChanges, setHasChanges] = useState(false);

  const rolePerms = permissions[selectedRole];

  const togglePermission = useCallback((itemKey: string, action: ActionType) => {
    if (selectedRole === 'admin') {
      toast.info('O perfil Administrador possui acesso total e não pode ser alterado.');
      return;
    }
    setPermissions(prev => {
      const updated = { ...prev };
      const roleData = { ...updated[selectedRole] };
      roleData[itemKey] = { ...roleData[itemKey], [action]: !roleData[itemKey][action] };
      
      // If disabling view, disable all
      if (action === 'view' && !roleData[itemKey].view) {
        roleData[itemKey] = { view: false, create: false, edit: false, delete: false };
      }
      // If enabling create/edit/delete, also enable view
      if (action !== 'view' && roleData[itemKey][action]) {
        roleData[itemKey].view = true;
      }
      
      updated[selectedRole] = roleData;
      return updated;
    });
    setHasChanges(true);
  }, [selectedRole]);

  const toggleCategoryAll = useCallback((category: PermissionCategory, action: ActionType) => {
    if (selectedRole === 'admin') {
      toast.info('O perfil Administrador possui acesso total e não pode ser alterado.');
      return;
    }
    const allChecked = category.items.every(item => rolePerms[item.key]?.[action]);
    setPermissions(prev => {
      const updated = { ...prev };
      const roleData = { ...updated[selectedRole] };
      category.items.forEach(item => {
        roleData[item.key] = { ...roleData[item.key], [action]: !allChecked };
        if (action === 'view' && allChecked) {
          roleData[item.key] = { view: false, create: false, edit: false, delete: false };
        }
        if (action !== 'view' && !allChecked) {
          roleData[item.key].view = true;
        }
      });
      updated[selectedRole] = roleData;
      return updated;
    });
    setHasChanges(true);
  }, [selectedRole, rolePerms]);

  const isCategoryAllChecked = (category: PermissionCategory, action: ActionType) => {
    return category.items.every(item => rolePerms[item.key]?.[action]);
  };

  const isCategorySomeChecked = (category: PermissionCategory, action: ActionType) => {
    const checked = category.items.filter(item => rolePerms[item.key]?.[action]).length;
    return checked > 0 && checked < category.items.length;
  };

  const saveChanges = () => {
    toast.success('Permissões salvas com sucesso!');
    setHasChanges(false);
  };

  const currentRoleConfig = ROLES.find(r => r.id === selectedRole)!;

  return (
    <div className="space-y-6">
      {/* Info */}
      <Card className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.2)]">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-[hsl(var(--avivar-primary))] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
              Matriz de Permissões
            </p>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              Selecione uma função acima e configure quais ações cada perfil pode realizar em cada módulo do sistema.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Role Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[hsl(var(--avivar-muted-foreground))] mr-1">Configurar função:</span>
        {ROLES.map(role => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
              selectedRole === role.id
                ? cn(role.bgColor, role.color, role.borderColor, "shadow-sm ring-2 ring-offset-1", role.borderColor.replace('border-', 'ring-'))
                : "bg-[hsl(var(--avivar-card))] text-[hsl(var(--avivar-muted-foreground))] border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-muted))]"
            )}
          >
            {role.label}
          </button>
        ))}

        {hasChanges && (
          <Button
            onClick={saveChanges}
            size="sm"
            className="ml-auto bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        )}
      </div>

      {/* Permissions Table */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px] border-b border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted)/0.5)]">
              <div className="px-4 py-3 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                Funcionalidade
              </div>
              {ACTIONS.map(action => (
                <div key={action.key} className={cn("px-2 py-3 text-center text-xs font-semibold rounded-t", action.headerBg)}>
                  {action.label}
                </div>
              ))}
            </div>

            {/* Categories */}
            {CATEGORIES.map(category => (
              <div key={category.key}>
                {/* Category Header */}
                <div className="grid grid-cols-[1fr_80px_80px_80px_80px] bg-[hsl(var(--avivar-muted)/0.3)] border-b border-[hsl(var(--avivar-border))]">
                  <div className="px-4 py-2.5 flex items-center gap-2">
                    <span className="text-base">{category.icon}</span>
                    <span className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                      {category.label}
                    </span>
                  </div>
                  {ACTIONS.map(action => {
                    const allChecked = isCategoryAllChecked(category, action.key);
                    const someChecked = isCategorySomeChecked(category, action.key);
                    return (
                      <div key={action.key} className="flex items-center justify-center px-2 py-2.5">
                        <Checkbox
                          checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                          onCheckedChange={() => toggleCategoryAll(category, action.key)}
                          className={cn("h-4 w-4", action.checkColor)}
                          disabled={selectedRole === 'admin'}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Items */}
                {category.items.map((item, idx) => (
                  <div
                    key={item.key}
                    className={cn(
                      "grid grid-cols-[1fr_80px_80px_80px_80px] border-b border-[hsl(var(--avivar-border)/0.5)]",
                      idx % 2 === 0 ? "bg-transparent" : "bg-[hsl(var(--avivar-muted)/0.1)]"
                    )}
                  >
                    <div className="px-4 py-2.5 pl-10 text-sm text-[hsl(var(--avivar-foreground))]">
                      {item.label}
                    </div>
                    {ACTIONS.map(action => (
                      <div key={action.key} className="flex items-center justify-center px-2 py-2.5">
                        <Checkbox
                          checked={rolePerms[item.key]?.[action.key] ?? false}
                          onCheckedChange={() => togglePermission(item.key, action.key)}
                          className={cn("h-4 w-4", action.checkColor)}
                          disabled={selectedRole === 'admin'}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[hsl(var(--avivar-muted-foreground))]">
        <span className="font-medium">Legenda:</span>
        {ACTIONS.map(action => (
          <div key={action.key} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-sm", action.headerBg)} />
            <span>{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
