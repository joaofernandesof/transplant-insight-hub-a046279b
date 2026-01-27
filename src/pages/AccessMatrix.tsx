import { useState, useMemo } from "react";
import { ModuleLayout } from "@/components/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Building2, 
  Users, 
  GraduationCap, 
  Heart, 
  TrendingUp,
  Check,
  X,
  Edit3,
  Eye,
  Trash2,
  Download,
  Sparkles,
  Info,
  Lock,
  Unlock,
  FileText,
  ChevronRight,
  Table as TableIcon,
  Scale
} from "lucide-react";
import { useAccessMatrix, ModulePermission, OperationType } from "@/hooks/useAccessMatrix";
import { AccessPermissionEditor } from "@/components/access-matrix/AccessPermissionEditor";
import { AccessCompareProfiles } from "@/components/access-matrix/AccessCompareProfiles";
import { AccessSmartTrails } from "@/components/access-matrix/AccessSmartTrails";
import { AccessMatrixTable } from "@/components/access-matrix/AccessMatrixTable";
import { NeoHubProfile, Portal, PORTAL_NAMES, PROFILE_NAMES } from "@/neohub/lib/permissions";
import { cn } from "@/lib/utils";

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

const PORTAL_COLORS: Record<Portal, string> = {
  neocare: 'from-rose-500 to-pink-500',
  neoteam: 'from-blue-500 to-indigo-500',
  academy: 'from-emerald-500 to-green-500',
  neolicense: 'from-amber-400 to-yellow-500',
  avivar: 'from-orange-500 to-red-500',
  ipromed: 'from-[#00629B] to-[#004d7a]',
};

const PORTAL_BG_COLORS: Record<Portal, string> = {
  neocare: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
  neoteam: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  academy: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
  neolicense: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  avivar: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
  ipromed: 'bg-[#00629B]/10 dark:bg-[#00629B]/20 border-[#00629B]/30 dark:border-[#00629B]/50',
};

const ALL_PROFILES: NeoHubProfile[] = ['administrador', 'licenciado', 'colaborador', 'aluno', 'paciente', 'cliente_avivar', 'ipromed'];
const ALL_PORTALS: Portal[] = ['neocare', 'neoteam', 'academy', 'neolicense', 'avivar', 'ipromed'];

export default function AccessMatrix() {
  const { 
    permissions, 
    isLoading, 
    updatePermission,
    getModulesByPortal,
    getPermissionForModule
  } = useAccessMatrix();
  
  const [activeTab, setActiveTab] = useState<'matrix' | 'overview' | 'compare' | 'trails'>('matrix');
  const [selectedModule, setSelectedModule] = useState<{ portal: Portal; moduleCode: string } | null>(null);
  const [operationType, setOperationType] = useState<OperationType>('clinica');

  const handleEditModule = (portal: Portal, moduleCode: string) => {
    setSelectedModule({ portal, moduleCode });
  };

  const handleCloseEditor = () => {
    setSelectedModule(null);
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting to PDF...');
  };

  // Get stats for a portal
  const getPortalStats = (portal: Portal) => {
    const modules = getModulesByPortal(portal);
    const totalPermissions = modules.length * ALL_PROFILES.length;
    let enabledCount = 0;
    
    modules.forEach(mod => {
      ALL_PROFILES.forEach(profile => {
        const perm = getPermissionForModule(mod.code, profile);
        if (perm?.canRead) enabledCount++;
      });
    });
    
    return { total: totalPermissions, enabled: enabledCount };
  };

  return (
    <ModuleLayout>
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-12 lg:pl-0">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 text-[#2C3E50] dark:text-white">
                <Shield className="h-5 w-5 text-[#2C3E50] dark:text-primary" />
                AccessMatrix
              </h1>
              <p className="text-sm text-muted-foreground">
                Você está no controle dos acessos.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 w-full overflow-x-hidden">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="matrix" className="gap-2">
              <TableIcon className="h-4 w-4" />
              Matriz
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2">
              <Eye className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-2">
              <Users className="h-4 w-4" />
              Comparar
            </TabsTrigger>
            <TabsTrigger value="trails" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Trilhas
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Overview Tab - Portal Cards */}
        {/* Matrix Tab - Full Table View */}
        {activeTab === 'matrix' && (
          <AccessMatrixTable
            permissions={permissions}
            isLoading={isLoading}
            onUpdatePermission={updatePermission}
            getPermissionForModule={getPermissionForModule}
          />
        )}

        {/* Overview Tab - Portal Cards */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Info Banner */}
            <Card className="bg-[#FAFAFA] dark:bg-muted/50 border-[#2C3E50]/20">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-[#2C3E50] dark:text-primary shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">
                      Central de Governança de Acessos
                    </p>
                    <p>
                      Configure quem pode visualizar, editar e excluir dados em cada módulo do NeoHub. 
                      O perfil <Badge variant="outline" className="mx-1 text-xs">Administrador</Badge> possui acesso total a todos os módulos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portal Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALL_PORTALS.map(portal => {
                  const modules = getModulesByPortal(portal);
                  const stats = getPortalStats(portal);
                  
                  return (
                    <Card 
                      key={portal}
                      className={cn(
                        "transition-all hover:shadow-md overflow-hidden",
                        PORTAL_BG_COLORS[portal]
                      )}
                    >
                      {/* Portal Header */}
                      <div className={cn(
                        "h-2 bg-gradient-to-r",
                        PORTAL_COLORS[portal]
                      )} />
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">
                            {PORTAL_NAMES[portal]}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {modules.length} módulos
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {stats.enabled} de {stats.total} permissões ativas
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-4">
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {modules.map(mod => (
                              <div
                                key={mod.code}
                                className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer group"
                                onClick={() => handleEditModule(portal, mod.code)}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-sm truncate">{mod.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <TooltipProvider>
                                    {ALL_PROFILES.slice(0, 3).map(profile => {
                                      const perm = getPermissionForModule(mod.code, profile);
                                      const hasAccess = perm?.canRead;
                                      return (
                                        <Tooltip key={profile}>
                                          <TooltipTrigger asChild>
                                            <div className={cn(
                                              "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]",
                                              hasAccess ? "bg-[#00C853]" : "bg-muted-foreground/30"
                                            )}>
                                              {PROFILE_ICONS[profile]}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">
                                              {PROFILE_NAMES[profile]}: {hasAccess ? 'Permitido' : 'Bloqueado'}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })}
                                    {ALL_PROFILES.length > 3 && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        +{ALL_PROFILES.length - 3}
                                      </span>
                                    )}
                                  </TooltipProvider>
                                  
                                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full mt-3 text-xs"
                          onClick={() => handleEditModule(portal, modules[0]?.code || '')}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Editar Permissões
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <AccessCompareProfiles 
            permissions={permissions}
            getModulesByPortal={getModulesByPortal}
            getPermissionForModule={getPermissionForModule}
          />
        )}

        {/* Smart Trails Tab */}
        {activeTab === 'trails' && (
          <AccessSmartTrails 
            onApplyTrail={(trailId) => {
              console.log('Applying trail:', trailId);
            }}
          />
        )}
      </main>

      {/* Permission Editor Dialog */}
      {selectedModule && (
        <AccessPermissionEditor
          portal={selectedModule.portal}
          moduleCode={selectedModule.moduleCode}
          open={!!selectedModule}
          onClose={handleCloseEditor}
          permissions={permissions}
          onUpdatePermission={updatePermission}
          getPermissionForModule={getPermissionForModule}
          getModulesByPortal={getModulesByPortal}
        />
      )}
    </ModuleLayout>
  );
}