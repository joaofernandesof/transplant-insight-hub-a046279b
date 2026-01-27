/**
 * IPROMED Legal Hub - Main Portal Component
 * Portal jurídico interno completo
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  LayoutDashboard,
  Gavel,
  FileText,
  MessageSquare,
  LayoutGrid,
  BarChart3,
  Settings,
  Shield,
  Bell,
} from "lucide-react";

import LegalOverviewDashboard from "./components/LegalOverviewDashboard";
import LegalCasesManager from "./components/LegalCasesManager";
import ContractsManager from "./components/ContractsManager";
import LegalRequestsManager from "./components/LegalRequestsManager";
import LegalTasksKanban from "./components/LegalTasksKanban";
import LegalAnalytics from "./components/LegalAnalytics";

const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'cases', label: 'Processos', icon: Gavel },
  { id: 'contracts', label: 'Contratos', icon: FileText },
  { id: 'requests', label: 'Solicitações', icon: MessageSquare },
  { id: 'tasks', label: 'Atividades', icon: LayoutGrid },
  { id: 'analytics', label: 'Indicadores', icon: BarChart3 },
];

export default function IpromedLegalHub() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-[#00629B] to-[#004d7a] rounded-2xl shadow-lg">
            <Scale className="h-8 w-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00629B] to-[#004d7a] bg-clip-text text-transparent">
                IPROMED Legal Hub
              </h1>
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Acesso Restrito
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Gestão jurídica interna • Processos, Contratos e Solicitações
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b">
          <TabsList className="h-auto p-0 bg-transparent gap-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#00629B] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          <LegalOverviewDashboard />
        </TabsContent>

        <TabsContent value="cases" className="mt-0">
          <LegalCasesManager />
        </TabsContent>

        <TabsContent value="contracts" className="mt-0">
          <ContractsManager />
        </TabsContent>

        <TabsContent value="requests" className="mt-0">
          <LegalRequestsManager />
        </TabsContent>

        <TabsContent value="tasks" className="mt-0">
          <LegalTasksKanban />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <LegalAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
