/**
 * IPROMED Legal Hub - Overview Dashboard (Astrea Style)
 * Área de trabalho principal com layout inspirado no Astrea
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import AstreaStyleAlerts from "./AstreaStyleAlerts";
import AstreaStyleAgenda from "./AstreaStyleAgenda";
import AstreaStyleWidgets, { 
  ActivityWidget, 
  CasesWidget, 
  StatsWidget, 
  PublicationsWidget 
} from "./AstreaStyleWidgets";

export default function LegalOverviewDashboard() {
  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Quick Actions */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Comece adicionando suas tarefas</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <ol className="text-sm text-muted-foreground space-y-1.5">
                <li>1. Clique em "Adicionar primeira tarefa"</li>
                <li>2. Preencha os campos</li>
                <li>3. Se quiser, associe a um processo, caso ou atendimento</li>
                <li>4. Pronto! Sua tarefa será criada e aparecerá na lista</li>
              </ol>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button className="gap-2 bg-[hsl(var(--primary))]">
                <Plus className="h-4 w-4" />
                Adicionar primeira tarefa
              </Button>
              <a href="#" className="text-sm text-[hsl(var(--primary))] hover:underline">
                Saiba mais sobre o módulo da área de trabalho
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <AstreaStyleAlerts />

        {/* Agenda */}
        <AstreaStyleAgenda />
      </div>

      {/* Right Sidebar Widgets */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <ActivityWidget />
        <PublicationsWidget />
        <CasesWidget />
        <StatsWidget />
      </div>
    </div>
  );
}
