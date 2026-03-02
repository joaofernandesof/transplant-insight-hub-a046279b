import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Shield, 
  Eye,
  Plus,
  Pencil,
  Trash2,
  Search,
  Info,
  ChevronDown,
  ChevronRight,
  Crown,
  UserCog,
  UserCheck,
  Users,
  UserMinus,
  EyeOff,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { RbacRole, RbacPortal, RbacModule, RbacPermission, PermissionField } from "@/hooks/useAccessMatrix";

interface AccessMatrixTableProps {
  roles: RbacRole[];
  portals: RbacPortal[];
  modulesByPortal: Record<string, RbacModule[]>;
  isLoading: boolean;
  getPermission: (roleId: string, moduleId: string) => RbacPermission | undefined;
  updatePermission: (roleId: string, moduleId: string, updates: Partial<Pick<RbacPermission, PermissionField>>) => Promise<void>;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  super_administrador: <Crown className="h-3.5 w-3.5" />,
  administrador: <Shield className="h-3.5 w-3.5" />,
  gerente: <UserCog className="h-3.5 w-3.5" />,
  coordenador: <UserCheck className="h-3.5 w-3.5" />,
  supervisor: <Users className="h-3.5 w-3.5" />,
  operador: <UserMinus className="h-3.5 w-3.5" />,
  visualizador: <EyeOff className="h-3.5 w-3.5" />,
  externo: <UserX className="h-3.5 w-3.5" />,
};

const ROLE_COLORS: Record<string, string> = {
  super_administrador: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  administrador: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  gerente: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  coordenador: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  supervisor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  operador: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  visualizador: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
  externo: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300',
};

const PORTAL_ROW_COLORS: Record<string, string> = {
  admin: 'bg-slate-50/60 dark:bg-slate-900/20',
  neoteam: 'bg-blue-50/60 dark:bg-blue-900/20',
  neocare: 'bg-rose-50/60 dark:bg-rose-900/20',
  academy: 'bg-emerald-50/60 dark:bg-emerald-900/20',
  neolicense: 'bg-amber-50/60 dark:bg-amber-900/20',
  avivar: 'bg-orange-50/60 dark:bg-orange-900/20',
  ipromed: 'bg-sky-50/60 dark:bg-sky-900/20',
  neorh: 'bg-indigo-50/60 dark:bg-indigo-900/20',
  neopay: 'bg-teal-50/60 dark:bg-teal-900/20',
  hotleads: 'bg-orange-50/60 dark:bg-orange-900/20',
  neohair: 'bg-pink-50/60 dark:bg-pink-900/20',
  vision: 'bg-violet-50/60 dark:bg-violet-900/20',
};

const PORTAL_ACCENT: Record<string, string> = {
  admin: 'border-l-slate-500',
  neoteam: 'border-l-blue-500',
  neocare: 'border-l-rose-500',
  academy: 'border-l-emerald-500',
  neolicense: 'border-l-amber-500',
  avivar: 'border-l-orange-500',
  ipromed: 'border-l-sky-500',
  neorh: 'border-l-indigo-500',
  neopay: 'border-l-teal-500',
  hotleads: 'border-l-orange-600',
  neohair: 'border-l-pink-500',
  vision: 'border-l-violet-500',
};

