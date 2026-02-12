import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Building2, 
  Users, 
  GraduationCap, 
  Heart, 
  TrendingUp,
  Eye,
  Scale,
  Pencil,
  Trash2,
  Search,
  Info,
  ChevronDown,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { NeoHubProfile, Portal, PORTAL_NAMES, PROFILE_NAMES, PORTAL_MODULES } from "@/neohub/lib/permissions";
import { ModulePermission } from "@/hooks/useAccessMatrix";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AccessMatrixTableProps {
  permissions: ModulePermission[];
  isLoading: boolean;
  onUpdatePermission: (
    moduleCode: string,
    profile: NeoHubProfile,
    updates: Partial<Pick<ModulePermission, 'canRead' | 'canWrite' | 'canDelete'>>
  ) => Promise<void>;
  getPermissionForModule: (moduleCode: string, profile: NeoHubProfile) => ModulePermission | undefined;
}

const PROFILE_ICONS: Record<NeoHubProfile, React.ReactNode> = {
  administrador: <Shield className="h-4 w-4" />,
  licenciado: <Building2 className="h-4 w-4" />,
  colaborador: <Users className="h-4 w-4" />,
  medico: <Stethoscope className="h-4 w-4" />,
  aluno: <GraduationCap className="h-4 w-4" />,
  paciente: <Heart className="h-4 w-4" />,
  cliente_avivar: <TrendingUp className="h-4 w-4" />,
  ipromed: <Scale className="h-4 w-4" />,
};

const PROFILE_COLORS: Record<NeoHubProfile, string> = {
  administrador: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  licenciado: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  colaborador: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  medico: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  aluno: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  paciente: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400',
  cliente_avivar: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  ipromed: 'bg-[#00629B]/10 text-[#00629B] dark:bg-[#00629B]/20 dark:text-[#00629B]',
};

const PORTAL_ROW_COLORS: Record<Portal, string> = {
  neocare: 'bg-rose-50/60 dark:bg-rose-950/20',
  neoteam: 'bg-blue-50/60 dark:bg-blue-950/20',
  academy: 'bg-emerald-50/60 dark:bg-emerald-950/20',
  neolicense: 'bg-amber-50/60 dark:bg-amber-950/20',
  avivar: 'bg-orange-50/60 dark:bg-orange-950/20',
  ipromed: 'bg-[#00629B]/5 dark:bg-[#00629B]/10',
  hotleads: 'bg-orange-50/60 dark:bg-orange-950/20',
  vision: 'bg-violet-50/60 dark:bg-violet-950/20',
  neopay: 'bg-teal-50/60 dark:bg-teal-950/20',
};

const PORTAL_ACCENT: Record<Portal, string> = {
  neocare: 'border-l-rose-500',
  neoteam: 'border-l-blue-500',
  academy: 'border-l-emerald-500',
  neolicense: 'border-l-amber-500',
  avivar: 'border-l-orange-500',
  ipromed: 'border-l-[#00629B]',
  hotleads: 'border-l-orange-600',
  vision: 'border-l-violet-500',
  neopay: 'border-l-teal-500',
};

const ALL_PROFILES: NeoHubProfile[] = ['administrador', 'licenciado', 'colaborador', 'medico', 'aluno', 'paciente', 'cliente_avivar', 'ipromed'];
const ALL_PORTALS: Portal[] = ['neocare', 'neoteam', 'academy', 'neolicense', 'avivar', 'ipromed', 'vision', 'neopay'];

