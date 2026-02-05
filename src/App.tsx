// ====================================
// App.tsx - Entry Point Único
// ====================================
// Arquitetura unificada NeoHub com um único AuthProvider

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
 const HotLeadsLanding = lazy(() => import("./pages/HotLeadsLanding"));
 const TransplanteLanding = lazy(() => import("./pages/TransplanteLanding"));
 const AvivarCapilarLanding = lazy(() => import("./pages/AvivarCapilarLanding"));

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
const CodeAssistantPage = lazy(() => import("./pages/admin/CodeAssistantPage"));
const LicenseeOnboardingPage = lazy(() => import("./pages/admin/LicenseeOnboardingPage"));
const SalesUrgencyPage = lazy(() => import("./pages/admin/SalesUrgencyPage"));
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
const IpromedLayout = lazy(() => import("./pages/ipromed/components/IpromedLayout"));

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
const NeoPaySidebar = lazy(() => import("./pages/neopay/components/NeoPaySidebar"));

// ====================================
// Pages - NeoCRM (CRM de Vendas) - DEPRECATED: merged into Avivar
// ====================================
const NeoCrmDashboard = lazy(() => import("./pages/neocrm/NeoCrmDashboard"));
const NeoCrmPipeline = lazy(() => import("./pages/neocrm/NeoCrmPipeline"));
const NeoCrmInbox = lazy(() => import("./pages/neocrm/NeoCrmInbox"));
const NeoCrmTasks = lazy(() => import("./pages/neocrm/NeoCrmTasks"));
const NeoCrmLeads = lazy(() => import("./pages/neocrm/NeoCrmLeads"));
const NeoCrmAnalytics = lazy(() => import("./pages/neocrm/NeoCrmAnalytics"));
const NeoCrmSettings = lazy(() => import("./pages/neocrm/NeoCrmSettings"));
const NeoCrmSidebar = lazy(() => import("./pages/neocrm/components/NeoCrmSidebar"));

// ====================================
// Pages - Avivar (Portal CRM + IA)
// ====================================
const AvivarDashboard = lazy(() => import("./pages/avivar/AvivarDashboard"));

