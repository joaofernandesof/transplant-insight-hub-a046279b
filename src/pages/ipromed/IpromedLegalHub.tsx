/**
 * IPROMED Legal Hub - Main Portal Component
 * Portal jurídico interno completo (Astrea Style)
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
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
import AstreaExpandedAlerts from "./components/AstreaExpandedAlerts";
import AstreaPublicationsPage from "./components/AstreaPublicationsPage";
import AstreaClientPortal from "./components/AstreaClientPortal";

// Novos componentes com dados reais
import DocumentsManager from "./components/DocumentsManager";
import CaseMovementsTimeline from "./components/CaseMovementsTimeline";
import RealFinancialPage from "./components/RealFinancialPage";
import RealAppointmentsPage from "./components/RealAppointmentsPage";
import IndicatorsDashboard from "./components/IndicatorsDashboard";
import TimesheetManager from "./components/TimesheetManager";
import AIDocumentGenerator from "./components/AIDocumentGenerator";
import DocumentTemplates from "./components/DocumentTemplates";
import BillingRulesManager from "./components/BillingRulesManager";
import TagsManager from "./components/TagsManager";

const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'alerts', label: 'Alertas', icon: Bell },
  { id: 'publications', label: 'Publicações', icon: FileText },
  { id: 'agenda', label: 'Agenda', icon: LayoutGrid },
  { id: 'cases', label: 'Processos', icon: Gavel },
  { id: 'movements', label: 'Andamentos', icon: Clock },
  { id: 'documents', label: 'Documentos', icon: FolderOpen },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'contracts', label: 'Contratos', icon: FileText },
  { id: 'financial', label: 'Financeiro', icon: BarChart3 },
  { id: 'billing', label: 'Régua Cobrança', icon: Bell },
  { id: 'timesheet', label: 'Timesheet', icon: Clock },
  { id: 'ai', label: 'IA Jurídica', icon: LayoutGrid },
  { id: 'portal', label: 'Portal do Cliente', icon: MessageSquare },
  { id: 'tags', label: 'Etiquetas', icon: LayoutGrid },
  { id: 'requests', label: 'Solicitações', icon: MessageSquare },
  { id: 'tasks', label: 'Atividades', icon: LayoutGrid },
  { id: 'analytics', label: 'Indicadores', icon: BarChart3 },
];

export default function IpromedLegalHub() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex flex-col min-w-0 bg-background">
      {/* Top Header Bar - Astrea style (Sidebar vem do IpromedLayout) */}
      <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar contato, processo ou tarefa"
            className="pl-9 h-10 bg-muted/40 border-input"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
          </Button>
          
          {/* User Menu */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
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

            <TabsContent value="templates" className="mt-0">
              <DocumentTemplates />
            </TabsContent>

            <TabsContent value="contracts" className="mt-0">
              <ContractsManager />
            </TabsContent>

            <TabsContent value="financial" className="mt-0">
              <RealFinancialPage />
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              <BillingRulesManager />
            </TabsContent>

            <TabsContent value="timesheet" className="mt-0">
              <TimesheetManager />
            </TabsContent>

            <TabsContent value="ai" className="mt-0">
              <AIDocumentGenerator />
            </TabsContent>

            <TabsContent value="portal" className="mt-0">
              <AstreaClientPortal />
            </TabsContent>

            <TabsContent value="tags" className="mt-0">
              <TagsManager />
            </TabsContent>

            <TabsContent value="requests" className="mt-0">
              <LegalRequestsManager />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <LegalTasksKanban />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <IndicatorsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}