import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import SupportChat from "@/components/SupportChat";
import { ModuleSidebar } from "@/components/ModuleSidebar";
import { useUserPresence } from "@/hooks/useUserPresence";
import Login from "./pages/Login";
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
import ReferralLanding from "./pages/ReferralLanding";
import Achievements from "./pages/Achievements";
import UserMonitoring from "./pages/UserMonitoring";
import WeeklyReports from "./pages/WeeklyReports";
import SurgerySchedule from "./pages/SurgerySchedule";
import ConsolidatedResults from "./pages/ConsolidatedResults";
import ApiDocs from "./pages/ApiDocs";
import NotFound from "./pages/NotFound";
import PortalApp from "./portal/PortalApp";
import { MarketplaceHome } from "./marketplace/pages/MarketplaceHome";
import { MarketplaceProfessionals } from "./marketplace/pages/MarketplaceProfessionals";
import { MarketplaceUnits } from "./marketplace/pages/MarketplaceUnits";
import { MarketplaceLeads } from "./marketplace/pages/MarketplaceLeads";
import { MarketplaceSchedule } from "./marketplace/pages/MarketplaceSchedule";
import { MarketplaceReviews } from "./marketplace/pages/MarketplaceReviews";
import { MarketplaceCampaigns } from "./marketplace/pages/MarketplaceCampaigns";
import { MarketplaceDashboard } from "./marketplace/pages/MarketplaceDashboard";
import { MarketplaceDiscovery } from "./marketplace/pages/MarketplaceDiscovery";

// Wrapper para páginas do licenciado com sidebar
function LicenseeSidebarWrapper({ children }: { children: React.ReactNode }) {
  return <ModuleSidebar>{children}</ModuleSidebar>;
}

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            {isAdmin ? <AdminHome /> : (
              <LicenseeSidebarWrapper>
                <LicenseeHome />
              </LicenseeSidebarWrapper>
            )}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <LicenseeSidebarWrapper>
              <LicenseeHome />
            </LicenseeSidebarWrapper>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/licensees" 
        element={
          <ProtectedRoute>
            <LicenseesPanel />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/comparison" 
        element={
          <ProtectedRoute>
            <ClinicComparison />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/university" 
        element={
          <ProtectedRoute>
            <University />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/regularization" 
        element={
          <ProtectedRoute>
            <Regularization />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/materials" 
        element={
          <ProtectedRoute>
            <Materials />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/marketing" 
        element={
          <ProtectedRoute>
            <Marketing />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/store" 
        element={
          <ProtectedRoute>
            <Store />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/financial" 
        element={
          <ProtectedRoute>
            <Financial />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/mentorship" 
        element={
          <ProtectedRoute>
            <Mentorship />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/systems" 
        element={
          <ProtectedRoute>
            <Systems />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/career" 
        element={
          <ProtectedRoute>
            <Career />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/hotleads" 
        element={
          <ProtectedRoute>
            <HotLeads />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/community" 
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/certificates" 
        element={
          <ProtectedRoute>
            <Certificates />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/achievements" 
        element={
          <ProtectedRoute>
            <Achievements />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/partners" 
        element={
          <ProtectedRoute>
            <Partners />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/license-payments" 
        element={
          <ProtectedRoute>
            <LicensePayments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/estrutura-neo" 
        element={
          <ProtectedRoute>
            <EstruturaNeo />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/indique-e-ganhe" 
        element={
          <ProtectedRoute>
            <ReferralProgram />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/monitoring" 
        element={
          <ProtectedRoute>
            <UserMonitoring />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/weekly-reports" 
        element={
          <ProtectedRoute>
            <WeeklyReports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/surgery-schedule" 
        element={
          <ProtectedRoute>
            <SurgerySchedule />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/consolidated-results" 
        element={
          <ProtectedRoute>
            <ConsolidatedResults />
          </ProtectedRoute>
        } 
      />
      {/* Public referral landing page */}
      <Route 
        path="/indicacao/:code" 
        element={<ReferralLanding />}
      />
      {/* Public API Documentation */}
      <Route 
        path="/api-docs" 
        element={<ApiDocs />}
      />
      {/* Marketplace Neo Folic */}
      <Route path="/marketplace" element={<ProtectedRoute><MarketplaceHome /></ProtectedRoute>} />
      <Route path="/marketplace/professionals" element={<ProtectedRoute><MarketplaceProfessionals /></ProtectedRoute>} />
      <Route path="/marketplace/units" element={<ProtectedRoute><MarketplaceUnits /></ProtectedRoute>} />
      <Route path="/marketplace/leads" element={<ProtectedRoute><MarketplaceLeads /></ProtectedRoute>} />
      <Route path="/marketplace/schedule" element={<ProtectedRoute><MarketplaceSchedule /></ProtectedRoute>} />
      <Route path="/marketplace/reviews" element={<ProtectedRoute><MarketplaceReviews /></ProtectedRoute>} />
      <Route path="/marketplace/campaigns" element={<ProtectedRoute><MarketplaceCampaigns /></ProtectedRoute>} />
      <Route path="/marketplace/dashboard" element={<ProtectedRoute><MarketplaceDashboard /></ProtectedRoute>} />
      <Route path="/marketplace/discovery" element={<ProtectedRoute><MarketplaceDiscovery /></ProtectedRoute>} />
      {/* Portal Neo Folic - Sistema Médico Separado */}
      <Route 
        path="/portal/*" 
        element={<PortalApp />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Component to track user presence
function PresenceTracker() {
  useUserPresence();
  return null;
}

function AppWithSupport() {
  const { user } = useAuth();
  
  return (
    <>
      <AppRoutes />
      {user && <PresenceTracker />}
      {user && <SupportChat />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppWithSupport />
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
