import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Building2, 
  Users, 
  GraduationCap, 
  Heart, 
  TrendingUp,
  Eye,
  Edit3,
  Trash2,
  Info,
  Lock,
  Check,
  AlertTriangle
} from "lucide-react";
import { NeoHubProfile, Portal, PROFILE_NAMES, PORTAL_NAMES } from "@/neohub/lib/permissions";
import { ModulePermission, ModuleInfo, BLOCK_REASONS } from "@/hooks/useAccessMatrix";
import { cn } from "@/lib/utils";

interface AccessPermissionEditorProps {
  portal: Portal;
  moduleCode: string;
  open: boolean;
  onClose: () => void;
  permissions: ModulePermission[];
  onUpdatePermission: (moduleCode: string, profile: NeoHubProfile, updates: Partial<Pick<ModulePermission, 'canRead' | 'canWrite' | 'canDelete'>>) => Promise<void>;
  getPermissionForModule: (moduleCode: string, profile: NeoHubProfile) => ModulePermission | undefined;
  getModulesByPortal: (portal: Portal) => ModuleInfo[];
}

const PROFILE_ICONS: Record<NeoHubProfile, React.ReactNode> = {
  administrador: <Shield className="h-4 w-4" />,
  licenciado: <Building2 className="h-4 w-4" />,
  colaborador: <Users className="h-4 w-4" />,
  medico: <Users className="h-4 w-4" />,
  aluno: <GraduationCap className="h-4 w-4" />,
  paciente: <Heart className="h-4 w-4" />,
  cliente_avivar: <TrendingUp className="h-4 w-4" />,
};

const PROFILE_COLORS: Record<NeoHubProfile, string> = {
  administrador: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  licenciado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  colaborador: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  medico: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  aluno: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  paciente: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  cliente_avivar: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const ALL_PROFILES: NeoHubProfile[] = ['administrador', 'licenciado', 'colaborador', 'medico', 'aluno', 'paciente', 'cliente_avivar'];

export function AccessPermissionEditor({
  portal,
  moduleCode,
  open,
  onClose,
  permissions,
  onUpdatePermission,
  getPermissionForModule,
  getModulesByPortal,
}: AccessPermissionEditorProps) {
  const [selectedModuleCode, setSelectedModuleCode] = useState(moduleCode);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const modules = getModulesByPortal(portal);
  const currentModule = modules.find(m => m.code === selectedModuleCode);

  const handlePermissionChange = async (
    profile: NeoHubProfile,
    field: 'canRead' | 'canWrite' | 'canDelete',
    value: boolean
  ) => {
    if (profile === 'administrador') return; // Admin always has full access
    
    setIsUpdating(true);
    try {
      const currentPerm = getPermissionForModule(selectedModuleCode, profile);
      
      // If disabling read, also disable write and delete
      if (field === 'canRead' && !value) {
        await onUpdatePermission(selectedModuleCode, profile, {
          canRead: false,
          canWrite: false,
          canDelete: false,
        });
      } else {
        await onUpdatePermission(selectedModuleCode, profile, { [field]: value });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getBlockReason = (profile: NeoHubProfile): string | null => {
    const perm = getPermissionForModule(selectedModuleCode, profile);
    if (perm?.canRead) return null;
    
    // Determine reason based on profile and module
    if (profile === 'paciente' && !selectedModuleCode.startsWith('neocare_')) {
      return BLOCK_REASONS.role_mismatch;
    }
    if (profile === 'aluno' && !selectedModuleCode.startsWith('academy_')) {
      return BLOCK_REASONS.role_mismatch;
    }
    if (selectedModuleCode.includes('financial') || selectedModuleCode.includes('payment')) {
      return BLOCK_REASONS.financial_sensitive;
    }
    if (selectedModuleCode.includes('medical') || selectedModuleCode.includes('history')) {
      return BLOCK_REASONS.patient_data;
    }
    
    return BLOCK_REASONS.admin_only;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#2C3E50]" />
            Editar Permissões
          </DialogTitle>
          <DialogDescription>
            Configure os acessos para os módulos do portal <Badge variant="outline">{PORTAL_NAMES[portal]}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Module Selector */}
          <div className="w-48 shrink-0">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Módulos
            </p>
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 pr-2">
                {modules.map(mod => (
                  <button
                    key={mod.code}
                    onClick={() => setSelectedModuleCode(mod.code)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedModuleCode === mod.code
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    )}
                  >
                    {mod.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Permission Grid */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h3 className="font-medium">{currentModule?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Configure quem pode acessar este módulo
              </p>
            </div>

            <ScrollArea className="h-[380px]">
              <div className="space-y-3 pr-4">
                {ALL_PROFILES.map(profile => {
                  const perm = getPermissionForModule(selectedModuleCode, profile);
                  const isAdmin = profile === 'administrador';
                  const blockReason = getBlockReason(profile);
                  
                  return (
                    <Card 
                      key={profile}
                      className={cn(
                        "transition-all",
                        perm?.canRead ? "border-[#00C853]/30" : "border-muted"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          {/* Profile Info */}
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              PROFILE_COLORS[profile]
                            )}>
                              {PROFILE_ICONS[profile]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{PROFILE_NAMES[profile]}</p>
                              {isAdmin && (
                                <p className="text-xs text-muted-foreground">
                                  Acesso total (bypass)
                                </p>
                              )}
                              {!isAdmin && blockReason && !perm?.canRead && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {blockReason}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Permissions */}
                          <div className="flex items-center gap-4">
                            <TooltipProvider>
                              {/* Read */}
                              <div className="flex flex-col items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <Checkbox
                                        id={`${profile}-read`}
                                        checked={isAdmin || perm?.canRead || false}
                                        disabled={isAdmin || isUpdating}
                                        onCheckedChange={(checked) => 
                                          handlePermissionChange(profile, 'canRead', !!checked)
                                        }
                                        className="data-[state=checked]:bg-[#00C853] data-[state=checked]:border-[#00C853]"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Visualizar dados</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Label className="text-[10px] text-muted-foreground">
                                  <Eye className="h-3 w-3" />
                                </Label>
                              </div>

                              {/* Write */}
                              <div className="flex flex-col items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <Checkbox
                                        id={`${profile}-write`}
                                        checked={isAdmin || perm?.canWrite || false}
                                        disabled={isAdmin || isUpdating || !perm?.canRead}
                                        onCheckedChange={(checked) => 
                                          handlePermissionChange(profile, 'canWrite', !!checked)
                                        }
                                        className="data-[state=checked]:bg-[#00C853] data-[state=checked]:border-[#00C853]"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Criar e editar dados</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Label className="text-[10px] text-muted-foreground">
                                  <Edit3 className="h-3 w-3" />
                                </Label>
                              </div>

                              {/* Delete */}
                              <div className="flex flex-col items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <Checkbox
                                        id={`${profile}-delete`}
                                        checked={isAdmin || perm?.canDelete || false}
                                        disabled={isAdmin || isUpdating || !perm?.canRead}
                                        onCheckedChange={(checked) => 
                                          handlePermissionChange(profile, 'canDelete', !!checked)
                                        }
                                        className="data-[state=checked]:bg-[#D50000] data-[state=checked]:border-[#D50000]"
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Excluir dados</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Label className="text-[10px] text-muted-foreground">
                                  <Trash2 className="h-3 w-3" />
                                </Label>
                              </div>
                            </TooltipProvider>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3 text-[#00C853]" />
            Tudo certo — governança em dia.
          </p>
          <Button onClick={onClose}>Concluir</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}