import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { NeoHubAuthProvider, useNeoHubAuth } from './contexts/NeoHubAuthContext';
import { NeoHubLayout, ProfileGuard } from './components/NeoHubLayout';

import NeoHubRegister from './pages/NeoHubRegister';
import ProfileSelector from './pages/ProfileSelector';
import { Loader2 } from 'lucide-react';

// NeoCare (Portal do Paciente) pages
import { NeoCareSidebar } from './components/NeoCareSidebar';
import { NeoCareHome, NeoCareAppointments, NeoCareNewAppointment, NeoCareSettings, NeoCareDocuments, NeoCareOrientations } from './pages/neocare';

// Import existing licensee pages
import LicenseeHome from '@/pages/LicenseeHome';
import Dashboard from '@/pages/Dashboard';
import University from '@/pages/University';
import Materials from '@/pages/Materials';
import Partners from '@/pages/Partners';
import SurgerySchedule from '@/pages/SurgerySchedule';
import Achievements from '@/pages/Achievements';
import ReferralProgram from '@/pages/ReferralProgram';
import EstruturaNeo from '@/pages/EstruturaNeo';
import Profile from '@/pages/Profile';
import HotLeads from '@/pages/HotLeads';
import Career from '@/pages/Career';
import Community from '@/pages/Community';
import { ModuleSidebar } from '@/components/ModuleSidebar';

// Placeholder para páginas em desenvolvimento
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">Esta página está em desenvolvimento.</p>
    </div>
  );
}

// Wrapper para NeoCare (Portal do Paciente)
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

// Wrapper para NeoTeam (Portal do Colaborador)
function NeoTeamRoutes() {
  return (
    <ProfileGuard allowedProfiles={['colaborador', 'administrador']}>
      <ModuleSidebar>
        <Routes>
          <Route index element={<PlaceholderPage title="NeoTeam - Portal do Colaborador" />} />
          <Route path="schedule" element={<PlaceholderPage title="Agenda" />} />
          <Route path="waiting-room" element={<PlaceholderPage title="Sala de Espera" />} />
          <Route path="patients" element={<PlaceholderPage title="Pacientes" />} />
          <Route path="medical-records" element={<PlaceholderPage title="Prontuários" />} />
          <Route path="invoices" element={<PlaceholderPage title="Faturas" />} />
          <Route path="payments" element={<PlaceholderPage title="Pagamentos" />} />
          <Route path="inventory/*" element={<PlaceholderPage title="Estoque" />} />
          <Route path="whatsapp" element={<PlaceholderPage title="WhatsApp" />} />
          <Route path="campaigns" element={<PlaceholderPage title="Campanhas" />} />
          <Route path="nps" element={<PlaceholderPage title="NPS" />} />
          <Route path="reports" element={<PlaceholderPage title="Relatórios" />} />
          <Route path="settings" element={<PlaceholderPage title="Configurações" />} />
          <Route path="*" element={<Navigate to="/neoteam" replace />} />
        </Routes>
      </ModuleSidebar>
    </ProfileGuard>
  );
}

// Wrapper para Academy (Portal do Aluno - IBRAMEC)
function AcademyRoutes() {
  return (
    <ProfileGuard allowedProfiles={['aluno', 'administrador']}>
      <ModuleSidebar>
        <Routes>
          <Route index element={<PlaceholderPage title="IBRAMEC - Portal do Aluno" />} />
          <Route path="courses" element={<University />} />
          <Route path="materials" element={<Materials />} />
          <Route path="certificates" element={<PlaceholderPage title="Certificados" />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/academy" replace />} />
        </Routes>
      </ModuleSidebar>
    </ProfileGuard>
  );
}

// Wrapper para NeoLicense (Portal do Licenciado)
function NeoLicenseRoutes() {
  return (
    <ProfileGuard allowedProfiles={['licenciado', 'administrador']}>
      <ModuleSidebar>
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
      </ModuleSidebar>
    </ProfileGuard>
  );
}

// Wrapper para Avivar (Portal Cliente Avivar)
function AvivarRoutes() {
  return (
    <ProfileGuard allowedProfiles={['cliente_avivar', 'administrador']}>
      <ModuleSidebar>
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
      </ModuleSidebar>
    </ProfileGuard>
  );
}

// Página de acesso não autorizado
function UnauthorizedPage() {
  const { user, logout } = useNeoHubAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
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

function NeoHubRoutes() {
  const { isLoading, user } = useNeoHubAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determinar qual portal está sendo acessado baseado na URL atual
  const currentPath = location.pathname;
  
  // NeoCare routes
  if (currentPath.startsWith('/neocare')) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <NeoCareRoutes />;
  }
  
  // NeoTeam routes
  if (currentPath.startsWith('/neoteam')) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <NeoTeamRoutes />;
  }
  
  // Academy routes
  if (currentPath.startsWith('/academy')) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <AcademyRoutes />;
  }
  
  // NeoLicense routes
  if (currentPath.startsWith('/neolicense')) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <NeoLicenseRoutes />;
  }
  
  // Avivar routes
  if (currentPath.startsWith('/avivar')) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <AvivarRoutes />;
  }
  
  // Select profile route
  if (currentPath === '/select-profile') {
    return user ? <ProfileSelector /> : <Navigate to="/login" replace />;
  }

  // Default fallback
  return <Navigate to="/login" replace />;
}

export default function NeoHubApp() {
  return (
    <NeoHubAuthProvider>
      <NeoHubRoutes />
    </NeoHubAuthProvider>
  );
}
