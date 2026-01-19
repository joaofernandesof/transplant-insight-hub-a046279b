import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NeoHubAuthProvider, useNeoHubAuth } from './contexts/NeoHubAuthContext';
import { NeoHubLayout, ProfileGuard } from './components/NeoHubLayout';
import NeoHubLogin from './pages/NeoHubLogin';
import NeoHubRegister from './pages/NeoHubRegister';
import ProfileSelector from './pages/ProfileSelector';
import { Loader2 } from 'lucide-react';

// Import existing portal pages
import PortalHome from '@/portal/pages/PortalHome';
import PortalSettings from '@/portal/pages/PortalSettings';
import { PortalSidebar } from '@/portal/components/PortalSidebar';

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
    <ProfileGuard allowedProfiles={['paciente']}>
      <PortalSidebar>
        <Routes>
          <Route index element={<PortalHome />} />
          <Route path="settings" element={<PortalSettings />} />
          <Route path="appointments" element={<PlaceholderPage title="Meus Agendamentos" />} />
          <Route path="appointments/new" element={<PlaceholderPage title="Novo Agendamento" />} />
          <Route path="my-records" element={<PlaceholderPage title="Meus Documentos" />} />
          <Route path="my-invoices" element={<PlaceholderPage title="Minhas Faturas" />} />
          <Route path="teleconsultation" element={<PlaceholderPage title="Teleconsulta" />} />
          <Route path="*" element={<Navigate to="/neocare" replace />} />
        </Routes>
      </PortalSidebar>
    </ProfileGuard>
  );
}

// Wrapper para NeoTeam (Portal do Colaborador)
function NeoTeamRoutes() {
  return (
    <ProfileGuard allowedProfiles={['colaborador']}>
      <PortalSidebar>
        <Routes>
          <Route index element={<PortalHome />} />
          <Route path="settings" element={<PortalSettings />} />
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
          <Route path="*" element={<Navigate to="/neoteam" replace />} />
        </Routes>
      </PortalSidebar>
    </ProfileGuard>
  );
}

// Wrapper para Academy (Portal do Aluno)
function AcademyRoutes() {
  return (
    <ProfileGuard allowedProfiles={['aluno']}>
      <ModuleSidebar>
        <Routes>
          <Route index element={<PlaceholderPage title="Ibramed Academy" />} />
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
    <ProfileGuard allowedProfiles={['licenciado']}>
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<NeoHubLogin />} />
      <Route path="/register" element={<NeoHubRegister />} />
      
      {/* Seleção de perfil */}
      <Route path="/select-profile" element={
        user ? <ProfileSelector /> : <Navigate to="/login" replace />
      } />
      
      {/* Acesso negado */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Portais protegidos */}
      <Route path="/neocare/*" element={<NeoCareRoutes />} />
      <Route path="/neoteam/*" element={<NeoTeamRoutes />} />
      <Route path="/academy/*" element={<AcademyRoutes />} />
      <Route path="/neolicense/*" element={<NeoLicenseRoutes />} />

      {/* Rota raiz - redireciona baseado no estado */}
      <Route path="/" element={
        user ? (
          user.profiles.length === 1 
            ? <Navigate to={`/${user.profiles[0] === 'paciente' ? 'neocare' : 
                user.profiles[0] === 'colaborador' ? 'neoteam' :
                user.profiles[0] === 'aluno' ? 'academy' : 'neolicense'}`} replace />
            : <Navigate to="/select-profile" replace />
        ) : <Navigate to="/login" replace />
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function NeoHubApp() {
  return (
    <NeoHubAuthProvider>
      <NeoHubRoutes />
    </NeoHubAuthProvider>
  );
}