const AvivarInbox = lazy(() => import("./pages/avivar/AvivarInbox"));
const AvivarTasks = lazy(() => import("./pages/avivar/AvivarTasks"));
const AvivarLeadsSelector = lazy(() => import("./pages/avivar/AvivarLeadsSelector"));
const AvivarKanbanPage = lazy(() => import("./pages/avivar/kanban/AvivarKanbanPage"));
const AvivarAnalytics = lazy(() => import("./pages/avivar/AvivarAnalytics"));
const AvivarSettings = lazy(() => import("./pages/avivar/AvivarSettings"));
const AvivarFollowUp = lazy(() => import("./pages/avivar/AvivarFollowUp"));
const AvivarCatalog = lazy(() => import("./pages/avivar/AvivarCatalog"));
const AvivarProductivity = lazy(() => import("./pages/avivar/AvivarProductivity"));
const AvivarSidebar = lazy(() => import("./pages/avivar/AvivarSidebar"));
const OnboardingBlocker = lazy(() => import("./pages/avivar/onboarding").then(m => ({ default: m.OnboardingBlocker })));
const AvivarSimpleWizard = lazy(() => import("./pages/avivar/config/AvivarSimpleWizard"));
const AvivarKnowledge = lazy(() => import("./pages/avivar/config/AvivarKnowledge"));
const AvivarPromptPreview = lazy(() => import("./pages/avivar/config/AvivarPromptPreview"));
const AvivarComercialPage = lazy(() => import("./pages/avivar/AvivarComercialPage"));
const AvivarPosVendaPage = lazy(() => import("./pages/avivar/AvivarPosVendaPage"));
const AvivarAgenda = lazy(() => import("./pages/avivar/AvivarAgenda"));
const AvivarAgendaSettings = lazy(() => import("./pages/avivar/AvivarAgendaSettings"));
const AvivarIntegrations = lazy(() => import("./pages/avivar/AvivarIntegrations"));
const AvivarVoip = lazy(() => import("./pages/avivar/voip/VoipPage"));
const AvivarTutorialsPage = lazy(() => import("./pages/avivar/AvivarTutorialsPage"));
const AvivarAgentRoutingConfig = lazy(() => import("./pages/avivar/config/AvivarAgentRoutingConfig"));
const AvivarContacts = lazy(() => import("./pages/avivar/AvivarContacts"));
const AvivarTeamPage = lazy(() => import("./pages/avivar/AvivarTeamPage"));
const PermissionsMatrix = lazy(() => import("./pages/avivar/PermissionsMatrix"));

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
  
  return (
    <ProfileGuard allowedProfiles={['colaborador', 'medico', 'administrador']}>
      <UnifiedSidebar>
        <Routes>
          <Route index element={<NeoTeamHome />} />
          <Route path="schedule" element={<NeoTeamSchedule />} />
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
          <Route path="postvenda" element={<PostVendaHome />} />
          <Route path="postvenda/chamados" element={<ChamadoListPage />} />
          <Route path="postvenda/chamados/:id" element={<ChamadoDetailPage />} />
          <Route path="postvenda/sla" element={<PostVendaSlaPage />} />
          <Route path="postvenda/nps" element={<PostVendaNpsPage />} />
          {/* Distrato agora é um tipo de chamado, acessível via filtro */}
          <Route path="postvenda/distrato" element={<Navigate to="/neoteam/postvenda?tab=chamados&tipo=distrato" replace />} />
          <Route path="staff-roles" element={<NeoTeamStaffRoles />} />
          <Route path="settings" element={<NeoTeamSettings />} />
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
            <Route path="hotleads" element={<HotLeads />} />
            <Route path="career" element={<Career />} />
            <Route path="community" element={<Community />} />
            <Route path="*" element={<Navigate to="/neolicense" replace />} />
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
        <OnboardingBlocker>
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
              <Route path="analytics" element={<AvivarAnalytics />} />
              <Route path="followup" element={<AvivarFollowUp />} />
              <Route path="catalog" element={<AvivarCatalog />} />
              <Route path="productivity" element={<AvivarProductivity />} />
              <Route path="hotleads" element={<HotLeads />} />
              <Route path="traffic" element={<PlaceholderPage title="Indicadores de Tráfego" />} />
              <Route path="marketing" element={<PlaceholderPage title="Central de Marketing" />} />
              <Route path="tutorials" element={<AvivarTutorialsPage />} />
              <Route path="agenda" element={<AvivarAgenda />} />
              <Route path="agenda/settings" element={<AvivarAgendaSettings />} />
              <Route path="integrations" element={<AvivarIntegrations />} />
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
              <Route path="*" element={<Navigate to="/avivar" replace />} />
            </Routes>
          </AvivarSidebar>
        </OnboardingBlocker>
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
      <Route path="/docs/flow-do" element={<LazyRoute><FlowDoArchitecturePlan /></LazyRoute>} />
       
       {/* Landing Page HotLeads - Pública */}
       <Route path="/hotleads-vendas" element={<LazyRoute><HotLeadsLanding /></LazyRoute>} />
       
       {/* Landing Page Transplante Capilar - Captação de Leads */}
       <Route path="/transplante-capilar" element={<LazyRoute><TransplanteLanding /></LazyRoute>} />
        
        {/* Landing Page Avivar CRM Capilar - Página de Vendas */}
        <Route path="/avivar-capilar" element={<LazyRoute><AvivarCapilarLanding /></LazyRoute>} />

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
      
      {/* HotLeads -> Avivar */}
      <Route path="/hotleads" element={<Navigate to="/avivar/hotleads" replace />} />
      
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
      <Route path="/admin-portal/*" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><AdminLayout><AdminPortalHome /></AdminLayout></Suspense></AdminRoute>} />
      
      {/* ====================================
          Rotas Admin Legado (mantidas para compatibilidade)
          ==================================== */}
      <Route path="/admin-dashboard" element={<Navigate to="/admin-portal" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><SidebarWrapper><LazyRoute><Dashboard /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/alunos" element={<ProtectedRoute><SidebarWrapper><LazyRoute><LicenseesPanel /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/comparison" element={<ProtectedRoute><SidebarWrapper><LazyRoute><ClinicComparison /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/regularization" element={<ProtectedRoute><SidebarWrapper><LazyRoute><Regularization /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketing" element={<ProtectedRoute><SidebarWrapper><LazyRoute><Marketing /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/store" element={<ProtectedRoute><SidebarWrapper><LazyRoute><Store /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/financial" element={<ProtectedRoute><SidebarWrapper><LazyRoute><Financial /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/mentorship" element={<ProtectedRoute><SidebarWrapper><LazyRoute><Mentorship /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/systems" element={<ProtectedRoute><SidebarWrapper><LazyRoute><Systems /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><AdminPanel /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/access-matrix" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><AccessMatrix /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/certificates" element={<ProtectedRoute><SidebarWrapper><LazyRoute><Certificates /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/license-payments" element={<ProtectedRoute><SidebarWrapper><LazyRoute><LicensePayments /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute><SidebarWrapper><LazyRoute><UserMonitoring /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/system-metrics" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><SystemMetrics /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/sentinel" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><SystemSentinel /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/announcements" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><AnnouncementsAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/banners" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><BannersAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/module-overrides" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><ModuleOverridesAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/referrals" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><ReferralsAdmin /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/event-logs" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><EventLogs /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/code-assistant" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><CodeAssistantPage /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/surgery-schedule" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><SurgerySchedule /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/licensee-onboarding" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><LicenseeOnboardingPage /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/admin/sales-urgency" element={<AdminRoute><AdminSidebarWrapper><LazyRoute><SalesUrgencyPage /></LazyRoute></AdminSidebarWrapper></AdminRoute>} />
      <Route path="/weekly-reports" element={<ProtectedRoute><SidebarWrapper><LazyRoute><WeeklyReports /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/sala-tecnica" element={<ProtectedRoute><SidebarWrapper><LazyRoute><SalaTecnica /></LazyRoute></SidebarWrapper></ProtectedRoute>} />
      <Route path="/consolidated-results" element={<ProtectedRoute><SidebarWrapper><LazyRoute><ConsolidatedResults /></LazyRoute></SidebarWrapper></ProtectedRoute>} />

      {/* ====================================
          IPROMED - Instituto de Proteção Médica
          ==================================== */}
      <Route path="/ipromed" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedHome /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/dashboard" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedDashboard /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/students" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedStudents /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/exams" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedExams /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/mentors" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedMentors /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/surveys" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedSurveys /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/leads" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedLeads /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/clients" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedClients /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/clients/:id" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedClientDetail /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/journey" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedJourney /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/sales-funnel" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedSalesFunnel /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/contracts" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedContracts /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/contracts/:id" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedContractDetail /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/legal" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedLegalHub /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/university" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedUniversity /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/financial" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedFinancial /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/push-juridico" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedPushJuridico /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/logs" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedActivityLogs /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      <Route path="/ipromed/tasks" element={<ProfileGuard allowedProfiles={['ipromed', 'administrador']}><IpromedLayoutWrapper><LazyRoute><IpromedTasks /></LazyRoute></IpromedLayoutWrapper></ProfileGuard>} />
      
{/* ====================================
          Vision - Diagnóstico Capilar IA
          ==================================== */}
      <Route path="/vision" element={<ProtectedRoute><LazyRoute><VisionHome /></LazyRoute></ProtectedRoute>} />
      <Route path="/vision/*" element={<ProtectedRoute><LazyRoute><VisionHome /></LazyRoute></ProtectedRoute>} />
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

      {/* ====================================
          NeoHair - Tratamento Capilar
          ==================================== */}
      <Route path="/neohair-landing" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairLanding /></Suspense>} />
      <Route path="/neohair" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairHome /></NeoHairSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neohair/avaliacao" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairEvaluation /></NeoHairSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neohair/loja" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairStore /></NeoHairSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neohair/profissional" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairProfessionalDashboard /></NeoHairSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neohair/admin" element={<AdminRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairAdminDashboard /></NeoHairSidebar></Suspense></AdminRoute>} />
      <Route path="/neohair/*" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoHairSidebar><NeoHairHome /></NeoHairSidebar></Suspense></ProtectedRoute>} />

      {/* ====================================
          Flow.do - Gestão Operacional (Work OS)
          ==================================== */}
      <Route path="/flow" element={<ProtectedRoute><LazyRoute><FlowPortal /></LazyRoute></ProtectedRoute>}>
        <Route index element={<FlowDashboard />} />
        <Route path="projects" element={<FlowProjects />} />
        <Route path="projects/:projectId" element={<FlowProjectDetail />} />
        <Route path="my-tasks" element={<PlaceholderPage title="Minhas Tarefas" />} />
        <Route path="calendar" element={<PlaceholderPage title="Calendário" />} />
        <Route path="workflows" element={<PlaceholderPage title="Automações" />} />
        <Route path="settings" element={<PlaceholderPage title="Configurações" />} />
      </Route>

      {/* ====================================
          NeoCRM - CRM de Vendas
          ==================================== */}
      <Route path="/neocrm" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoCrmSidebar><NeoCrmDashboard /></NeoCrmSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neocrm/pipeline" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoCrmSidebar><NeoCrmPipeline /></NeoCrmSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neocrm/inbox" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoCrmSidebar><NeoCrmInbox /></NeoCrmSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neocrm/tasks" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoCrmSidebar><NeoCrmTasks /></NeoCrmSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neocrm/leads" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoCrmSidebar><NeoCrmLeads /></NeoCrmSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neocrm/analytics" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoCrmSidebar><NeoCrmAnalytics /></NeoCrmSidebar></Suspense></ProtectedRoute>} />
      <Route path="/neocrm/settings" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NeoCrmSidebar><NeoCrmSettings /></NeoCrmSidebar></Suspense></ProtectedRoute>} />
      
      {/* ====================================
          Marketplace
          ==================================== */}
      <Route path="/marketplace" element={<ProtectedRoute><SidebarWrapper><MarketplaceHome /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketplace/professionals" element={<ProtectedRoute><SidebarWrapper><MarketplaceProfessionals /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketplace/units" element={<ProtectedRoute><SidebarWrapper><MarketplaceUnits /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketplace/leads" element={<ProtectedRoute><SidebarWrapper><MarketplaceLeads /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketplace/schedule" element={<ProtectedRoute><SidebarWrapper><MarketplaceSchedule /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketplace/reviews" element={<ProtectedRoute><SidebarWrapper><MarketplaceReviews /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketplace/campaigns" element={<ProtectedRoute><SidebarWrapper><MarketplaceCampaigns /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketplace/dashboard" element={<ProtectedRoute><SidebarWrapper><MarketplaceDashboard /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketplace/discovery" element={<ProtectedRoute><SidebarWrapper><MarketplaceDiscovery /></SidebarWrapper></ProtectedRoute>} />

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
