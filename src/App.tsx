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

  // Fallback para admins/licenciados legados
  if (isAdmin) {
    return <SidebarWrapper><AdminHome /></SidebarWrapper>;
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
          <Route path="medical-records" element={<NeoTeamMedicalRecords />} />
          <Route path="documents" element={<NeoTeamDocuments />} />
          <Route path="tasks" element={<NeoTeamTasks />} />
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
function AcademyRoutes() {
  return (
    <ProfileGuard allowedProfiles={['aluno', 'administrador']}>
      <SidebarWrapper>
        <Routes>
          <Route index element={<PlaceholderPage title="IBRAMEC - Portal do Aluno" />} />
          <Route path="courses" element={<University />} />
          <Route path="materials" element={<Materials />} />
          <Route path="certificates" element={<PlaceholderPage title="Certificados" />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/academy" replace />} />
        </Routes>
      </SidebarWrapper>
    </ProfileGuard>
  );
}

// ====================================
// NeoLicense Routes (Portal do Licenciado)
// ====================================
function NeoLicenseRoutes() {
  return (
    <ProfileGuard allowedProfiles={['licenciado', 'administrador']}>
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
      <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/licensees" element={<ProtectedRoute><LicenseesPanel /></ProtectedRoute>} />
      <Route path="/comparison" element={<ProtectedRoute><ClinicComparison /></ProtectedRoute>} />
      <Route path="/university" element={<ProtectedRoute><University /></ProtectedRoute>} />
      <Route path="/university/exams" element={<ProtectedRoute><ExamsList /></ProtectedRoute>} />
      <Route path="/university/exams/:examId/take" element={<ProtectedRoute><ExamTaking /></ProtectedRoute>} />
      <Route path="/university/exams/:examId/results/:attemptId" element={<ProtectedRoute><ExamResults /></ProtectedRoute>} />
      <Route path="/university/exams/admin" element={<ProtectedRoute><ExamsAdmin /></ProtectedRoute>} />
      <Route path="/regularization" element={<ProtectedRoute><Regularization /></ProtectedRoute>} />
      <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
      <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
      <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
      <Route path="/financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
      <Route path="/mentorship" element={<ProtectedRoute><Mentorship /></ProtectedRoute>} />
      <Route path="/systems" element={<ProtectedRoute><Systems /></ProtectedRoute>} />
      <Route path="/career" element={<ProtectedRoute><Career /></ProtectedRoute>} />
      <Route path="/hotleads" element={<ProtectedRoute><HotLeads /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="/access-matrix" element={<ProtectedRoute><AccessMatrix /></ProtectedRoute>} />
      <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
      <Route path="/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
      <Route path="/license-payments" element={<ProtectedRoute><LicensePayments /></ProtectedRoute>} />
      <Route path="/estrutura-neo" element={<ProtectedRoute><EstruturaNeo /></ProtectedRoute>} />
      <Route path="/indique-e-ganhe" element={<ProtectedRoute><ReferralProgram /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute><UserMonitoring /></ProtectedRoute>} />
      <Route path="/system-metrics" element={<ProtectedRoute><SystemMetrics /></ProtectedRoute>} />
      <Route path="/admin/sentinel" element={<AdminRoute><SystemSentinel /></AdminRoute>} />
      <Route path="/weekly-reports" element={<ProtectedRoute><WeeklyReports /></ProtectedRoute>} />
      <Route path="/surgery-schedule" element={<ProtectedRoute><SurgerySchedule /></ProtectedRoute>} />
      <Route path="/sala-tecnica" element={<ProtectedRoute><SalaTecnica /></ProtectedRoute>} />
      <Route path="/consolidated-results" element={<ProtectedRoute><ConsolidatedResults /></ProtectedRoute>} />

      {/* ====================================
          Marketplace
          ==================================== */}
      <Route path="/marketplace" element={<ProtectedRoute><MarketplaceHome /></ProtectedRoute>} />
      <Route path="/marketplace/professionals" element={<ProtectedRoute><MarketplaceProfessionals /></ProtectedRoute>} />
      <Route path="/marketplace/units" element={<ProtectedRoute><MarketplaceUnits /></ProtectedRoute>} />
      <Route path="/marketplace/leads" element={<ProtectedRoute><MarketplaceLeads /></ProtectedRoute>} />
      <Route path="/marketplace/schedule" element={<ProtectedRoute><MarketplaceSchedule /></ProtectedRoute>} />
      <Route path="/marketplace/reviews" element={<ProtectedRoute><MarketplaceReviews /></ProtectedRoute>} />
      <Route path="/marketplace/campaigns" element={<ProtectedRoute><MarketplaceCampaigns /></ProtectedRoute>} />
      <Route path="/marketplace/dashboard" element={<ProtectedRoute><MarketplaceDashboard /></ProtectedRoute>} />
      <Route path="/marketplace/discovery" element={<ProtectedRoute><MarketplaceDiscovery /></ProtectedRoute>} />

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
