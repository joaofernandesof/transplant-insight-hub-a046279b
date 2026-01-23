// ====================================
// App.tsx - Entry Point Único
// ====================================
// Arquitetura unificada NeoHub com um único AuthProvider

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { UnifiedAuthProvider, useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { DataProvider } from "@/contexts/DataContext";
import SupportChat from "@/components/SupportChat";
import { UnifiedSidebar } from "@/components/UnifiedSidebar";
import { useUserPresence } from "@/hooks/useUserPresence";
import { queryClient } from "@/lib/queryClient";
import { ProtectedRoute, ProfileGuard, AdminRoute } from "@/components/guards";
import { PROFILE_ROUTES, getDefaultRouteForProfile } from "@/neohub/lib/permissions";
import { Loader2 } from "lucide-react";

// ====================================
// Pages - Públicas
// ====================================
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ReferralLanding from "./pages/ReferralLanding";
import ApiDocs from "./pages/ApiDocs";

// ====================================
// Pages - Admin/Licenciado (Legado)
// ====================================
import Dashboard from "./pages/Dashboard";
import AdminHome from "./pages/AdminHome";
import AdminDashboard from "./pages/AdminDashboard";
import ClinicComparison from "./pages/ClinicComparison";
import LicenseeHome from "./pages/LicenseeHome";
import LicenseesPanel from "./pages/LicenseesPanel";
import University from "./pages/University";
import Regularization from "./pages/Regularization";
import Materials from "./pages/Materials";
import Marketing from "./pages/Marketing";
import Store from "./pages/Store";
import Financial from "./pages/Financial";
import Mentorship from "./pages/Mentorship";
import Systems from "./pages/Systems";
import Career from "./pages/Career";
import HotLeads from "./pages/HotLeads";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import Certificates from "./pages/Certificates";
import Partners from "./pages/Partners";
import LicensePayments from "./pages/LicensePayments";
import EstruturaNeo from "./pages/EstruturaNeo";
import ReferralProgram from "./pages/ReferralProgram";
import Achievements from "./pages/Achievements";
import UserMonitoring from "./pages/UserMonitoring";
import SystemMetrics from "./pages/SystemMetrics";
import SystemSentinel from "./pages/admin/SystemSentinel";
import WeeklyReports from "./pages/WeeklyReports";
import SurgerySchedule from "./pages/SurgerySchedule";
import SalaTecnica from "./pages/SalaTecnica";
import ConsolidatedResults from "./pages/ConsolidatedResults";
import ExamsList from "./pages/ExamsList";
import ExamTaking from "./pages/ExamTaking";
import ExamResults from "./pages/ExamResults";
import ExamsAdmin from "./pages/ExamsAdmin";
import AccessMatrix from "./pages/AccessMatrix";
import AnnouncementsAdmin from "./pages/AnnouncementsAdmin";
import BannersAdmin from "./pages/BannersAdmin";

// ====================================
// Pages - NeoCare (Portal do Paciente)
// ====================================
import { NeoCareSidebar } from "./neohub/components/NeoCareSidebar";
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
import { NeoTeamSidebar } from "./neohub/components/NeoTeamSidebar";
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
  NeoTeamStaffRoles
} from "./neohub/pages/neoteam";

// ====================================
// Pages - ProfileSelector
// ====================================
import ProfileSelector from "./neohub/pages/ProfileSelector";

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
import { PostVendaSidebar } from "./postvenda/components";

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

  // Fallback para admins - redirecionar para dashboard
  if (isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <SidebarWrapper><LicenseeHome /></SidebarWrapper>;
}

// ====================================
// NeoCare Routes (Portal do Paciente)
// ====================================
function NeoCareRoutes() {
  return (
    <ProfileGuard allowedProfiles={['paciente', 'administrador']}>
      <NeoCareSidebar>
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
      </NeoCareSidebar>
    </ProfileGuard>
  );
}

