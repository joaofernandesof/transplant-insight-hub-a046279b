/**
 * PermissionsMatrix - Matriz de Permissões por Função
 * Permite configurar permissões de criar, editar, excluir para cada função
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  Plus, 
  Trash2, 
  Edit,
  Check,
  X,
  Save,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Permission = 'create' | 'edit' | 'delete' | 'view';

interface RolePermission {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: {
    leads: Permission[];
    chats: Permission[];
    agenda: Permission[];
    config: Permission[];
    team: Permission[];
    reports: Permission[];
  };
  isDefault: boolean;
}

const DEFAULT_ROLES: RolePermission[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso total ao sistema',
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    permissions: {
      leads: ['create', 'edit', 'delete', 'view'],
      chats: ['create', 'edit', 'delete', 'view'],
      agenda: ['create', 'edit', 'delete', 'view'],
      config: ['create', 'edit', 'delete', 'view'],
      team: ['create', 'edit', 'delete', 'view'],
      reports: ['view'],
    },
    isDefault: true,
  },
  {
    id: 'gestor',
    name: 'Gestor',
    description: 'Gerencia equipe e operações',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    permissions: {
      leads: ['create', 'edit', 'delete', 'view'],
      chats: ['create', 'edit', 'delete', 'view'],
      agenda: ['create', 'edit', 'delete', 'view'],
      config: ['view'],
      team: ['create', 'edit', 'view'],
      reports: ['view'],
    },
    isDefault: true,
  },
  {
    id: 'sdr',
    name: 'SDR',
    description: 'Prospecção e qualificação de leads',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    permissions: {
      leads: ['create', 'edit', 'view'],
      chats: ['create', 'edit', 'view'],
      agenda: ['create', 'edit', 'view'],
      config: [],
      team: ['view'],
      reports: ['view'],
    },
    isDefault: true,
  },
  {
    id: 'atendente',
    name: 'Atendente',
    description: 'Atendimento e suporte',
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
    permissions: {
      leads: ['edit', 'view'],
      chats: ['create', 'edit', 'view'],
      agenda: ['view'],
      config: [],
      team: [],
      reports: [],
    },
    isDefault: true,
  },
];

const MODULES = [
  { key: 'leads', label: 'Leads/Funis', description: 'Gestão de leads e funis de venda' },
  { key: 'chats', label: 'Chats', description: 'Conversas e atendimento' },
  { key: 'agenda', label: 'Agenda', description: 'Agendamentos e compromissos' },
  { key: 'config', label: 'Configurações IA', description: 'Configuração de agentes e automação' },
  { key: 'team', label: 'Equipe', description: 'Gestão de atendentes' },
  { key: 'reports', label: 'Relatórios', description: 'Dashboards e métricas' },
];

const PERMISSIONS: { key: Permission; label: string; icon: React.ReactNode }[] = [
  { key: 'view', label: 'Visualizar', icon: '👁️' },
  { key: 'create', label: 'Criar', icon: '➕' },
  { key: 'edit', label: 'Editar', icon: '✏️' },
  { key: 'delete', label: 'Excluir', icon: '🗑️' },
];

export default function PermissionsMatrix() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RolePermission[]>(DEFAULT_ROLES);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const togglePermission = (roleId: string, moduleKey: string, permission: Permission) => {
    setRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role;
      
      const modulePermissions = role.permissions[moduleKey as keyof typeof role.permissions] || [];
      const hasPermission = modulePermissions.includes(permission);
      
      return {
        ...role,
        permissions: {
          ...role.permissions,
          [moduleKey]: hasPermission
            ? modulePermissions.filter(p => p !== permission)
            : [...modulePermissions, permission],
        },
      };
    }));
    setHasChanges(true);
  };

  const hasPermission = (role: RolePermission, moduleKey: string, permission: Permission) => {
    const permissions = role.permissions[moduleKey as keyof typeof role.permissions] || [];
    return permissions.includes(permission);
  };

  const addRole = () => {
    if (!newRoleName.trim()) {
      toast.error('Nome da função é obrigatório');
      return;
    }

    const newRole: RolePermission = {
      id: newRoleName.toLowerCase().replace(/\s+/g, '_'),
      name: newRoleName,
      description: newRoleDescription || 'Função personalizada',
      color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      permissions: {
        leads: ['view'],
        chats: ['view'],
        agenda: ['view'],
        config: [],
        team: [],
        reports: [],
      },
      isDefault: false,
    };

    setRoles([...roles, newRole]);
    setIsAddRoleOpen(false);
    setNewRoleName('');
    setNewRoleDescription('');
    setHasChanges(true);
    toast.success('Função criada!');
  };

  const deleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isDefault) {
      toast.error('Funções padrão não podem ser excluídas');
      return;
    }
    setRoles(roles.filter(r => r.id !== roleId));
    setHasChanges(true);
    toast.success('Função removida!');
  };

  const saveChanges = () => {
    // TODO: Save to database
    toast.success('Permissões salvas com sucesso!');
    setHasChanges(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/avivar/team')}
            className="hover:bg-[hsl(var(--avivar-primary)/0.1)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Shield className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
              Matriz de Permissões
            </h1>
            <p className="text-[hsl(var(--avivar-muted-foreground))]">
              Configure as permissões de cada função no sistema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsAddRoleOpen(true)}
            className="border-[hsl(var(--avivar-border))]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Função
          </Button>
          {hasChanges && (
            <Button
              onClick={saveChanges}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.2)]">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-[hsl(var(--avivar-primary))] mt-0.5" />
          <div>
            <p className="text-sm text-[hsl(var(--avivar-foreground))] font-medium">
              Como funciona a Matriz de Permissões
            </p>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              Marque as permissões que cada função pode ter. Funções padrão vêm pré-configuradas, 
              mas você pode personalizar ou criar novas funções para sua equipe.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] overflow-hidden">
        <CardHeader className="border-b border-[hsl(var(--avivar-border))]">
          <CardTitle className="text-lg">Permissões por Função</CardTitle>
          <CardDescription>
            Clique nas células para ativar ou desativar permissões
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-[hsl(var(--avivar-border))]">
                  <TableHead className="w-[200px] font-semibold">Módulo</TableHead>
                  {roles.map(role => (
                    <TableHead key={role.id} className="text-center min-w-[150px]">
                      <div className="flex flex-col items-center gap-1">
                        <Badge className={cn("border", role.color)}>
                          {role.name}
                        </Badge>
                        <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] font-normal">
                          {role.description}
                        </span>
                        {!role.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-600"
                            onClick={() => deleteRole(role.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODULES.map(module => (
                  <TableRow key={module.key} className="border-b border-[hsl(var(--avivar-border))]">
                    <TableCell className="font-medium">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{module.label}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{module.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    {roles.map(role => (
                      <TableCell key={role.id} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {PERMISSIONS.map(perm => (
                            <TooltipProvider key={perm.key}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => togglePermission(role.id, module.key, perm.key)}
                                    className={cn(
                                      "w-7 h-7 rounded flex items-center justify-center text-xs transition-all",
                                      hasPermission(role, module.key, perm.key)
                                        ? "bg-[hsl(var(--avivar-primary))] text-white"
                                        : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.2)]"
                                    )}
                                  >
                                    {perm.key[0].toUpperCase()}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{perm.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-[hsl(var(--avivar-muted-foreground))]">
        <span className="font-medium">Legenda:</span>
        {PERMISSIONS.map(perm => (
          <div key={perm.key} className="flex items-center gap-1">
            <span className="w-5 h-5 rounded bg-[hsl(var(--avivar-muted))] flex items-center justify-center text-xs font-medium">
              {perm.key[0].toUpperCase()}
            </span>
            <span>{perm.label}</span>
          </div>
        ))}
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <DialogHeader>
            <DialogTitle>Nova Função</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Função</label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Ex: Supervisor"
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Ex: Supervisão de atendimentos"
                className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={addRole}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
            >
              Criar Função
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
