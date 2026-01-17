import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { SupportButton } from "@/components/SupportButton";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminHome from "./pages/AdminHome";
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
import NotFound from "./pages/NotFound";

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
            {isAdmin ? <AdminHome /> : <LicenseeHome />}
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/home" 
        element={
          <ProtectedRoute>
            <LicenseeHome />
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppWithSupport() {
  const { user } = useAuth();
  
  return (
    <>
      <AppRoutes />
      {user && <SupportButton />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);

export default App;
