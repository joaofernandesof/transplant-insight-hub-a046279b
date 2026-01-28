/**
 * IPROMED Legal Hub - Main Portal Component
 * Portal jurídico interno completo (Astrea Style)
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Scale,
  LayoutDashboard,
  Gavel,
  FileText,
  MessageSquare,
  LayoutGrid,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  HelpCircle,
  User,
  FolderOpen,
  Clock,
} from "lucide-react";

import LegalOverviewDashboard from "./components/LegalOverviewDashboard";
import LegalCasesManager from "./components/LegalCasesManager";
import ContractsManager from "./components/ContractsManager";
import LegalRequestsManager from "./components/LegalRequestsManager";
import LegalTasksKanban from "./components/LegalTasksKanban";
import LegalAnalytics from "./components/LegalAnalytics";
import AstreaStyleSidebar from "./components/AstreaStyleSidebar";
import AstreaExpandedAlerts from "./components/AstreaExpandedAlerts";
import AstreaPublicationsPage from "./components/AstreaPublicationsPage";
import AstreaClientPortal from "./components/AstreaClientPortal";

// Novos componentes com dados reais
import DocumentsManager from "./components/DocumentsManager";
import CaseMovementsTimeline from "./components/CaseMovementsTimeline";
import RealFinancialPage from "./components/RealFinancialPage";
import RealAppointmentsPage from "./components/RealAppointmentsPage";

const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'alerts', label: 'Alertas', icon: Bell },
  { id: 'publications', label: 'Publicações', icon: FileText },
  { id: 'agenda', label: 'Agenda', icon: LayoutGrid },
  { id: 'cases', label: 'Processos', icon: Gavel },
  { id: 'movements', label: 'Andamentos', icon: Clock },
  { id: 'documents', label: 'Documentos', icon: FolderOpen },
  { id: 'contracts', label: 'Contratos', icon: FileText },
  { id: 'financial', label: 'Financeiro', icon: BarChart3 },
  { id: 'portal', label: 'Portal do Cliente', icon: MessageSquare },
  { id: 'requests', label: 'Solicitações', icon: MessageSquare },
  { id: 'tasks', label: 'Atividades', icon: LayoutGrid },
  { id: 'analytics', label: 'Indicadores', icon: BarChart3 },
];

export default function IpromedLegalHub() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AstreaStyleSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar - Astrea style */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 flex-shrink-0">
          {/* Search */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar contato, processo ou tarefa"
              className="pl-9 h-10 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-600">
              <Plus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600">
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-600">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative text-gray-600">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-rose-500 rounded-full" />
            </Button>
            
            {/* User Menu */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm">
                  MR
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Mariana</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Tab Navigation - Hidden since we use sidebar */}
              <div className="sr-only">
                <TabsList>
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-0">
                <LegalOverviewDashboard />
              </TabsContent>

              <TabsContent value="alerts" className="mt-0">
                <AstreaExpandedAlerts />
              </TabsContent>

              <TabsContent value="publications" className="mt-0">
                <AstreaPublicationsPage />
              </TabsContent>

              <TabsContent value="agenda" className="mt-0">
                <RealAppointmentsPage />
              </TabsContent>

              <TabsContent value="cases" className="mt-0">
                <LegalCasesManager />
              </TabsContent>

              <TabsContent value="movements" className="mt-0">
                <CaseMovementsTimeline showCaseSelector />
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <DocumentsManager />
              </TabsContent>

              <TabsContent value="contracts" className="mt-0">
                <ContractsManager />
              </TabsContent>

              <TabsContent value="financial" className="mt-0">
                <RealFinancialPage />
              </TabsContent>

              <TabsContent value="portal" className="mt-0">
                <AstreaClientPortal />
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
        </main>
      </div>
    </div>
  );
}