import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Trash2,
  Search,
  Filter,
  Info
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
  medico: <Users className="h-4 w-4" />,
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

const ALL_PROFILES: NeoHubProfile[] = ['administrador', 'licenciado', 'colaborador', 'medico', 'aluno', 'paciente', 'cliente_avivar', 'ipromed'];
const ALL_PORTALS: Portal[] = ['neocare', 'neoteam', 'academy', 'neolicense', 'avivar', 'ipromed'];

interface ModuleRow {
  code: string;
  name: string;
  portal: Portal;
}

export function AccessMatrixTable({
  permissions,
  isLoading,
  onUpdatePermission,
  getPermissionForModule,
}: AccessMatrixTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPortal, setSelectedPortal] = useState<Portal | 'all'>('all');
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);

  // Get all modules from all portals
  const allModules = useMemo<ModuleRow[]>(() => {
    const modules: ModuleRow[] = [];
    ALL_PORTALS.forEach(portal => {
      const portalModules = PORTAL_MODULES[portal] || [];
      portalModules.forEach(mod => {
        modules.push({
          code: mod.code,
          name: mod.name,
          portal,
        });
      });
    });
    return modules;
  }, []);

  // Filter modules
  const filteredModules = useMemo(() => {
    return allModules.filter(mod => {
      const matchesSearch = mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mod.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPortal = selectedPortal === 'all' || mod.portal === selectedPortal;
      return matchesSearch && matchesPortal;
    });
  }, [allModules, searchTerm, selectedPortal]);

  const handlePermissionChange = async (
    moduleCode: string,
    profile: NeoHubProfile,
    field: 'canRead' | 'canWrite' | 'canDelete',
    value: boolean
  ) => {
    // Admin always has full access
    if (profile === 'administrador') {
      toast.info("O perfil Administrador possui acesso total e não pode ser alterado.");
      return;
    }

    const cellKey = `${moduleCode}-${profile}-${field}`;
    setUpdatingCell(cellKey);

    try {
      const currentPerm = getPermissionForModule(moduleCode, profile);
      
      // If disabling read, also disable write and delete
      if (field === 'canRead' && !value) {
        await onUpdatePermission(moduleCode, profile, {
          canRead: false,
          canWrite: false,
          canDelete: false,
        });
      } 
      // If enabling write or delete, also enable read
      else if ((field === 'canWrite' || field === 'canDelete') && value) {
        await onUpdatePermission(moduleCode, profile, {
          canRead: true,
          [field]: value,
        });
      }
      else {
        await onUpdatePermission(moduleCode, profile, { [field]: value });
      }
    } finally {
      setUpdatingCell(null);
    }
  };

  const getCheckboxState = (moduleCode: string, profile: NeoHubProfile, field: 'canRead' | 'canWrite' | 'canDelete') => {
    // Admin always has full access
    if (profile === 'administrador') {
      return { checked: true, disabled: true };
    }

    const perm = getPermissionForModule(moduleCode, profile);
    const isUpdating = updatingCell === `${moduleCode}-${profile}-${field}`;
    
    // Write and delete require read to be enabled
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
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
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
              Controle os acessos de cada perfil por módulo do sistema
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar módulo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-48"
              />
            </div>
            
            <Select value={selectedPortal} onValueChange={(v) => setSelectedPortal(v as Portal | 'all')}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Portal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Portais</SelectItem>
                {ALL_PORTALS.map(portal => (
                  <SelectItem key={portal} value={portal}>
                    {PORTAL_NAMES[portal]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-64 sticky left-0 bg-muted/50 z-10">
                    Módulo / Função
                  </TableHead>
                  {ALL_PROFILES.map(profile => (
                    <TableHead key={profile} className="text-center min-w-[140px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                              PROFILE_COLORS[profile]
                            )}>
                              {PROFILE_ICONS[profile]}
                              <span className="truncate max-w-[80px]">
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
                {filteredModules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={ALL_PROFILES.length + 1} className="text-center py-8 text-muted-foreground">
                      Nenhum módulo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredModules.map((mod, idx) => (
                    <TableRow 
                      key={mod.code}
                      className={cn(idx % 2 === 0 ? "bg-background" : "bg-muted/30")}
                    >
                      <TableCell className="sticky left-0 bg-inherit z-10">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">{mod.name}</span>
                          <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0">
                            {PORTAL_NAMES[mod.portal]}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      {ALL_PROFILES.map(profile => {
                        const readState = getCheckboxState(mod.code, profile, 'canRead');
                        const writeState = getCheckboxState(mod.code, profile, 'canWrite');
                        const deleteState = getCheckboxState(mod.code, profile, 'canDelete');
                        
                        return (
                          <TableCell key={profile} className="text-center px-2">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Visualizar (Read) */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => !readState.disabled && handlePermissionChange(mod.code, profile, 'canRead', !readState.checked)}
                                      disabled={readState.disabled}
                                      className={cn(
                                        "w-7 h-7 rounded-md flex items-center justify-center transition-all",
                                        readState.checked 
                                          ? "bg-emerald-500 text-white shadow-sm" 
                                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                                        readState.disabled && "opacity-50 cursor-not-allowed"
                                      )}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Visualizar</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Editar/Inserir (Write) */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => !writeState.disabled && handlePermissionChange(mod.code, profile, 'canWrite', !writeState.checked)}
                                      disabled={writeState.disabled}
                                      className={cn(
                                        "w-7 h-7 rounded-md flex items-center justify-center transition-all",
                                        writeState.checked 
                                          ? "bg-emerald-500 text-white shadow-sm" 
                                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                                        writeState.disabled && "opacity-50 cursor-not-allowed"
                                      )}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar / Inserir</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Excluir (Delete) */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => !deleteState.disabled && handlePermissionChange(mod.code, profile, 'canDelete', !deleteState.checked)}
                                      disabled={deleteState.disabled}
                                      className={cn(
                                        "w-7 h-7 rounded-md flex items-center justify-center transition-all",
                                        deleteState.checked 
                                          ? "bg-emerald-500 text-white shadow-sm" 
                                          : "bg-muted/50 text-muted-foreground hover:bg-muted",
                                        deleteState.disabled && "opacity-50 cursor-not-allowed"
                                      )}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
        
        {/* Info Footer */}
        <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-400">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            As permissões de Editar e Excluir dependem da permissão de Visualizar estar ativa.
            O perfil Administrador possui acesso total e não pode ser modificado.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
