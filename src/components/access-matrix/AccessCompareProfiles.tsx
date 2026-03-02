import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye,
  Plus,
  Pencil,
  Trash2,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RbacRole, RbacPortal, RbacModule, RbacPermission } from "@/hooks/useAccessMatrix";

interface AccessCompareProfilesProps {
  roles: RbacRole[];
  portals: RbacPortal[];
  modulesByPortal: Record<string, RbacModule[]>;
  getPermission: (roleId: string, moduleId: string) => RbacPermission | undefined;
}

export function AccessCompareProfiles({
  roles,
  portals,
  modulesByPortal,
  getPermission,
}: AccessCompareProfilesProps) {
  const [roleId1, setRoleId1] = useState(roles[2]?.id || '');
  const [roleId2, setRoleId2] = useState(roles[5]?.id || '');
  const [selectedPortalId, setSelectedPortalId] = useState<string>('all');

  const role1 = roles.find(r => r.id === roleId1);
  const role2 = roles.find(r => r.id === roleId2);

  const modules = selectedPortalId === 'all'
    ? portals.flatMap(p => modulesByPortal[p.id] || [])
    : modulesByPortal[selectedPortalId] || [];

  const getPermBadge = (roleId: string, moduleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.name === 'super_administrador') {
      return <Badge className="bg-emerald-600 text-white text-[10px]">Total</Badge>;
    }
    const perm = getPermission(roleId, moduleId);
    if (!perm?.canView) {
      return <Badge variant="outline" className="text-muted-foreground text-[10px]">Sem acesso</Badge>;
    }
    const flags = [];
    if (perm.canView) flags.push('V');
    if (perm.canCreate) flags.push('C');
    if (perm.canEdit) flags.push('E');
    if (perm.canDelete) flags.push('D');
    return (
      <Badge variant="secondary" className={cn("text-[10px]", perm.canDelete && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
        {flags.join('/')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Select value={roleId1} onValueChange={setRoleId1}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.displayName}</SelectItem>)}
              </SelectContent>
            </Select>

            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />

            <Select value={roleId2} onValueChange={setRoleId2}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.displayName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center mt-4">
            <Select value={selectedPortalId} onValueChange={setSelectedPortalId}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por portal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os portais</SelectItem>
                {portals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo de Acessos</CardTitle>
          <CardDescription>Diferenças de permissões entre as funções selecionadas</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm sticky top-0 z-10">
                <div>Módulo</div>
                <div className="text-center">{role1?.displayName || '—'}</div>
                <div className="text-center">{role2?.displayName || '—'}</div>
              </div>

              {modules.map(mod => {
                const perm1 = getPermission(roleId1, mod.id);
                const perm2 = getPermission(roleId2, mod.id);
                const hasDiff = (perm1?.canView !== perm2?.canView) ||
                  (perm1?.canCreate !== perm2?.canCreate) ||
                  (perm1?.canEdit !== perm2?.canEdit) ||
                  (perm1?.canDelete !== perm2?.canDelete);

                return (
                  <div key={mod.id} className={cn(
                    "grid grid-cols-3 gap-4 p-3 rounded-lg text-sm transition-colors",
                    hasDiff ? "bg-amber-50 dark:bg-amber-950/20" : "hover:bg-muted/50"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{mod.name}</span>
                      {hasDiff && <Badge variant="outline" className="text-[10px] shrink-0 border-amber-300 text-amber-600">Diff</Badge>}
                    </div>
                    <div className="text-center">{getPermBadge(roleId1, mod.id)}</div>
                    <div className="text-center">{getPermBadge(roleId2, mod.id)}</div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Eye className="h-3 w-3" /><span>V = Visualizar</span></div>
            <div className="flex items-center gap-1"><Plus className="h-3 w-3" /><span>C = Criar</span></div>
            <div className="flex items-center gap-1"><Pencil className="h-3 w-3" /><span>E = Editar</span></div>
            <div className="flex items-center gap-1"><Trash2 className="h-3 w-3" /><span>D = Excluir</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
