// ====================================
// App.tsx - Entry Point Único
// ====================================
// Arquitetura unificada NeoHub com um único AuthProvider
// v2.1 - Republish trigger

import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { UnifiedAuthProvider, useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { DataProvider } from "@/contexts/DataContext";
import SupportChat from "@/components/SupportChat";
import { EventTracker } from "@/components/EventTracker";
import { UnifiedSidebar } from "@/components/UnifiedSidebar";
import { useUserPresence } from "@/hooks/useUserPresence";
import { queryClient } from "@/lib/queryClient";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { ProtectedRoute, ProfileGuard, AdminRoute, MobileGuard } from "@/components/guards";
import { PROFILE_ROUTES, getDefaultRouteForProfile } from "@/neohub/lib/permissions";
import { MobileAppWrapper } from "@/components/MobileAppWrapper";
import { Loader2 } from "lucide-react";

// ====================================
// Pages - Públicas
// ====================================
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ReferralLanding from "./pages/ReferralLanding";
import NeoHubSalesPage from "./pages/NeoHubSalesPage";
import ApiDocs from "./pages/ApiDocs";
import AuditReportExport from "./pages/AuditReportExport";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
const PublicDashboardPage = lazy(() => import("./pages/public/PublicDashboardPage"));
const ArchitectureDocDownload = lazy(() => import("./pages/docs/ArchitectureDocDownload"));
const FlowDoArchitecturePlan = lazy(() => import("./pages/docs/FlowDoArchitecturePlan"));
const ExportUsersCSV = lazy(() => import("./pages/ExportUsersCSV"));
 const HotLeadsLanding = lazy(() => import("./pages/HotLeadsLanding"));
 const TransplanteLanding = lazy(() => import("./pages/TransplanteLanding"));
 const AvivarCapilarLanding = lazy(() => import("./pages/AvivarCapilarLanding"));
 const ConsultaCapilarLanding = lazy(() => import("./pages/ConsultaCapilarLanding"));

// ====================================
// Pages - Flow.do (Gestão Operacional)
// ====================================
const FlowPortal = lazy(() => import("./pages/flow/FlowPortal"));
const FlowDashboard = lazy(() => import("./pages/flow/FlowDashboard"));
const FlowProjects = lazy(() => import("./pages/flow/FlowProjects"));
const FlowProjectDetail = lazy(() => import("./pages/flow/FlowProjectDetail"));

// NOTE: Carregamento direto (sem lazy) para evitar falhas de import dinâmico no preview
// quando a sessão expira e o servidor retorna HTML de login no lugar do módulo JS.
import AvivarAgentsPage from "./pages/avivar/config/AvivarAgentsPage";

// ====================================
// Pages - Admin/Licenciado (Lazy Loaded)
// ====================================
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminHomeLegacy = lazy(() => import("./pages/AdminHome"));
const AdminDashboardLegacy = lazy(() => import("./pages/AdminDashboard"));
const ClinicComparison = lazy(() => import("./pages/ClinicComparison"));

// Admin Portal with dedicated layout
const AdminPortalHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminLayout = lazy(() => import("./pages/admin/components/AdminLayout"));
const LicenseeHome = lazy(() => import("./pages/LicenseeHome"));
const LicenseesPanel = lazy(() => import("./pages/LicenseesPanel"));
const University = lazy(() => import("./pages/University"));
const TrackDetail = lazy(() => import("./pages/TrackDetail"));
const Regularization = lazy(() => import("./pages/Regularization"));
const Materials = lazy(() => import("./pages/Materials"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Store = lazy(() => import("./pages/Store"));
const Financial = lazy(() => import("./pages/Financial"));
const Mentorship = lazy(() => import("./pages/Mentorship"));
const Systems = lazy(() => import("./pages/Systems"));
const Career = lazy(() => import("./pages/Career"));
const HotLeads = lazy(() => import("./pages/HotLeads"));
const Community = lazy(() => import("./pages/Community"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Partners = lazy(() => import("./pages/Partners"));
const LicensePayments = lazy(() => import("./pages/LicensePayments"));
const EstruturaNeo = lazy(() => import("./pages/EstruturaNeo"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const Achievements = lazy(() => import("./pages/Achievements"));
const UserMonitoring = lazy(() => import("./pages/UserMonitoring"));
const SystemMetrics = lazy(() => import("./pages/SystemMetrics"));
const SystemSentinel = lazy(() => import("./pages/admin/SystemSentinel"));
const ModuleOverridesAdmin = lazy(() => import("./pages/admin/ModuleOverridesAdmin"));
const ReferralsAdmin = lazy(() => import("./pages/admin/ReferralsAdmin"));
const EventLogs = lazy(() => import("./pages/admin/EventLogs"));
const NeoHubMonitoring = lazy(() => import("./pages/admin/NeoHubMonitoring"));
const CodeAssistantPage = lazy(() => import("./pages/admin/CodeAssistantPage"));
const LicenseeOnboardingPage = lazy(() => import("./pages/admin/LicenseeOnboardingPage"));
const SalesUrgencyPage = lazy(() => import("./pages/admin/SalesUrgencyPage"));
const ScheduleRulesAdmin = lazy(() => import("./pages/admin/ScheduleRulesAdmin"));
const ScheduleWeekLocksAdmin = lazy(() => import("./pages/admin/ScheduleWeekLocksAdmin"));
const UserApprovals = lazy(() => import("./pages/admin/UserApprovals"));
const WeeklyReports = lazy(() => import("./pages/WeeklyReports"));
const SurgerySchedule = lazy(() => import("./pages/SurgerySchedule"));
const SalaTecnica = lazy(() => import("./pages/SalaTecnica"));
const ConsolidatedResults = lazy(() => import("./pages/ConsolidatedResults"));
const ExamsList = lazy(() => import("./pages/ExamsList"));
const ExamTaking = lazy(() => import("./pages/ExamTaking"));
const ExamResults = lazy(() => import("./pages/ExamResults"));
const ExamsAdmin = lazy(() => import("./pages/ExamsAdmin"));
const AccessMatrix = lazy(() => import("./pages/AccessMatrix"));
const AnnouncementsAdmin = lazy(() => import("./pages/AnnouncementsAdmin"));
const BannersAdmin = lazy(() => import("./pages/BannersAdmin"));

// ====================================
// Pages - IPROMED (Instituto de Proteção Médica)
// ====================================
const IpromedHome = lazy(() => import("./pages/ipromed/IpromedHome"));
const IpromedDashboard = lazy(() => import("./pages/ipromed/IpromedDashboard"));
const IpromedStudents = lazy(() => import("./pages/ipromed/IpromedStudents"));
const IpromedExams = lazy(() => import("./pages/ipromed/IpromedExams"));
const IpromedMentors = lazy(() => import("./pages/ipromed/IpromedMentors"));
const IpromedSurveys = lazy(() => import("./pages/ipromed/IpromedSurveys"));
const IpromedLeads = lazy(() => import("./pages/ipromed/IpromedLeads"));
const IpromedClients = lazy(() => import("./pages/ipromed/IpromedClients"));
const IpromedClientDetail = lazy(() => import("./pages/ipromed/IpromedClientDetail"));
const IpromedCaseDetail = lazy(() => import("./pages/ipromed/IpromedCaseDetail"));
const IpromedContracts = lazy(() => import("./pages/ipromed/IpromedContracts"));
const IpromedContractDetail = lazy(() => import("./pages/ipromed/IpromedContractDetail"));
const IpromedJourney = lazy(() => import("./pages/ipromed/IpromedJourney"));
const IpromedSalesFunnel = lazy(() => import("./pages/ipromed/IpromedSalesFunnel"));
const IpromedLegalHub = lazy(() => import("./pages/ipromed/IpromedLegalHub"));
const IpromedUniversity = lazy(() => import("./pages/ipromed/IpromedUniversity"));
const IpromedFinancial = lazy(() => import("./pages/ipromed/IpromedFinancial"));
const IpromedPushJuridico = lazy(() => import("./pages/ipromed/IpromedPushJuridico"));
const IpromedActivityLogs = lazy(() => import("./pages/ipromed/IpromedActivityLogs"));
const IpromedTasks = lazy(() => import("./pages/ipromed/IpromedTasks"));
const IpromedProposalsList = lazy(() => import("./pages/ipromed/IpromedProposalsList"));
const IpromedProposalEditor = lazy(() => import("./pages/ipromed/IpromedProposals"));
const IpromedLayout = lazy(() => import("./pages/ipromed/components/IpromedLayout"));
const IpromedReports = lazy(() => import("./pages/ipromed/IpromedReports"));
const IpromedFunctions = lazy(() => import("./pages/ipromed/IpromedFunctions"));

// ====================================
// Pages - NeoPay (Gateway de Pagamentos)
// ====================================
const NeoPayDashboard = lazy(() => import("./pages/neopay/NeoPayDashboard"));
const NeoPayProducts = lazy(() => import("./pages/neopay/NeoPayProducts"));
const NeoPayCharges = lazy(() => import("./pages/neopay/NeoPayCharges"));
const NeoPayTransactions = lazy(() => import("./pages/neopay/NeoPayTransactions"));
const NeoPaySplit = lazy(() => import("./pages/neopay/NeoPaySplit"));
const NeoPaySubscriptions = lazy(() => import("./pages/neopay/NeoPaySubscriptions"));
const NeoPayDelinquency = lazy(() => import("./pages/neopay/NeoPayDelinquency"));
const NeoPayRefunds = lazy(() => import("./pages/neopay/NeoPayRefunds"));
const NeoPayChargebacks = lazy(() => import("./pages/neopay/NeoPayChargebacks"));
const NeoPayAutomations = lazy(() => import("./pages/neopay/NeoPayAutomations"));
const NeoPaySettings = lazy(() => import("./pages/neopay/NeoPaySettings"));
const NeoPayReports = lazy(() => import("./pages/neopay/NeoPayReports"));
const NeoPaySidebar = lazy(() => import("./pages/neopay/components/NeoPaySidebar"));


// ====================================
// Pages - Avivar (Portal CRM + IA)
// ====================================
const AvivarDashboard = lazy(() => import("./pages/avivar/AvivarDashboard"));

const AvivarInbox = lazy(() => import("./pages/avivar/AvivarInbox"));
const AvivarTasks = lazy(() => import("./pages/avivar/AvivarTasks"));
const AvivarLeadsSelector = lazy(() => import("./pages/avivar/AvivarLeadsSelector"));
const AvivarKanbanPage = lazy(() => import("./pages/avivar/kanban/AvivarKanbanPage"));
const AvivarAutomationsPage = lazy(() => import("./pages/avivar/automations/AvivarAutomationsPage"));
const AvivarAnalytics = lazy(() => import("./pages/avivar/AvivarAnalytics"));
const AvivarSettings = lazy(() => import("./pages/avivar/AvivarSettings"));
const AvivarFollowUp = lazy(() => import("./pages/avivar/AvivarFollowUp"));
const AvivarCatalog = lazy(() => import("./pages/avivar/AvivarCatalog"));
const AvivarProductivity = lazy(() => import("./pages/avivar/AvivarProductivity"));
const AvivarSidebar = lazy(() => import("./pages/avivar/AvivarSidebar"));
const AvivarReports = lazy(() => import("./pages/avivar/AvivarReports"));

const AvivarSimpleWizard = lazy(() => import("./pages/avivar/config/AvivarSimpleWizard"));
const AvivarKnowledge = lazy(() => import("./pages/avivar/config/AvivarKnowledge"));
const AvivarPromptPreview = lazy(() => import("./pages/avivar/config/AvivarPromptPreview"));
const AvivarComercialPage = lazy(() => import("./pages/avivar/AvivarComercialPage"));
const AvivarPosVendaPage = lazy(() => import("./pages/avivar/AvivarPosVendaPage"));
const AvivarAgenda = lazy(() => import("./pages/avivar/AvivarAgenda"));
const AvivarAgendaSettings = lazy(() => import("./pages/avivar/AvivarAgendaSettings"));
const AvivarIntegrations = lazy(() => import("./pages/avivar/AvivarIntegrations"));
const GoogleCalendarCallback = lazy(() => import("./pages/avivar/GoogleCalendarCallback"));
const AvivarVoip = lazy(() => import("./pages/avivar/voip/VoipPage"));
const AvivarTutorialsPage = lazy(() => import("./pages/avivar/AvivarTutorialsPage"));
const AvivarAgentRoutingConfig = lazy(() => import("./pages/avivar/config/AvivarAgentRoutingConfig"));
const AvivarContacts = lazy(() => import("./pages/avivar/AvivarContacts"));
const AvivarTeamPage = lazy(() => import("./pages/avivar/AvivarTeamPage"));
const PermissionsMatrix = lazy(() => import("./pages/avivar/PermissionsMatrix"));
const AvivarLeadPage = lazy(() => import("./pages/avivar/AvivarLeadPage"));

// ====================================
// Pages - Vision (Diagnóstico Capilar IA)
// ====================================
const VisionHome = lazy(() => import("./pages/vision/VisionHome"));

// ====================================
// Pages - NeoHair (Tratamento Capilar)
// ====================================
const NeoHairLanding = lazy(() => import("./pages/neohair/NeoHairLanding"));
const NeoHairHome = lazy(() => import("./pages/neohair/NeoHairHome"));
const NeoHairEvaluation = lazy(() => import("./pages/neohair/NeoHairEvaluation"));
const NeoHairStore = lazy(() => import("./pages/neohair/NeoHairStore"));
const NeoHairProfessionalDashboard = lazy(() => import("./pages/neohair/NeoHairProfessionalDashboard"));
const NeoHairAdminDashboard = lazy(() => import("./pages/neohair/NeoHairAdminDashboard"));
const NeoHairSidebar = lazy(() => import("./pages/neohair/components/NeoHairSidebar"));
const VisionReports = lazy(() => import("./pages/vision/VisionReports"));
const NeoTeamReports = lazy(() => import("./pages/neoteam/NeoTeamReports"));
const NeoLicenseReports = lazy(() => import("./pages/neolicense/NeoLicenseReports"));
const NeoCareReports = lazy(() => import("./neohub/pages/neocare/NeoCareReports"));
const AcademyReports = lazy(() => import("./academy/pages/AcademyReports"));

// IPROMED Layout Wrapper
function IpromedLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <IpromedLayout>{children}</IpromedLayout>
    </Suspense>
  );
}

// ====================================
// Pages - NeoCare (Portal do Paciente)
// ====================================
import { 
  NeoCareHome, 
  NeoCareAppointments, 
  NeoCareNewAppointment, 
  NeoCareSettings, 
  NeoCareDocuments, 
  NeoCareOrientations,
  NeoCareLanding,
  NeoCareProductLanding
} from "./neohub/pages/neocare";

// ====================================
// Pages - NeoTeam (Portal do Colaborador)
// ====================================
import {
  NeoTeamHome, 
  NeoTeamSchedule, 
  NeoTeamWaitingRoom,
  NeoTeamWaitingRoomReports,
  NeoTeamDoctorView,
  NeoTeamPatients,
  NeoTeamPatientDetail,
  NeoTeamMedicalRecords, 
  NeoTeamDocuments,
  NeoTeamTasks,
  NeoTeamSettings,
  NeoTeamStaffRoles,
  NeoTeamEvents
} from "./neohub/pages/neoteam";

// ====================================
// Pages - ProfileSelector / PortalSelector
// ====================================
import ProfileSelector from "./neohub/pages/ProfileSelector";
import PortalSelector from "./pages/PortalSelector";

// ====================================
// Marketplace
// ====================================
import { MarketplaceHome } from "./marketplace/pages/MarketplaceHome";
import { MarketplaceProfessionals } from "./marketplace/pages/MarketplaceProfessionals";
import { MarketplaceUnits } from "./marketplace/pages/MarketplaceUnits";
import { MarketplaceLeads } from "./marketplace/pages/MarketplaceLeads";
import { MarketplaceSchedule } from "./marketplace/pages/MarketplaceSchedule";
import { MarketplaceReviews } from "./marketplace/pages/MarketplaceReviews";
import { MarketplaceCampaigns } from "./marketplace/pages/MarketplaceCampaigns";
import { MarketplaceDashboard } from "./marketplace/pages/MarketplaceDashboard";
import { MarketplaceDiscovery } from "./marketplace/pages/MarketplaceDiscovery";

// ====================================
// Pós-Venda
// ====================================
import { PostVendaHome, ChamadoListPage, ChamadoDetailPage, PostVendaSlaPage, PostVendaNpsPage } from "./postvenda/pages";

// ====================================
// External Apps (temporário - serão migrados)
// ====================================
import PortalApp from "./portal/PortalApp";
import ClinicApp from "./clinic/ClinicApp";

// ====================================
// Placeholder para páginas em desenvolvimento
// ====================================
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">Esta página está em desenvolvimento.</p>
    </div>
  );
}

// ====================================
// Sidebar Wrappers
// ====================================
function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return <UnifiedSidebar>{children}</UnifiedSidebar>;
}

// Admin Portal Sidebar Wrapper - usa o layout dedicado do portal admin
function AdminSidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="h-8 w-8 animate-spin text-blue-400" /></div>}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  );
}