export function AccessMatrixTable({
  permissions,
  isLoading,
  onUpdatePermission,
  getPermissionForModule,
}: AccessMatrixTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);
  const [expandedPortals, setExpandedPortals] = useState<Set<Portal>>(new Set());

  const togglePortal = (portal: Portal) => {
    setExpandedPortals(prev => {
      const next = new Set(prev);
      if (next.has(portal)) next.delete(portal);
      else next.add(portal);
      return next;
    });
  };

  const expandAll = () => setExpandedPortals(new Set(ALL_PORTALS));
  const collapseAll = () => setExpandedPortals(new Set());

  // Filter portals/modules by search
  const filteredPortals = useMemo(() => {
    if (!searchTerm) return ALL_PORTALS;
    return ALL_PORTALS.filter(portal => {
      const portalName = PORTAL_NAMES[portal].toLowerCase();
      const modules = PORTAL_MODULES[portal] || [];
      const matchesPortal = portalName.includes(searchTerm.toLowerCase());
      const matchesModule = modules.some(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchesPortal || matchesModule;
    });
  }, [searchTerm]);

  const getFilteredModules = (portal: Portal) => {
    const modules = PORTAL_MODULES[portal] || [];
    if (!searchTerm) return modules;
    const portalMatches = PORTAL_NAMES[portal].toLowerCase().includes(searchTerm.toLowerCase());
    if (portalMatches) return modules;
    return modules.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get portal-level summary for a profile
  const getPortalSummary = (portal: Portal, profile: NeoHubProfile) => {
    const modules = PORTAL_MODULES[portal] || [];
    let readCount = 0, writeCount = 0, deleteCount = 0;
    modules.forEach(mod => {
      const perm = getPermissionForModule(mod.code, profile);
      if (profile === 'administrador' || perm?.canRead) readCount++;
      if (profile === 'administrador' || perm?.canWrite) writeCount++;
      if (profile === 'administrador' || perm?.canDelete) deleteCount++;
    });
    return { readCount, writeCount, deleteCount, total: modules.length };
  };

  const handlePermissionChange = async (
    moduleCode: string,
    profile: NeoHubProfile,
    field: 'canRead' | 'canWrite' | 'canDelete',
    value: boolean
  ) => {
    if (profile === 'administrador') {
      toast.info("O perfil Administrador possui acesso total e não pode ser alterado.");
      return;
    }

    const cellKey = `${moduleCode}-${profile}-${field}`;
    setUpdatingCell(cellKey);

    try {
      if (field === 'canRead' && !value) {
        await onUpdatePermission(moduleCode, profile, {
          canRead: false, canWrite: false, canDelete: false,
        });
      } else if ((field === 'canWrite' || field === 'canDelete') && value) {
        await onUpdatePermission(moduleCode, profile, {
          canRead: true, [field]: value,
        });
      } else {
        await onUpdatePermission(moduleCode, profile, { [field]: value });
      }
    } finally {
      setUpdatingCell(null);
    }
  };

  const getCheckboxState = (moduleCode: string, profile: NeoHubProfile, field: 'canRead' | 'canWrite' | 'canDelete') => {
    if (profile === 'administrador') return { checked: true, disabled: true };
    const perm = getPermissionForModule(moduleCode, profile);
    const isUpdating = updatingCell === `${moduleCode}-${profile}-${field}`;
    const requiresRead = field === 'canWrite' || field === 'canDelete';
    const readEnabled = perm?.canRead ?? false;
    return {
      checked: perm?.[field] ?? false,
      disabled: isUpdating || (requiresRead && !readEnabled),
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
              Portais nas linhas · Perfis de usuários nas colunas
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
        <ScrollArea className="w-full">
          <div className="min-w-[1000px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-72 sticky left-0 bg-muted/50 z-10 font-semibold">
                    Portais / Módulos
                  </TableHead>
                  {ALL_PROFILES.map(profile => (
                    <TableHead key={profile} className="text-center min-w-[120px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                              PROFILE_COLORS[profile]
                            )}>
                              {PROFILE_ICONS[profile]}
                              <span className="truncate max-w-[70px]">
                                {PROFILE_NAMES[profile]}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {PROFILE_NAMES[profile]}
                            {profile === 'administrador' && (
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
                    <TableCell colSpan={ALL_PROFILES.length + 1} className="text-center py-8 text-muted-foreground">
                      Nenhum portal encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPortals.map(portal => {
                    const isExpanded = expandedPortals.has(portal);
                    const modules = getFilteredModules(portal);
                    
                    return (
                      <PortalGroup
                        key={portal}
                        portal={portal}
                        isExpanded={isExpanded}
                        onToggle={() => togglePortal(portal)}
                        modules={modules}
                        profiles={ALL_PROFILES}
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
        </ScrollArea>
        
        {/* Info Footer */}
        <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-400">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            Clique no portal para expandir e ver os módulos individuais.
            O perfil Administrador possui acesso total e não pode ser modificado.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Portal Group (row header + expandable modules) ----

interface PortalGroupProps {
  portal: Portal;
  isExpanded: boolean;
  onToggle: () => void;
  modules: { code: string; name: string; route: string; icon: string }[];
  profiles: NeoHubProfile[];
  getPortalSummary: (portal: Portal, profile: NeoHubProfile) => { readCount: number; writeCount: number; deleteCount: number; total: number };
  getCheckboxState: (moduleCode: string, profile: NeoHubProfile, field: 'canRead' | 'canWrite' | 'canDelete') => { checked: boolean; disabled: boolean };
  handlePermissionChange: (moduleCode: string, profile: NeoHubProfile, field: 'canRead' | 'canWrite' | 'canDelete', value: boolean) => void;
}

function PortalGroup({
  portal,
  isExpanded,
  onToggle,
  modules,
  profiles,
  getPortalSummary,
  getCheckboxState,
  handlePermissionChange,
}: PortalGroupProps) {
  return (
    <>
      {/* Portal Header Row */}
      <TableRow 
        className={cn(
          "cursor-pointer hover:bg-muted/60 transition-colors border-l-4",
          PORTAL_ROW_COLORS[portal],
          PORTAL_ACCENT[portal],
        )}
        onClick={onToggle}
      >
        <TableCell className="sticky left-0 z-10 bg-inherit">
          <div className="flex items-center gap-2">
            {isExpanded 
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> 
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
            <span className="font-semibold text-sm">{PORTAL_NAMES[portal]}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-1">
              {modules.length} módulos
            </Badge>
          </div>
        </TableCell>
        
        {profiles.map(profile => {
          const summary = getPortalSummary(portal, profile);
          const allRead = summary.readCount === summary.total;
          const noneRead = summary.readCount === 0;
          
          return (
            <TableCell key={profile} className="text-center px-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-2 py-0.5",
                          allRead && "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
                          noneRead && "bg-muted text-muted-foreground",
                          !allRead && !noneRead && "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
                        )}
                      >
                        {summary.readCount}/{summary.total}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p className="font-medium">{PROFILE_NAMES[profile]} → {PORTAL_NAMES[portal]}</p>
                      <p>👁 Visualizar: {summary.readCount}/{summary.total}</p>
                      <p>✏️ Editar: {summary.writeCount}/{summary.total}</p>
                      <p>🗑 Excluir: {summary.deleteCount}/{summary.total}</p>
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
          key={mod.code}
          className={cn(
            "border-l-4",
            PORTAL_ACCENT[portal],
            idx % 2 === 0 ? "bg-background" : "bg-muted/20"
          )}
        >
          <TableCell className="sticky left-0 bg-inherit z-10 pl-10">
            <span className="text-sm text-muted-foreground">{mod.name}</span>
          </TableCell>
          
          {profiles.map(profile => {
            const readState = getCheckboxState(mod.code, profile, 'canRead');
            const writeState = getCheckboxState(mod.code, profile, 'canWrite');
            const deleteState = getCheckboxState(mod.code, profile, 'canDelete');
            
            return (
              <TableCell key={profile} className="text-center px-2">
                <div className="flex items-center justify-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !readState.disabled && handlePermissionChange(mod.code, profile, 'canRead', !readState.checked)}
                          disabled={readState.disabled}
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center transition-all",
                            readState.checked 
                              ? "bg-emerald-500 text-white shadow-sm" 
                              : "bg-muted/50 text-muted-foreground hover:bg-muted",
                            readState.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Visualizar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !writeState.disabled && handlePermissionChange(mod.code, profile, 'canWrite', !writeState.checked)}
                          disabled={writeState.disabled}
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center transition-all",
                            writeState.checked 
                              ? "bg-emerald-500 text-white shadow-sm" 
                              : "bg-muted/50 text-muted-foreground hover:bg-muted",
                            writeState.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Editar / Inserir</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => !deleteState.disabled && handlePermissionChange(mod.code, profile, 'canDelete', !deleteState.checked)}
                          disabled={deleteState.disabled}
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center transition-all",
                            deleteState.checked 
                              ? "bg-emerald-500 text-white shadow-sm" 
                              : "bg-muted/50 text-muted-foreground hover:bg-muted",
                            deleteState.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Trash2 className="h-3 w-3" />
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
