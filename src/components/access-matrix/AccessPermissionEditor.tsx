import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Eye,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RbacRole, RbacPortal, RbacModule, RbacPermission, PermissionField } from "@/hooks/useAccessMatrix";

interface AccessPermissionEditorProps {
  portal: RbacPortal;
  initialModuleId: string;
  open: boolean;
  onClose: () => void;
  modules: RbacModule[];
  roles: RbacRole[];
  getPermission: (roleId: string, moduleId: string) => RbacPermission | undefined;
  updatePermission: (roleId: string, moduleId: string, updates: Partial<Pick<RbacPermission, PermissionField>>) => Promise<void>;
}

export function AccessPermissionEditor({
  portal,
  initialModuleId,
  open,
  onClose,
  modules,
  roles,
  getPermission,
  updatePermission,
}: AccessPermissionEditorProps) {
  const [selectedModuleId, setSelectedModuleId] = useState(initialModuleId);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const currentModule = modules.find(m => m.id === selectedModuleId);

  const handleChange = async (
    roleId: string,
    field: PermissionField,
    value: boolean
  ) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.name === 'super_administrador') return;
    
    setIsUpdating(true);
    try {
      if (field === 'canView' && !value) {
        await updatePermission(roleId, selectedModuleId, {
          canView: false, canCreate: false, canEdit: false, canDelete: false,
        });
      } else {
        await updatePermission(roleId, selectedModuleId, { [field]: value });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Editar Permissões
          </DialogTitle>
          <DialogDescription>
            Configure os acessos para os módulos do portal <Badge variant="outline">{portal.name}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Module Selector */}
          <div className="w-48 shrink-0">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Módulos</p>
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 pr-2">
                {modules.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedModuleId === mod.id
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
              <p className="text-sm text-muted-foreground">Configure quem pode acessar este módulo</p>
            </div>

            <ScrollArea className="h-[380px]">
              <div className="space-y-3 pr-4">
                {roles.map(role => {
                  const isSA = role.name === 'super_administrador';
                  const perm = getPermission(role.id, selectedModuleId);
                  
                  return (
                    <Card key={role.id} className={cn("transition-all", (isSA || perm?.canView) ? "border-emerald-500/30" : "border-muted")}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-sm">{role.displayName}</p>
                            {isSA && <p className="text-xs text-muted-foreground">Acesso total (bypass)</p>}
                          </div>

                          <div className="flex items-center gap-4">
                            <TooltipProvider>
                              {([
                                { field: 'canView' as PermissionField, icon: Eye, label: 'Visualizar', color: 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600' },
                                { field: 'canCreate' as PermissionField, icon: Plus, label: 'Criar', color: 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600' },
                                { field: 'canEdit' as PermissionField, icon: Pencil, label: 'Editar', color: 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600' },
                                { field: 'canDelete' as PermissionField, icon: Trash2, label: 'Excluir', color: 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600' },
                              ]).map(({ field, icon: Icon, label, color }) => (
                                <div key={field} className="flex flex-col items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Checkbox
                                          checked={isSA || perm?.[field] || false}
                                          disabled={isSA || isUpdating || (field !== 'canView' && !perm?.canView)}
                                          onCheckedChange={(checked) => handleChange(role.id, field, !!checked)}
                                          className={color}
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent><p className="text-xs">{label}</p></TooltipContent>
                                  </Tooltip>
                                  <Label className="text-[10px] text-muted-foreground"><Icon className="h-3 w-3" /></Label>
                                </div>
                              ))}
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

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-600" />
            Governança em dia.
          </p>
          <Button onClick={onClose}>Concluir</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
