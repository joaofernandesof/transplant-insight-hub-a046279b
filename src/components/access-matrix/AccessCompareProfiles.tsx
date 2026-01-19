import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Building2, 
  Users, 
  GraduationCap, 
  Heart, 
  TrendingUp,
  Check,
  X,
  Eye,
  Edit3,
  Trash2,
  ArrowLeftRight
} from "lucide-react";
import { NeoHubProfile, Portal, PROFILE_NAMES, PORTAL_NAMES, PORTAL_MODULES } from "@/neohub/lib/permissions";
import { ModulePermission, ModuleInfo } from "@/hooks/useAccessMatrix";
import { cn } from "@/lib/utils";

interface AccessCompareProfilesProps {
  permissions: ModulePermission[];
  getModulesByPortal: (portal: Portal) => ModuleInfo[];
  getPermissionForModule: (moduleCode: string, profile: NeoHubProfile) => ModulePermission | undefined;
}

const PROFILE_ICONS: Record<NeoHubProfile, React.ReactNode> = {
  administrador: <Shield className="h-4 w-4" />,
  licenciado: <Building2 className="h-4 w-4" />,
  colaborador: <Users className="h-4 w-4" />,
  aluno: <GraduationCap className="h-4 w-4" />,
  paciente: <Heart className="h-4 w-4" />,
  cliente_avivar: <TrendingUp className="h-4 w-4" />,
};

const ALL_PROFILES: NeoHubProfile[] = ['administrador', 'licenciado', 'colaborador', 'aluno', 'paciente', 'cliente_avivar'];
const ALL_PORTALS: Portal[] = ['neocare', 'neoteam', 'academy', 'neolicense', 'avivar'];

export function AccessCompareProfiles({
  permissions,
  getModulesByPortal,
  getPermissionForModule,
}: AccessCompareProfilesProps) {
  const [profile1, setProfile1] = useState<NeoHubProfile>('licenciado');
  const [profile2, setProfile2] = useState<NeoHubProfile>('colaborador');
  const [selectedPortal, setSelectedPortal] = useState<Portal | 'all'>('all');

  const modules = selectedPortal === 'all'
    ? ALL_PORTALS.flatMap(p => getModulesByPortal(p))
    : getModulesByPortal(selectedPortal);

  const getPermissionBadge = (perm: ModulePermission | undefined, isAdmin: boolean) => {
    if (isAdmin) {
      return <Badge className="bg-[#00C853] text-white text-[10px]">Total</Badge>;
    }
    if (!perm?.canRead) {
      return <Badge variant="outline" className="text-muted-foreground text-[10px]">Sem acesso</Badge>;
    }
    
    const perms = [];
    if (perm.canRead) perms.push('R');
    if (perm.canWrite) perms.push('W');
    if (perm.canDelete) perms.push('D');
    
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          "text-[10px]",
          perm.canDelete && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        )}
      >
        {perms.join('/')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <Card className="bg-[#FAFAFA] dark:bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Profile 1 */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {PROFILE_ICONS[profile1]}
              </div>
              <Select value={profile1} onValueChange={(v) => setProfile1(v as NeoHubProfile)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_PROFILES.map(p => (
                    <SelectItem key={p} value={p}>{PROFILE_NAMES[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />

            {/* Profile 2 */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                {PROFILE_ICONS[profile2]}
              </div>
              <Select value={profile2} onValueChange={(v) => setProfile2(v as NeoHubProfile)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_PROFILES.map(p => (
                    <SelectItem key={p} value={p}>{PROFILE_NAMES[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Portal Filter */}
          <div className="flex justify-center mt-4">
            <Select value={selectedPortal} onValueChange={(v) => setSelectedPortal(v as Portal | 'all')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por portal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os portais</SelectItem>
                {ALL_PORTALS.map(p => (
                  <SelectItem key={p} value={p}>{PORTAL_NAMES[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo de Acessos</CardTitle>
          <CardDescription>
            Veja as diferenças de permissões entre os perfis selecionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg font-medium text-sm sticky top-0 z-10">
                <div>Módulo</div>
                <div className="text-center">{PROFILE_NAMES[profile1]}</div>
                <div className="text-center">{PROFILE_NAMES[profile2]}</div>
              </div>

              {/* Rows */}
              {modules.map(mod => {
                const perm1 = getPermissionForModule(mod.code, profile1);
                const perm2 = getPermissionForModule(mod.code, profile2);
                const isAdmin1 = profile1 === 'administrador';
                const isAdmin2 = profile2 === 'administrador';
                
                // Check if there's a difference
                const hasDiff = 
                  (isAdmin1 !== isAdmin2) ||
                  (perm1?.canRead !== perm2?.canRead) ||
                  (perm1?.canWrite !== perm2?.canWrite) ||
                  (perm1?.canDelete !== perm2?.canDelete);

                return (
                  <div 
                    key={mod.code}
                    className={cn(
                      "grid grid-cols-3 gap-4 p-3 rounded-lg text-sm transition-colors",
                      hasDiff ? "bg-amber-50 dark:bg-amber-950/20" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">{mod.name}</span>
                      {hasDiff && (
                        <Badge variant="outline" className="text-[10px] shrink-0 border-amber-300 text-amber-600">
                          Diferença
                        </Badge>
                      )}
                    </div>
                    <div className="text-center">
                      {getPermissionBadge(perm1, isAdmin1)}
                    </div>
                    <div className="text-center">
                      {getPermissionBadge(perm2, isAdmin2)}
                    </div>
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
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>R = Leitura</span>
            </div>
            <div className="flex items-center gap-1">
              <Edit3 className="h-3 w-3" />
              <span>W = Escrita</span>
            </div>
            <div className="flex items-center gap-1">
              <Trash2 className="h-3 w-3" />
              <span>D = Exclusão</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}