// ====================================
// LazyRoute - Wrapper com Suspense para rotas lazy
// ====================================
function LazyRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      {children}
    </Suspense>
  );
}

// ====================================
// Unauthorized Page
// ====================================
function UnauthorizedPage() {
  const { logout } = useUnifiedAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta área.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/select-profile" className="text-primary hover:underline">
            Selecionar outro perfil
          </a>
          <button onClick={logout} className="text-muted-foreground hover:underline">
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

// ====================================
// Home Router - Redireciona baseado no perfil
// ====================================
function HomeRouter() {
  const { user, isAdmin, activeProfile, isLoading } = useUnifiedAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se tem perfil ativo, redirecionar para o portal correspondente
  if (activeProfile) {
    const targetRoute = PROFILE_ROUTES[activeProfile];
    return <Navigate to={targetRoute} replace />;
  }

  // Se tem múltiplos perfis, redirecionar para seleção
  if (user.profiles.length > 1) {
    return <Navigate to="/select-profile" replace />;
  }

  // Se tem apenas um perfil, ativar e redirecionar
  if (user.profiles.length === 1) {
    const targetRoute = PROFILE_ROUTES[user.profiles[0]];
    return <Navigate to={targetRoute} replace />;
  }

  // Fallback para admins - redirecionar para portal admin
  if (isAdmin) {
    return <Navigate to="/admin-portal" replace />;
  }

  return <SidebarWrapper><LicenseeHome /></SidebarWrapper>;
}

// ====================================
// NeoCare Routes (Portal do Paciente)
// ====================================
function NeoCareRoutes() {
  return (
    <ProfileGuard allowedProfiles={['paciente', 'administrador']}>
      <UnifiedSidebar>
        <Routes>
          <Route index element={<NeoCareHome />} />
          <Route path="appointments" element={<NeoCareAppointments />} />
          <Route path="appointments/new" element={<NeoCareNewAppointment />} />
          <Route path="settings" element={<NeoCareSettings />} />
          <Route path="my-records" element={<NeoCareDocuments />} />
          <Route path="my-invoices" element={<PlaceholderPage title="Minhas Faturas" />} />
          <Route path="orientations" element={<NeoCareOrientations />} />
          <Route path="news" element={<PlaceholderPage title="Notícias" />} />
          <Route path="reports" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><NeoCareReports /></Suspense>} />
          <Route path="*" element={<Navigate to="/neocare" replace />} />
        </Routes>
      </UnifiedSidebar>
    </ProfileGuard>
  );
}