export function AccessMatrixTable({
  roles,
  portals,
  modulesByPortal,
  isLoading,
  getPermission,
  updatePermission,
}: AccessMatrixTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);
  const [expandedPortals, setExpandedPortals] = useState<Set<string>>(new Set());

  const togglePortal = (portalId: string) => {
    setExpandedPortals(prev => {
      const next = new Set(prev);
      if (next.has(portalId)) next.delete(portalId);
      else next.add(portalId);
      return next;
    });
  };

  const expandAll = () => setExpandedPortals(new Set(portals.map(p => p.id)));
  const collapseAll = () => setExpandedPortals(new Set());

  // Filter portals/modules by search
  const filteredPortals = useMemo(() => {
    if (!searchTerm) return portals;
    const term = searchTerm.toLowerCase();
    return portals.filter(portal => {
      const matchesPortal = portal.name.toLowerCase().includes(term);
      const mods = modulesByPortal[portal.id] || [];
      const matchesModule = mods.some(m =>
        m.name.toLowerCase().includes(term) || m.code.toLowerCase().includes(term)
      );
      return matchesPortal || matchesModule;
    });
  }, [searchTerm, portals, modulesByPortal]);

  const getFilteredModules = (portalId: string) => {
    const mods = modulesByPortal[portalId] || [];
    if (!searchTerm) return mods;
    const portal = portals.find(p => p.id === portalId);
    if (portal?.name.toLowerCase().includes(searchTerm.toLowerCase())) return mods;
    return mods.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get portal-level summary for a role
  const getPortalSummary = (portalId: string, role: RbacRole) => {
    const mods = modulesByPortal[portalId] || [];
    const isSA = role.name === 'super_administrador';
    let viewCount = 0;
    for (const mod of mods) {
      if (isSA || getPermission(role.id, mod.id)?.canView) viewCount++;
    }
    return { viewCount, total: mods.length };
  };

  const handlePermissionChange = async (
    roleId: string,
    moduleId: string,
    field: PermissionField,
    value: boolean
  ) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.name === 'super_administrador') {
      toast.info("Super Administrador possui acesso total e não pode ser alterado.");
      return;
    }

    const cellKey = `${moduleId}-${roleId}-${field}`;
    setUpdatingCell(cellKey);

    try {
      if (field === 'canView' && !value) {
        // Disabling view disables everything
        await updatePermission(roleId, moduleId, {
          canView: false, canCreate: false, canEdit: false, canDelete: false,
        });
      } else if (field !== 'canView' && value) {
        // Enabling any other field requires view
        await updatePermission(roleId, moduleId, {
          canView: true, [field]: value,
        });
      } else {
        await updatePermission(roleId, moduleId, { [field]: value });
      }
    } finally {
      setUpdatingCell(null);
    }
  };

  const getCheckboxState = (roleId: string, moduleId: string, field: PermissionField) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.name === 'super_administrador') return { checked: true, disabled: true };
    const perm = getPermission(roleId, moduleId);
    const isUpdating = updatingCell === `${moduleId}-${roleId}-${field}`;
    const requiresView = field !== 'canView';
    const viewEnabled = perm?.canView ?? false;
    return {
      checked: perm?.[field] ?? false,
      disabled: isUpdating || (requiresView && !viewEnabled),
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-64" /></CardHeader>
        <CardContent><Skeleton className="h-96 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Matriz de Permissões</CardTitle>
            <CardDescription>
              Portais nas linhas · Funções nas colunas · Ações por módulo
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar portal ou módulo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <button onClick={expandAll} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">
              Expandir tudo
            </button>
            <button onClick={collapseAll} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">
              Recolher
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 p-3 bg-muted/50 rounded-lg text-sm">
          <span className="font-medium text-muted-foreground">Legenda:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center">
              <Eye className="h-2.5 w-2.5 text-white" />
            </div>
            <span>Visualizar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center">
              <Plus className="h-2.5 w-2.5 text-white" />
            </div>
            <span>Criar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center">
              <Pencil className="h-2.5 w-2.5 text-white" />
            </div>
            <span>Editar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center">
              <Trash2 className="h-2.5 w-2.5 text-white" />
            </div>
            <span>Excluir</span>
          </div>
          <div className="flex items-center gap-1.5 ml-4 pl-4 border-l">
            <div className="w-4 h-4 rounded border-2 border-muted-foreground/30" />
            <span className="text-muted-foreground">Inativo</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 dark:bg-slate-800/60">
                  <TableHead className="w-72 sticky left-0 bg-slate-100 dark:bg-slate-800/60 z-10 font-semibold">
                    Portais / Módulos
                  </TableHead>
                  {roles.map(role => (
                    <TableHead key={role.id} className="text-center min-w-[110px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium",
                              ROLE_COLORS[role.name] || 'bg-muted text-muted-foreground'
                            )}>
                              {ROLE_ICONS[role.name] || <Users className="h-3.5 w-3.5" />}
                              <span className="truncate max-w-[70px]">
                                {role.displayName}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {role.displayName}
                            {role.name === 'super_administrador' && (
                              <span className="block text-xs text-muted-foreground">
                                Acesso total (não editável)
                              </span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {filteredPortals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={roles.length + 1} className="text-center py-8 text-muted-foreground">
                      Nenhum portal encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPortals.map(portal => {
                    const isExpanded = expandedPortals.has(portal.id);
                    const modules = getFilteredModules(portal.id);
                    
                    return (
                      <PortalGroup
                        key={portal.id}
                        portal={portal}
                        isExpanded={isExpanded}
                        onToggle={() => togglePortal(portal.id)}
                        modules={modules}
                        roles={roles}
                        getPortalSummary={getPortalSummary}
                        getCheckboxState={getCheckboxState}
                        handlePermissionChange={handlePermissionChange}
                      />
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Info Footer */}
        <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            Clique no portal para expandir e ver os módulos individuais.
            O perfil Super Administrador possui acesso total e não pode ser modificado.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Portal Group ----

interface PortalGroupProps {
  portal: RbacPortal;
  isExpanded: boolean;
  onToggle: () => void;
  modules: RbacModule[];
  roles: RbacRole[];
  getPortalSummary: (portalId: string, role: RbacRole) => { viewCount: number; total: number };
  getCheckboxState: (roleId: string, moduleId: string, field: PermissionField) => { checked: boolean; disabled: boolean };
  handlePermissionChange: (roleId: string, moduleId: string, field: PermissionField, value: boolean) => void;
}

function PortalGroup({
  portal,
  isExpanded,
  onToggle,
  modules,
  roles,
  getPortalSummary,
  getCheckboxState,
  handlePermissionChange,
}: PortalGroupProps) {
  const rowColor = PORTAL_ROW_COLORS[portal.slug] || 'bg-muted/20';
  const accent = PORTAL_ACCENT[portal.slug] || 'border-l-muted';

  return (
    <>
      {/* Portal Header Row */}
      <TableRow 
        className={cn("cursor-pointer hover:bg-muted/60 transition-colors border-l-4", rowColor, accent)}
        onClick={onToggle}
      >
        <TableCell className="sticky left-0 z-10 bg-inherit">
          <div className="flex items-center gap-2">
            {isExpanded 
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> 
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
            <span className="font-semibold text-sm">{portal.name}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
              {modules.length} módulos
            </Badge>
          </div>
        </TableCell>
        
        {roles.map(role => {
          const summary = getPortalSummary(portal.id, role);
          const allView = summary.viewCount === summary.total;
          const noneView = summary.viewCount === 0;
          
          return (
            <TableCell key={role.id} className="text-center px-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-2 py-0.5",
                          allView && "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700",
                          noneView && "bg-muted text-muted-foreground",
                          !allView && !noneView && "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700"
                        )}
                      >
                        {summary.viewCount}/{summary.total}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-medium">{role.displayName} → {portal.name}</p>
                      <p>👁 Visualizar: {summary.viewCount}/{summary.total}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
          );
        })}
      </TableRow>

      {/* Expanded Module Rows */}
      {isExpanded && modules.map((mod, idx) => (
        <TableRow 
          key={mod.id}
          className={cn(
            "border-l-4",
            accent,
            idx % 2 === 0 ? "bg-background" : "bg-muted/20"
          )}
        >
          <TableCell className="sticky left-0 bg-inherit z-10 pl-10">
            <span className="text-sm text-muted-foreground">{mod.name}</span>
          </TableCell>
          
          {roles.map(role => {
            const viewState = getCheckboxState(role.id, mod.id, 'canView');
            const createState = getCheckboxState(role.id, mod.id, 'canCreate');
            const editState = getCheckboxState(role.id, mod.id, 'canEdit');
            const deleteState = getCheckboxState(role.id, mod.id, 'canDelete');
            
            return (
              <TableCell key={role.id} className="text-center px-1">
                <div className="flex items-center justify-center gap-0.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !viewState.disabled && handlePermissionChange(role.id, mod.id, 'canView', !viewState.checked)}
                          disabled={viewState.disabled}
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center transition-all",
                            viewState.checked 
                              ? "bg-emerald-500 text-white shadow-sm" 
                              : "bg-muted/50 text-muted-foreground hover:bg-muted",
                            viewState.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Eye className="h-2.5 w-2.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Visualizar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !createState.disabled && handlePermissionChange(role.id, mod.id, 'canCreate', !createState.checked)}
                          disabled={createState.disabled}
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center transition-all",
                            createState.checked 
                              ? "bg-emerald-500 text-white shadow-sm" 
                              : "bg-muted/50 text-muted-foreground hover:bg-muted",
                            createState.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Criar / Incluir</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !editState.disabled && handlePermissionChange(role.id, mod.id, 'canEdit', !editState.checked)}
                          disabled={editState.disabled}
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center transition-all",
                            editState.checked 
                              ? "bg-emerald-500 text-white shadow-sm" 
                              : "bg-muted/50 text-muted-foreground hover:bg-muted",
                            editState.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !deleteState.disabled && handlePermissionChange(role.id, mod.id, 'canDelete', !deleteState.checked)}
                          disabled={deleteState.disabled}
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center transition-all",
                            deleteState.checked 
                              ? "bg-emerald-500 text-white shadow-sm" 
                              : "bg-muted/50 text-muted-foreground hover:bg-muted",
                            deleteState.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
