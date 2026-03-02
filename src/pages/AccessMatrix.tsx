import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Eye,
  Users,
  Download,
  Sparkles,
  Table as TableIcon,
} from "lucide-react";
import { useAccessMatrix } from "@/hooks/useAccessMatrix";
import { AccessPermissionEditor } from "@/components/access-matrix/AccessPermissionEditor";
import { AccessCompareProfiles } from "@/components/access-matrix/AccessCompareProfiles";
import { AccessSmartTrails } from "@/components/access-matrix/AccessSmartTrails";
import { AccessMatrixTable } from "@/components/access-matrix/AccessMatrixTable";

export default function AccessMatrix() {
  const { 
    roles,
    portals,
    modules,
    modulesByPortal,
    permissions,
    isLoading, 
    getPermission,
    updatePermission,
    exportAsCSV,
  } = useAccessMatrix();
  
  const [activeTab, setActiveTab] = useState<'matrix' | 'trails'>('matrix');
  const [selectedEditor, setSelectedEditor] = useState<{ portalId: string; moduleId: string } | null>(null);

  const selectedPortal = selectedEditor ? portals.find(p => p.id === selectedEditor.portalId) : null;
  const selectedPortalModules = selectedEditor ? (modulesByPortal[selectedEditor.portalId] || []) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-12 lg:pl-0">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                Matriz de Acesso
              </h1>
              <p className="text-sm text-muted-foreground">
                Portal → Função → Módulo → Ações (Visualizar, Criar, Editar, Excluir)
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {roles.length} funções · {portals.length} portais · {modules.length} módulos
              </Badge>
              <Button variant="outline" size="sm" onClick={exportAsCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 w-full overflow-x-auto">
        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="grid w-full max-w-lg grid-cols-2">
            <TabsTrigger value="matrix" className="gap-2">
              <TableIcon className="h-4 w-4" />
              Matriz
            </TabsTrigger>
            <TabsTrigger value="trails" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Trilhas
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Matrix Tab */}
        {activeTab === 'matrix' && (
          <AccessMatrixTable
            roles={roles}
            portals={portals}
            modulesByPortal={modulesByPortal}
            isLoading={isLoading}
            getPermission={getPermission}
            updatePermission={updatePermission}
          />
        )}

        {/* Smart Trails Tab */}
        {activeTab === 'trails' && (
          <AccessSmartTrails 
            roles={roles}
            onApplyTrail={(trailId, roleIds) => {
              console.log('Applying trail:', trailId, 'to roles:', roleIds);
            }}
          />
        )}
      </main>

      {/* Permission Editor Dialog */}
      {selectedEditor && selectedPortal && (
        <AccessPermissionEditor
          portal={selectedPortal}
          initialModuleId={selectedEditor.moduleId}
          open={!!selectedEditor}
          onClose={() => setSelectedEditor(null)}
          modules={selectedPortalModules}
          roles={roles}
          getPermission={getPermission}
          updatePermission={updatePermission}
        />
      )}
    </div>
  );
}