// ====================================
// NeoTeam Routes (Portal do Colaborador)
// ====================================
function NeoTeamRoutes() {
  const NeoTeamGalleries = lazy(() => import('@/neohub/pages/neoteam/NeoTeamGalleries'));
  const NeoTeamAnamnesis = lazy(() => import('@/neohub/pages/neoteam/NeoTeamAnamnesis'));
  const LegalDashboardPage = lazy(() => import('@/pages/neoteam/LegalDashboardPage'));
  const ContractsImportPage = lazy(() => import('@/clinic/pages/ContractsImportPage'));
  const ProceduresPage = lazy(() => import('@/pages/neoteam/procedures/ProceduresPage'));
  const InventoryPage = lazy(() => import('@/pages/neoteam/inventory/InventoryPage'));
  const ContractReviewPage = lazy(() => import('@/pages/neoteam/ContractReviewPage'));
  const CleaningRoutinePage = lazy(() => import('@/neohub/pages/neoteam/cleaning/CleaningRoutinePage'));
  const ClinicDashboardPage = lazy(() => import('@/clinic/pages/ClinicDashboard'));
  const NoDateQueuePage = lazy(() => import('@/clinic/pages/NoDateQueue'));
  
  return (
    <ProfileGuard allowedProfiles={['colaborador', 'medico', 'administrador']}>
      <UnifiedSidebar>
        <Routes>
          <Route index element={<NeoTeamHome />} />
          <Route path="schedule" element={<NeoTeamSchedule />} />
          <Route path="agenda-cirurgica" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><ClinicDashboardPage /></Suspense>} />
          {/* vendidos-sem-data agora é aba dentro de agenda-cirurgica */}
          <Route path="waiting-room" element={<NeoTeamWaitingRoom />} />
          <Route path="waiting-room/reports" element={<NeoTeamWaitingRoomReports />} />
          <Route path="doctor-view" element={<NeoTeamDoctorView />} />
          <Route path="patients" element={<NeoTeamPatients />} />
          <Route path="patients/:id" element={<NeoTeamPatientDetail />} />
          <Route path="medical-records" element={<NeoTeamMedicalRecords />} />
          <Route path="documents" element={<NeoTeamDocuments />} />
          <Route path="tasks" element={<NeoTeamTasks />} />
          <Route path="events" element={<NeoTeamEvents />} />
          <Route path="galleries" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><NeoTeamGalleries /></Suspense>} />
          <Route path="anamnesis" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><NeoTeamAnamnesis /></Suspense>} />
          <Route path="legal-dashboard" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><LegalDashboardPage /></Suspense>} />
          <Route path="contracts-import" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><ContractsImportPage /></Suspense>} />
          <Route path="procedures" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><ProceduresPage /></Suspense>} />
          <Route path="inventory" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><InventoryPage /></Suspense>} />
          <Route path="contract-review" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><ContractReviewPage /></Suspense>} />
          <Route path="limpeza" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><CleaningRoutinePage /></Suspense>} />
          <Route path="postvenda" element={<PostVendaHome />} />
          <Route path="postvenda/chamados" element={<ChamadoListPage />} />
          <Route path="postvenda/chamados/:id" element={<ChamadoDetailPage />} />
          <Route path="postvenda/sla" element={<PostVendaSlaPage />} />
          <Route path="postvenda/nps" element={<PostVendaNpsPage />} />
          {/* Distrato agora é um tipo de chamado, acessível via filtro */}
          <Route path="postvenda/distrato" element={<Navigate to="/neoteam/postvenda?tab=chamados&tipo=distrato" replace />} />
          <Route path="staff-roles" element={<NeoTeamStaffRoles />} />
          <Route path="settings" element={<NeoTeamSettings />} />
          <Route path="reports" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><NeoTeamReports /></Suspense>} />
          <Route path="*" element={<Navigate to="/neoteam" replace />} />
        </Routes>
      </UnifiedSidebar>
    </ProfileGuard>
  );
}

