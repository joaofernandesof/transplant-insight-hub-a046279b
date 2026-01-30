/**
 * Avivar Post-Sale Kanban Page
 * Onboarding → Contrato → Pré-Op → Procedimento → Pós-Op → Relacionamento
 */

import { JourneyKanban } from './journey';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BPMNFlow } from './journey/components/BPMNFlow';
import { HeartPulse, GitBranch } from 'lucide-react';

export default function AvivarPosVendaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-emerald-600" />
          Kanban Pós-Venda
        </h1>
        <p className="text-muted-foreground">
          Acompanhe pacientes do onboarding ao relacionamento de longo prazo
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
          <JourneyKanban journeyType="pos_venda" />
        </TabsContent>

        <TabsContent value="bpmn">
          <BPMNFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
