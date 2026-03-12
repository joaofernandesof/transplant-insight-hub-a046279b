import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Briefcase } from 'lucide-react';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import NeoTeamStaffRolesTab from './components/NeoTeamStaffRolesTab';
import { lazy, Suspense } from 'react';

const NeoRHCargosTab = lazy(() => import('@/neohub/pages/neorh/NeoRHCargos'));

export default function NeoTeamCargos() {
  return (
    <div className="space-y-6 p-6">
      <NeoTeamBreadcrumb />
      <div>
        <h1 className="text-2xl font-bold">Cargos & Funções</h1>
        <p className="text-muted-foreground">Gerencie funções do sistema e cargos de RH</p>
      </div>

      <Tabs defaultValue="funcoes" className="w-full">
        <TabsList>
          <TabsTrigger value="funcoes" className="gap-2">
            <Users className="h-4 w-4" />
            Funções do Sistema
          </TabsTrigger>
          <TabsTrigger value="cargos" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Cargos (RH)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funcoes" className="mt-4">
          <NeoTeamStaffRolesTab />
        </TabsContent>

        <TabsContent value="cargos" className="mt-4">
          <Suspense fallback={<div className="p-6">Carregando...</div>}>
            <NeoRHCargosTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