// ====================================
// Academy Routes (Portal do Aluno - IBRAMEC)
// ====================================
import {
  AcademyHome, 
  AcademyCourses, 
  AcademyCertificates, 
  AcademyExams,
  AcademySchedule,
  AcademyExamTaking,
  AcademyExamResults,
  AcademyEnrollmentsAdmin,
  AcademyCommunity,
  AcademyStudentsAdmin,
  AcademyClassDetail,
  AcademySettings,
  AcademyChat,
  AcademyReferral,
  Formacao360ReferralLanding,
  SurveyManagement
} from './academy';
import Day2SurveyPage from './academy/pages/Day2SurveyPage';

function AcademyRoutes() {
  return (
    <ProfileGuard allowedProfiles={['aluno', 'administrador']}>
      <Routes>
        {/* Direct survey route - no sidebar wrapper */}
        <Route path="pesquisa-dia2/:classId" element={<Day2SurveyPage />} />
        
        {/* All other routes with sidebar */}
        <Route path="*" element={
          <UnifiedSidebar>
            <Routes>
              <Route index element={<AcademyHome />} />
              <Route path="courses" element={<AcademyCourses />} />
              <Route path="classes/:classId" element={<AcademyClassDetail />} />
              <Route path="schedule" element={<AcademySchedule />} />
              <Route path="materials" element={<Materials />} />
              <Route path="exams" element={<AcademyExams />} />
              <Route path="exams/:examId/take" element={<AcademyExamTaking />} />
              <Route path="exams/:examId/results/:attemptId" element={<AcademyExamResults />} />
              <Route path="certificates" element={<AcademyCertificates />} />
              <Route path="community" element={<AcademyCommunity />} />
              <Route path="chat" element={<AcademyChat />} />
              <Route path="chat/:recipientId" element={<AcademyChat />} />
              <Route path="career" element={<PlaceholderPage title="Plano de Carreira" />} />
              <Route path="referral" element={<AcademyReferral />} />
              <Route path="profile" element={<AcademySettings />} />
              <Route path="admin/enrollments" element={<AcademyEnrollmentsAdmin />} />
              <Route path="admin/students" element={<AcademyStudentsAdmin />} />
              <Route path="admin/surveys" element={<SurveyManagement />} />
              <Route path="reports" element={<Suspense fallback={<div className="p-6">Carregando...</div>}><AcademyReports /></Suspense>} />
              <Route path="*" element={<Navigate to="/academy" replace />} />
            </Routes>
          </UnifiedSidebar>
        } />
      </Routes>
    </ProfileGuard>
  );
}

