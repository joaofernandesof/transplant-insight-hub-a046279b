/**
 * Avivar Commercial Kanban Page
 * Lead → Triagem → Agendamento → Follow Up → Paciente
 */

import { JourneyKanban } from './journey';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BPMNFlow } from './journey/components/BPMNFlow';
import { Briefcase, GitBranch } from 'lucide-react';

export default function AvivarComercialPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          Kanban Comercial
        </h1>
        <p className="text-muted-foreground">
          Gerencie leads desde a entrada até a conversão em pacientes
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="bpmn" className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            Fluxo BPMN
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <JourneyKanban journeyType="comercial" />
        </TabsContent>

        <TabsContent value="bpmn">
          <BPMNFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