// ====================================
// NeoTeam Routes (Portal do Colaborador)
// ====================================
function NeoTeamRoutes() {
  return (
    <ProfileGuard allowedProfiles={['colaborador', 'medico', 'administrador']}>
      <NeoTeamSidebar>
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
          <Route path="postvenda" element={<PostVendaHome />} />
          <Route path="postvenda/chamados" element={<ChamadoListPage />} />
          <Route path="postvenda/chamados/:id" element={<ChamadoDetailPage />} />
          <Route path="postvenda/sla" element={<PostVendaSlaPage />} />
          <Route path="postvenda/nps" element={<PostVendaNpsPage />} />
          <Route path="staff-roles" element={<NeoTeamStaffRoles />} />
          <Route path="settings" element={<NeoTeamSettings />} />
          <Route path="*" element={<Navigate to="/neoteam" replace />} />
        </Routes>
      </NeoTeamSidebar>
    </ProfileGuard>
  );
}

// ====================================
// Academy Routes (Portal do Aluno - IBRAMEC)
// ====================================
import { 
  AcademySidebar, 
  AcademyHome, 
  AcademyCourses, 
  AcademyCertificates, 
  AcademyExams,
  AcademySchedule
} from './academy';

function AcademyRoutes() {
  return (
    <ProfileGuard allowedProfiles={['aluno', 'administrador']}>
      <AcademySidebar>
        <Routes>
          <Route index element={<AcademyHome />} />
          <Route path="courses" element={<AcademyCourses />} />
          <Route path="schedule" element={<AcademySchedule />} />
          <Route path="materials" element={<Materials />} />
          <Route path="exams" element={<AcademyExams />} />
          <Route path="exams/:examId/take" element={<ExamTaking />} />
          <Route path="exams/:examId/results/:attemptId" element={<ExamResults />} />
          <Route path="certificates" element={<AcademyCertificates />} />
          <Route path="community" element={<PlaceholderPage title="Comunidade IBRAMEC" />} />
          <Route path="career" element={<PlaceholderPage title="Plano de Carreira" />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/academy" replace />} />
        </Routes>
      </AcademySidebar>
    </ProfileGuard>
  );
}

// ====================================
// NeoLicense Routes (Portal do Licenciado)
// ====================================
function NeoLicenseRoutes() {
  const { activeProfile } = useUnifiedAuth();
  
  // Admin acessando /neolicense é redirecionado para o dashboard
  if (activeProfile === 'administrador') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  return (
    <ProfileGuard allowedProfiles={['licenciado']}>
      <SidebarWrapper>
        <Routes>
          <Route index element={<LicenseeHome />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="university" element={<University />} />
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
      </SidebarWrapper>
    </ProfileGuard>
  );
}

// ====================================
// Avivar Routes (Portal Cliente Avivar)
// ====================================
function AvivarRoutes() {
  return (
    <ProfileGuard allowedProfiles={['cliente_avivar', 'administrador']}>
      <SidebarWrapper>
        <Routes>
          <Route index element={<PlaceholderPage title="Avivar - Marketing & Crescimento" />} />
          <Route path="dashboard" element={<PlaceholderPage title="Dashboard Marketing" />} />
          <Route path="hotleads" element={<HotLeads />} />
          <Route path="traffic" element={<PlaceholderPage title="Indicadores de Tráfego" />} />
          <Route path="marketing" element={<PlaceholderPage title="Central de Marketing" />} />
          <Route path="mentorship" element={<PlaceholderPage title="Mentoria Avivar" />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/avivar" replace />} />
        </Routes>
      </SidebarWrapper>
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
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/indicacao/:code" element={<ReferralLanding />} />
      <Route path="/api-docs" element={<ApiDocs />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/neocare-landing" element={<NeoCareLanding />} />
      <Route path="/neocare-protect" element={<NeoCareProductLanding />} />

      {/* ====================================
          Home - Roteamento dinâmico por perfil
          ==================================== */}
      <Route path="/" element={<HomeRouter />} />
      <Route 
        path="/select-profile" 
        element={
          <ProtectedRoute>
            <ProfileSelector />
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
          Rotas Legadas (compatibilidade)
          ==================================== */}
      <Route path="/home" element={<ProtectedRoute><SidebarWrapper><LicenseeHome /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/admin-dashboard" element={<ProtectedRoute><SidebarWrapper><AdminDashboard /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><SidebarWrapper><Dashboard /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/licensees" element={<ProtectedRoute><SidebarWrapper><LicenseesPanel /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/comparison" element={<ProtectedRoute><SidebarWrapper><ClinicComparison /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/university" element={<ProtectedRoute><SidebarWrapper><University /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/university/exams" element={<ProtectedRoute><SidebarWrapper><ExamsList /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/university/exams/:examId/take" element={<ProtectedRoute><SidebarWrapper><ExamTaking /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/university/exams/:examId/results/:attemptId" element={<ProtectedRoute><SidebarWrapper><ExamResults /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/university/exams/admin" element={<ProtectedRoute><SidebarWrapper><ExamsAdmin /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/regularization" element={<ProtectedRoute><SidebarWrapper><Regularization /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/materials" element={<ProtectedRoute><SidebarWrapper><Materials /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/marketing" element={<ProtectedRoute><SidebarWrapper><Marketing /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/store" element={<ProtectedRoute><SidebarWrapper><Store /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/financial" element={<ProtectedRoute><SidebarWrapper><Financial /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/mentorship" element={<ProtectedRoute><SidebarWrapper><Mentorship /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/systems" element={<ProtectedRoute><SidebarWrapper><Systems /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/career" element={<ProtectedRoute><SidebarWrapper><Career /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/hotleads" element={<ProtectedRoute><SidebarWrapper><HotLeads /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><SidebarWrapper><Community /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><SidebarWrapper><Profile /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><SidebarWrapper><AdminPanel /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/access-matrix" element={<ProtectedRoute><SidebarWrapper><AccessMatrix /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/certificates" element={<ProtectedRoute><SidebarWrapper><Certificates /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><SidebarWrapper><Achievements /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/partners" element={<ProtectedRoute><SidebarWrapper><Partners /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/license-payments" element={<ProtectedRoute><SidebarWrapper><LicensePayments /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/estrutura-neo" element={<ProtectedRoute><SidebarWrapper><EstruturaNeo /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/indique-e-ganhe" element={<ProtectedRoute><SidebarWrapper><ReferralProgram /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute><SidebarWrapper><UserMonitoring /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/system-metrics" element={<ProtectedRoute><SidebarWrapper><SystemMetrics /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/admin/sentinel" element={<AdminRoute><SidebarWrapper><SystemSentinel /></SidebarWrapper></AdminRoute>} />
      <Route path="/admin/announcements" element={<AdminRoute><SidebarWrapper><AnnouncementsAdmin /></SidebarWrapper></AdminRoute>} />
      <Route path="/admin/banners" element={<AdminRoute><SidebarWrapper><BannersAdmin /></SidebarWrapper></AdminRoute>} />
      <Route path="/weekly-reports" element={<ProtectedRoute><SidebarWrapper><WeeklyReports /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/surgery-schedule" element={<ProtectedRoute><SidebarWrapper><SurgerySchedule /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/sala-tecnica" element={<ProtectedRoute><SidebarWrapper><SalaTecnica /></SidebarWrapper></ProtectedRoute>} />
      <Route path="/consolidated-results" element={<ProtectedRoute><SidebarWrapper><ConsolidatedResults /></SidebarWrapper></ProtectedRoute>} />

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
// App with Support
// ====================================
function AppWithSupport() {
  const { user } = useUnifiedAuth();
  
  return (
    <>
      <AppRoutes />
      {user && <PresenceTracker />}
      {user && <SupportChat />}
    </>
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