// ====================================
// NeoLicense Routes (Portal do Licenciado)
// ====================================
function NeoLicenseRoutes() {
  return (
    <ProfileGuard allowedProfiles={['licenciado']}>
      <SidebarWrapper>
        <LazyRoute>
          <Routes>
            <Route index element={<LicenseeHome />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="university" element={<University />} />
            <Route path="university/trilha/:trackId" element={<TrackDetail />} />
            <Route path="university/exams" element={<ExamsList />} />
            <Route path="university/exams/:examId/take" element={<ExamTaking />} />
            <Route path="university/exams/:examId/results/:attemptId" element={<ExamResults />} />
            <Route path="university/exams/admin" element={<ExamsAdmin />} />
            <Route path="materials" element={<Materials />} />
            <Route path="partners" element={<Partners />} />
            <Route path="surgery" element={<SurgerySchedule />} />
            <Route path="achievements" element={<Achievements />} />
            <Route path="referral" element={<ReferralProgram />} />
            <Route path="structure" element={<EstruturaNeo />} />
            <Route path="profile" element={<Profile />} />
            <Route path="hotleads" element={<Navigate to="/hotleads" replace />} />
            <Route path="career" element={<Career />} />
            <Route path="community" element={<Community />} />
            <Route path="reports" element={<NeoLicenseReports />} />
            <Route path="*" element={<Navigate to="/neolicense" replace />} />
          </Routes>
        </LazyRoute>
      </SidebarWrapper>
    </ProfileGuard>
  );
}

// ====================================
// HotLeads Routes (Portal HotLeads)
// ====================================
function HotLeadsRoutes() {
  return (
    <ProfileGuard allowedProfiles={['licenciado']}>
      <SidebarWrapper>
        <LazyRoute>
          <Routes>
            <Route index element={<HotLeads />} />
            <Route path="dashboard" element={<HotLeads initialView="dashboard" />} />
            
            <Route path="settings" element={<HotLeads initialView="settings" />} />
            <Route path="*" element={<Navigate to="/hotleads" replace />} />
          </Routes>
        </LazyRoute>
      </SidebarWrapper>
    </ProfileGuard>
  );
}

// ====================================
// Avivar Routes (Portal CRM + IA Avivar)
// ====================================
function AvivarRoutes() {
  return (
    <ProfileGuard allowedProfiles={['cliente_avivar', 'administrador']}>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0612]"><Loader2 className="h-8 w-8 animate-spin text-purple-400" /></div>}>
          <AvivarSidebar>
            <Routes>
              <Route index element={<AvivarDashboard />} />
              <Route path="dashboard" element={<AvivarDashboard />} />
              <Route path="comercial" element={<AvivarComercialPage />} />
              <Route path="posvenda" element={<AvivarPosVendaPage />} />
              
              <Route path="inbox" element={<AvivarInbox />} />
              <Route path="tasks" element={<AvivarTasks />} />
              <Route path="contacts" element={<AvivarContacts />} />
              <Route path="leads" element={<AvivarLeadsSelector />} />
              <Route path="kanban/:kanbanId" element={<AvivarKanbanPage />} />
              <Route path="automations/:kanbanId" element={<AvivarAutomationsPage />} />
              <Route path="lead/:kanbanLeadId" element={<AvivarLeadPage />} />
              <Route path="analytics" element={<AvivarAnalytics />} />
              <Route path="followup" element={<AvivarFollowUp />} />
              <Route path="catalog" element={<AvivarCatalog />} />
              <Route path="productivity" element={<AvivarProductivity />} />
              <Route path="hotleads" element={<Navigate to="/hotleads" replace />} />
              <Route path="traffic" element={<PlaceholderPage title="Indicadores de Tráfego" />} />
              <Route path="marketing" element={<PlaceholderPage title="Central de Marketing" />} />
              <Route path="tutorials" element={<AvivarTutorialsPage />} />
              <Route path="agenda" element={<AvivarAgenda />} />
              <Route path="agenda/settings" element={<AvivarAgendaSettings />} />
              <Route path="integrations" element={<AvivarIntegrations />} />
              {/* google-callback movido para rota pública no nível raiz */}
              <Route path="voip" element={<AvivarVoip />} />
              <Route path="config" element={<AvivarAgentsPage />} />
              <Route path="config/new" element={<AvivarSimpleWizard />} />
              <Route path="config/edit/:agentId" element={<AvivarSimpleWizard />} />
              <Route path="config/knowledge" element={<AvivarKnowledge />} />
              <Route path="config/preview" element={<AvivarPromptPreview />} />
              <Route path="agents" element={<AvivarAgentsPage />} />
              <Route path="agents/routing/:agentId" element={<AvivarAgentRoutingConfig />} />
              <Route path="team" element={<AvivarTeamPage />} />
              <Route path="team/permissions" element={<PermissionsMatrix />} />
              
              <Route path="settings" element={<AvivarSettings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="reports" element={<AvivarReports />} />
              <Route path="*" element={<Navigate to="/avivar" replace />} />
            </Routes>
          </AvivarSidebar>
      </Suspense>
    </ProfileGuard>
  );
}

// ====================================
// App Routes
// ====================================
function AppRoutes() {
  const { user, isAdmin } = useUnifiedAuth();
  
  return (
    <Routes>
      {/* ====================================
          Rotas Públicas
          ==================================== */}
      {/* Landing Page - Pública */}
      <Route 
        path="/" 
        element={user ? <HomeRouter /> : <LandingPage />} 
      />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/portal-selector" replace /> : <Login />} 
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/indicacao/:code" element={<ReferralLanding />} />
      <Route path="/indicacao-formacao360/:code" element={<Formacao360ReferralLanding />} />
      <Route path="/api-docs" element={<ApiDocs />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/neocare-landing" element={<NeoCareLanding />} />
      <Route path="/neocare-protect" element={<NeoCareProductLanding />} />
      <Route path="/audit-report" element={<AuditReportExport />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/public/dashboard/:token" element={<Suspense fallback={<div className="p-6 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}><PublicDashboardPage /></Suspense>} />
      <Route path="/neohub" element={<NeoHubSalesPage />} />
      <Route path="/docs/architecture" element={<LazyRoute><ArchitectureDocDownload /></LazyRoute>} />
      <Route path="/export-users" element={<Suspense fallback={<div className="p-6">Gerando...</div>}><ExportUsersCSV /></Suspense>} />
      <Route path="/docs/flow-do" element={<LazyRoute><FlowDoArchitecturePlan /></LazyRoute>} />
      
       
       {/* Landing Page HotLeads - Pública */}
       <Route path="/hotleads-vendas" element={<LazyRoute><HotLeadsLanding /></LazyRoute>} />
       
       {/* Landing Page Transplante Capilar - Captação de Leads */}
        <Route path="/transplante-capilar" element={<LazyRoute><TransplanteLanding /></LazyRoute>} />
        
        {/* Landing Page Consulta Capilar - Captação de Pacientes */}
        <Route path="/consulta-capilar" element={<LazyRoute><ConsultaCapilarLanding /></LazyRoute>} />
        {/* Landing Page Avivar CRM Capilar - Página de Vendas */}
        <Route path="/avivar-capilar" element={<LazyRoute><AvivarCapilarLanding /></LazyRoute>} />

        {/* Google Calendar OAuth Callback - fora do ProtectedRoute para não perder sessão no redirect */}
        <Route path="/avivar/google-callback" element={<LazyRoute><GoogleCalendarCallback /></LazyRoute>} />

      {/* ====================================
          Rotas Protegidas - Seleção de Perfil
          ==================================== */}
      <Route 
        path="/select-profile" 
        element={
          <ProtectedRoute>
            <ProfileSelector />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/portal-selector" 
        element={
          <ProtectedRoute>
            <PortalSelector />
          </ProtectedRoute>
        } 
      />

      {/* ====================================
          Portais NeoHub
          ==================================== */}
      <Route path="/neocare/*" element={<ProtectedRoute><NeoCareRoutes /></ProtectedRoute>} />
      <Route path="/neoteam/*" element={<ProtectedRoute><NeoTeamRoutes /></ProtectedRoute>} />
      <Route path="/academy/*" element={<ProtectedRoute><AcademyRoutes /></ProtectedRoute>} />
      <Route path="/neolicense/*" element={<ProtectedRoute><NeoLicenseRoutes /></ProtectedRoute>} />
      <Route path="/hotleads/*" element={<ProtectedRoute><HotLeadsRoutes /></ProtectedRoute>} />
      <Route path="/avivar/*" element={<ProtectedRoute><AvivarRoutes /></ProtectedRoute>} />

      {/* ====================================
          Rotas Legadas - Redirects para Portais
          ==================================== */}
      {/* University -> NeoLicense */}
      <Route path="/university" element={<Navigate to="/neolicense/university" replace />} />
      <Route path="/university/*" element={<Navigate to="/neolicense/university" replace />} />
      
      {/* Materials -> NeoLicense */}
      <Route path="/materials" element={<Navigate to="/neolicense/materials" replace />} />
      
      {/* Partners -> NeoLicense */}
      <Route path="/partners" element={<Navigate to="/neolicense/partners" replace />} />
      
      {/* Achievements -> NeoLicense */}
      <Route path="/achievements" element={<Navigate to="/neolicense/achievements" replace />} />
      
      {/* Referral -> NeoLicense */}
      <Route path="/indique-e-ganhe" element={<Navigate to="/neolicense/referral" replace />} />
      
      {/* Profile -> Portal correspondente */}
      <Route path="/profile" element={<Navigate to="/neolicense/profile" replace />} />
      
      {/* Career -> NeoLicense */}
      <Route path="/career" element={<Navigate to="/neolicense/career" replace />} />
      
      {/* Community -> NeoLicense */}
      <Route path="/community" element={<Navigate to="/neolicense/community" replace />} />
      
      {/* Legacy HotLeads redirects */}
      <Route path="/neolicense/hotleads" element={<Navigate to="/hotleads" replace />} />
      <Route path="/avivar/hotleads" element={<Navigate to="/hotleads" replace />} />
      
      {/* NeoCRM -> Avivar (merged) */}
      <Route path="/neocrm/*" element={<Navigate to="/avivar" replace />} />
      
      {/* Surgery -> NeoLicense */}
      <Route path="/surgery-schedule" element={<Navigate to="/neolicense/surgery" replace />} />
      
      {/* Estrutura NEO -> NeoLicense */}
      <Route path="/estrutura-neo" element={<Navigate to="/neolicense/structure" replace />} />
      
      {/* Home redirect */}
      <Route path="/home" element={<Navigate to="/" replace />} />
      
      {/* ====================================
          Portal Administrativo (com layout próprio)
          ==================================== */}
      <Route path="/admin-portal" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><AdminLayout><AdminPortalHome /></AdminLayout></Suspense></AdminRoute>} />
      <Route path="/admin-portal/monitoring" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><NeoHubMonitoring /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin-portal/*" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><AdminLayout><AdminPortalHome /></AdminLayout></Suspense></AdminRoute>} />
      
      {/* ====================================
          Rotas Admin Legado (mantidas para compatibilidade)
          ==================================== */}
      <Route path="/admin-dashboard" element={<Navigate to="/admin-portal" replace />} />
      <Route path="/dashboard" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><Dashboard /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/alunos" element={<AdminRoute><SidebarWrapper><LazyRoute><LicenseesPanel /></LazyRoute></SidebarWrapper></AdminRoute>} />
      <Route path="/comparison" element={<AdminRoute><SidebarWrapper><LazyRoute><ClinicComparison /></LazyRoute></SidebarWrapper></AdminRoute>} />
      <Route path="/regularization" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><Regularization /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/marketing" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><Marketing /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/store" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><Store /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/financial" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><Financial /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/mentorship" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><Mentorship /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/systems" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><Systems /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/admin" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><AdminPanel /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/access-matrix" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><AccessMatrix /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/certificates" element={<ProfileGuard allowedProfiles={['licenciado', 'aluno']}><SidebarWrapper><LazyRoute><Certificates /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/license-payments" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><LicensePayments /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/monitoring" element={<AdminRoute><SidebarWrapper><LazyRoute><UserMonitoring /></LazyRoute></SidebarWrapper></AdminRoute>} />
      <Route path="/system-metrics" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><SystemMetrics /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/sentinel" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><SystemSentinel /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/announcements" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><AnnouncementsAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/banners" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><BannersAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/module-overrides" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><ModuleOverridesAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/referrals" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><ReferralsAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/event-logs" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><EventLogs /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/code-assistant" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><CodeAssistantPage /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/surgery-schedule" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><SurgerySchedule /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/schedule-rules" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><ScheduleRulesAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/travas-agenda" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><ScheduleWeekLocksAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/licensee-onboarding" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><LicenseeOnboardingPage /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/sales-urgency" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><SalesUrgencyPage /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/approvals" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><UserApprovals /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/weekly-reports" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><WeeklyReports /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/sala-tecnica" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><SalaTecnica /></LazyRoute></SidebarWrapper></ProfileGuard>} />
      <Route path="/consolidated-results" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><LazyRoute><ConsolidatedResults /></LazyRoute></SidebarWrapper></ProfileGuard>} />

      {/* ====================================
          CPG Advocacia Médica
          ==================================== */}
      <Route path="/cpg" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedHome /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/dashboard" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedDashboard /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/students" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedStudents /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/exams" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedExams /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/mentors" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedMentors /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/surveys" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedSurveys /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/leads" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedLeads /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/clients" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedClients /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/clients/:id" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedClientDetail /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/journey" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedJourney /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/sales-funnel" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedSalesFunnel /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/contracts" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedContracts /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/contracts/:id" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedContractDetail /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/legal" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><Navigate to="/cpg/dashboard" replace /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/agenda" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedLegalHub defaultTab="agenda" /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/cases" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedLegalHub defaultTab="cases" /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/cases/:id" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedCaseDetail /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/contracts-hub" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedLegalHub defaultTab="contracts" /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/ai" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedLegalHub defaultTab="ai" /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/university" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedUniversity /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/financial" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedFinancial /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/push-juridico" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedPushJuridico /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/logs" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedActivityLogs /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/tasks" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedTasks /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/proposals" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedProposalsList /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/proposals/new" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedProposalEditor /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/proposals/:id" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedProposalEditor /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/reports" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedReports /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/cpg/functions" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedFunctions /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      {/* Legacy redirect */}
      <Route path="/ipromed/*" element={<Navigate to="/cpg" replace />} />
      <Route path="/ipromed" element={<Navigate to="/cpg" replace />} />
      
{/* ====================================
          Vision - Diagnóstico Capilar IA
          ==================================== */}
      <Route path="/vision" element={<ProfileGuard allowedProfiles={['licenciado']}><LazyRoute><VisionHome /></LazyRoute></ProfileGuard>} />
      <Route path="/vision/*" element={<ProfileGuard allowedProfiles={['licenciado']}><LazyRoute><VisionHome /></LazyRoute></ProfileGuard>} />
      {/* Legacy redirect */}
      <Route path="/neohairscan" element={<Navigate to="/vision" replace />} />

      {/* ====================================
          NeoPay - Gateway de Pagamentos
          ==================================== */}
      <Route path="/neopay" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPayDashboard /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/products" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPayProducts /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/charges" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPayCharges /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/transactions" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPayTransactions /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/split" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPaySplit /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/subscriptions" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPaySubscriptions /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/delinquency" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPayDelinquency /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/refunds" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPayRefunds /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/chargebacks" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPayChargebacks /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/automations" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPayAutomations /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/settings" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPaySettings /></NeoPaySidebar></Suspense></AdminRoute>} />
      <Route path="/neopay/reports" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoPaySidebar><NeoPayReports /></NeoPaySidebar></Suspense></AdminRoute>} />

      {/* ====================================
          NeoHair - Tratamento Capilar
          ==================================== */}
      <Route path="/neohair-landing" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairLanding /></Suspense>} />
      <Route path="/neohair" element={<ProfileGuard allowedProfiles={['paciente', 'licenciado']}><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairHome /></NeoHairSidebar></Suspense></ProfileGuard>} />
      <Route path="/neohair/avaliacao" element={<ProfileGuard allowedProfiles={['paciente', 'licenciado']}><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairEvaluation /></NeoHairSidebar></Suspense></ProfileGuard>} />
      <Route path="/neohair/loja" element={<ProfileGuard allowedProfiles={['paciente', 'licenciado']}><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairStore /></NeoHairSidebar></Suspense></ProfileGuard>} />
      <Route path="/neohair/profissional" element={<ProfileGuard allowedProfiles={['colaborador', 'medico']}><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairProfessionalDashboard /></NeoHairSidebar></Suspense></ProfileGuard>} />
      <Route path="/neohair/admin" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairAdminDashboard /></NeoHairSidebar></Suspense></AdminRoute>} />
      <Route path="/neohair/*" element={<ProfileGuard allowedProfiles={['paciente', 'licenciado']}><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairHome /></NeoHairSidebar></Suspense></ProfileGuard>} />

      {/* ====================================
          Flow.do - Gestão Operacional (Work OS)
          ==================================== */}
      <Route path="/flow" element={<ProfileGuard allowedProfiles={['colaborador']}><LazyRoute><FlowPortal /></LazyRoute></ProfileGuard>}>
        <Route index element={<FlowDashboard />} />
        <Route path="projects" element={<FlowProjects />} />
        <Route path="projects/:projectId" element={<FlowProjectDetail />} />
        <Route path="my-tasks" element={<PlaceholderPage title="Minhas Tarefas" />} />
        <Route path="calendar" element={<PlaceholderPage title="Calendário" />} />
        <Route path="workflows" element={<PlaceholderPage title="Automações" />} />
        <Route path="settings" element={<PlaceholderPage title="Configurações" />} />
      </Route>

      
      {/* ====================================
          Marketplace
          ==================================== */}
      <Route path="/marketplace" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><MarketplaceHome /></SidebarWrapper></ProfileGuard>} />
      <Route path="/marketplace/professionals" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><MarketplaceProfessionals /></SidebarWrapper></ProfileGuard>} />
      <Route path="/marketplace/units" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><MarketplaceUnits /></SidebarWrapper></ProfileGuard>} />
      <Route path="/marketplace/leads" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><MarketplaceLeads /></SidebarWrapper></ProfileGuard>} />
      <Route path="/marketplace/schedule" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><MarketplaceSchedule /></SidebarWrapper></ProfileGuard>} />
      <Route path="/marketplace/reviews" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><MarketplaceReviews /></SidebarWrapper></ProfileGuard>} />
      <Route path="/marketplace/campaigns" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><MarketplaceCampaigns /></SidebarWrapper></ProfileGuard>} />
      <Route path="/marketplace/dashboard" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><MarketplaceDashboard /></SidebarWrapper></ProfileGuard>} />
      <Route path="/marketplace/discovery" element={<ProfileGuard allowedProfiles={['licenciado']}><SidebarWrapper><MarketplaceDiscovery /></SidebarWrapper></ProfileGuard>} />

      {/* ====================================
          Pós-Venda (Redirect para NeoTeam)
          ==================================== */}
      <Route path="/postvenda" element={<Navigate to="/neoteam/postvenda" replace />} />
      <Route path="/postvenda/*" element={<Navigate to="/neoteam/postvenda" replace />} />

      {/* ====================================
          Apps Externos (temporário - serão migrados)
          ==================================== */}
      <Route path="/portal/*" element={<PortalApp />} />
      <Route path="/clinic/*" element={<ClinicApp />} />

      {/* ====================================
          404
          ==================================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ====================================
// Presence Tracker
// ====================================
function PresenceTracker() {
  useUserPresence();
  return null;
}

// ====================================
// Session Manager - Controle de expiração
// ====================================
function SessionManager() {
  useSessionTimeout();
  return null;
}

// ====================================
// App with Support
// ====================================
function AppWithSupport() {
  const { user } = useUnifiedAuth();
  
  return (
    <MobileAppWrapper>
      <EventTracker />
      <AppRoutes />
      {user && <PresenceTracker />}
      {user && <SessionManager />}
      {user && <SupportChat />}
    </MobileAppWrapper>
  );
}

// ====================================
// Main App Component
// ====================================
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UnifiedAuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppWithSupport />
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </UnifiedAuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
