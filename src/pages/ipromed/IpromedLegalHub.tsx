/**
 * CPG Advocacia Médica Legal Hub - Main Portal Component
 * Portal jurídico interno completo (Astrea Style)
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabFromUrl } from "@/hooks/useTabFromUrl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Scale,
  Users,
  UserPlus,
  FilePlus,
  CalendarPlus,
  LogOut,
  UserCircle,
  Cog,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

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
// DocumentsManager removido - documentos centralizados em contratos
import CaseMovementsTimeline from "./components/CaseMovementsTimeline";
import RealFinancialPage from "./components/RealFinancialPage";
import AstreaStyleAgenda from "./components/AstreaStyleAgenda";
import IndicatorsDashboard from "./components/IndicatorsDashboard";
import TimesheetManager from "./components/TimesheetManager";
import AIDocumentGenerator from "./components/AIDocumentGenerator";
import DocumentTemplates from "./components/DocumentTemplates";
import BillingRulesManager from "./components/BillingRulesManager";
import TagsManager from "./components/TagsManager";
import JurisprudenciasPage from "./components/JurisprudenciasPage";
import MeetingToolPage from "./components/MeetingToolPage";
import RiskScoringCard from "./components/RiskScoringCard";
import SLADashboard from "./components/SLADashboard";

const validTabs = [
  'overview', 'alerts', 'publications', 'agenda', 'meetings', 
  'jurisprudencias', 'cases', 'movements', 'templates',
  'contracts', 'financial', 'billing', 'timesheet', 'ai', 'risk',
  'sla', 'portal', 'tags', 'requests', 'tasks', 'analytics'
];

const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'alerts', label: 'Alertas', icon: Bell },
  { id: 'publications', label: 'Publicações', icon: FileText },
  { id: 'agenda', label: 'Agenda', icon: LayoutGrid },
  { id: 'meetings', label: 'Reuniões', icon: Users },
  { id: 'jurisprudencias', label: 'Jurisprudências', icon: Scale },
  { id: 'cases', label: 'Processos', icon: Gavel },
  { id: 'movements', label: 'Andamentos', icon: Clock },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'contracts', label: 'Contratos', icon: FileText },
  { id: 'financial', label: 'Financeiro', icon: BarChart3 },
  { id: 'billing', label: 'Régua Cobrança', icon: Bell },
  { id: 'timesheet', label: 'Timesheet', icon: Clock },
  { id: 'ai', label: 'IA Jurídica', icon: LayoutGrid },
  { id: 'risk', label: 'Scoring Risco', icon: Scale },
  { id: 'sla', label: 'SLA / Produtividade', icon: BarChart3 },
  { id: 'portal', label: 'Portal do Cliente', icon: MessageSquare },
  { id: 'tags', label: 'Etiquetas', icon: LayoutGrid },
  { id: 'requests', label: 'Solicitações', icon: MessageSquare },
  { id: 'tasks', label: 'Atividades', icon: LayoutGrid },
  { id: 'analytics', label: 'Indicadores', icon: BarChart3 },
];

// Mock notifications data
const mockNotifications = [
  { id: 1, title: 'Prazo vencendo', description: 'Contestação Dr. Silva - 2 dias', type: 'warning' },
  { id: 2, title: 'Nova publicação', description: 'TJSP - Processo 0001234', type: 'info' },
  { id: 3, title: 'Reunião agendada', description: 'Amanhã às 14h - Dr. Costa', type: 'success' },
];

export default function IpromedLegalHub() {
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useTabFromUrl({
    defaultTab: 'overview',
    validTabs,
  });
  
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const handleQuickAdd = (type: string) => {
    switch (type) {
      case 'client':
        setActiveTab('portal');
        toast.info('Navegando para cadastro de cliente');
        break;
      case 'case':
        setActiveTab('cases');
        toast.info('Navegando para cadastro de processo');
        break;
      case 'meeting':
        setActiveTab('meetings');
        toast.info('Navegando para agendar reunião');
        break;
      case 'document':
        setActiveTab('contracts');
        toast.info('Navegando para novo documento/contrato');
        break;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col min-w-0 bg-background">
        {/* Top Header Bar - Astrea style */}
        <header className="h-14 lg:h-16 bg-background border-b border-border flex items-center justify-between px-3 lg:px-6 flex-shrink-0">
          {/* Search - Hide on mobile */}
          <div className="relative hidden sm:block w-64 lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar contato, processo..."
              className="pl-9 h-9 lg:h-10 bg-muted/40 border-input"
            />
          </div>
          
          {/* Mobile Search Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="sm:hidden text-muted-foreground"
                onClick={() => toast.info('Pesquisa rápida em breve')}
              >
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Pesquisar</TooltipContent>
          </Tooltip>

          {/* Right Actions */}
          <div className="flex items-center gap-1 lg:gap-3">
            {/* Quick Add Menu */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Adicionar novo</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Criar Novo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleQuickAdd('client')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAdd('case')}>
                  <Gavel className="h-4 w-4 mr-2" />
                  Novo Processo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAdd('meeting')}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Nova Reunião
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAdd('document')}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  Novo Documento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Profile */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Perfil</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/perfil')}>
                  <UserCircle className="h-4 w-4 mr-2" />
                  Ver Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                  <Cog className="h-4 w-4 mr-2" />
                  Preferências
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/select-profile')}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Trocar Portal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Help */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setShowHelpDialog(true)}
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ajuda</TooltipContent>
            </Tooltip>
            
            {/* Chat / Requests */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setActiveTab('requests')}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Solicitações</TooltipContent>
            </Tooltip>
            
            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setShowSettingsDialog(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configurações</TooltipContent>
            </Tooltip>
            
            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative text-muted-foreground hover:text-primary"
                  onClick={() => setShowNotificationsDialog(true)}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notificações</TooltipContent>
            </Tooltip>
            
            {/* User Menu - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2 ml-2 lg:ml-4 pl-2 lg:pl-4 border-l border-border">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  MR
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden lg:inline">Mariana</span>
            </div>
          </div>
        </header>

        {/* Help Dialog */}
        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Central de Ajuda
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">Recursos Disponíveis</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentação do sistema
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat com suporte
                  </li>
                  <li className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Tutoriais em vídeo
                  </li>
                </ul>
              </div>
              <Button className="w-full" onClick={() => {
                setShowHelpDialog(false);
                toast.info('Suporte disponível via WhatsApp');
              }}>
                Falar com Suporte
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notifications Dialog */}
        <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notificações
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-3 py-2">
                {mockNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setShowNotificationsDialog(false);
                      toast.info(`Abrindo: ${notification.title}`);
                    }}
                  >
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setActiveTab('alerts');
                setShowNotificationsDialog(false);
              }}
            >
              Ver Todos os Alertas
            </Button>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurações
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setShowSettingsDialog(false);
                    navigate('/perfil');
                  }}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setShowSettingsDialog(false);
                    setActiveTab('tags');
                  }}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Gerenciar Etiquetas
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setShowSettingsDialog(false);
                    setActiveTab('billing');
                  }}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Régua de Cobrança
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
              <AstreaStyleAgenda />
            </TabsContent>

            <TabsContent value="meetings" className="mt-0">
              <MeetingToolPage />
            </TabsContent>

            <TabsContent value="jurisprudencias" className="mt-0">
              <JurisprudenciasPage />
            </TabsContent>

            <TabsContent value="cases" className="mt-0">
              <LegalCasesManager />
            </TabsContent>

            <TabsContent value="movements" className="mt-0">
              <CaseMovementsTimeline showCaseSelector />
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

            <TabsContent value="risk" className="mt-0">
              <div className="max-w-2xl">
                <RiskScoringCard />
              </div>
            </TabsContent>

            <TabsContent value="sla" className="mt-0">
              <SLADashboard />
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
    </TooltipProvider>
  );
}