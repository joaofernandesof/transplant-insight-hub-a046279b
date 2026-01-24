import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalAuthProvider, usePortalAuth } from './contexts/PortalAuthContext';
import { PortalSidebar } from './components/PortalSidebar';
import PortalLanding from './pages/PortalLanding';
import PortalRegister from './pages/PortalRegister';
import PortalHome from './pages/PortalHome';
import PortalSettings from './pages/PortalSettings';
import InventoryDashboard from './pages/dashboards/InventoryDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MyAppointments from './pages/MyAppointments';
import NewAppointment from './pages/NewAppointment';
import AuthDiagnostic from './pages/AuthDiagnostic';
import PlaceholderPage from './pages/PlaceholderPage';
import { Loader2 } from 'lucide-react';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = usePortalAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <PortalSidebar>{children}</PortalSidebar>;
}

function PortalRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="landing" element={<PortalLanding />} />
      <Route path="login" element={<Navigate to="/login" replace />} />
      <Route path="register" element={<PortalRegister />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="auth-diagnostic" element={<AuthDiagnostic />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><PortalHome /></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute><PortalSettings /></ProtectedRoute>} />
      
      {/* Appointments */}
      <Route path="appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
      <Route path="appointments/new" element={<ProtectedRoute><NewAppointment /></ProtectedRoute>} />
      <Route path="schedule" element={<ProtectedRoute><PlaceholderPage title="Agenda" /></ProtectedRoute>} />
      <Route path="waiting-room" element={<ProtectedRoute><PlaceholderPage title="Sala de Espera" /></ProtectedRoute>} />
      <Route path="rooms" element={<ProtectedRoute><PlaceholderPage title="Salas" /></ProtectedRoute>} />

      {/* Patient */}
      <Route path="my-records" element={<ProtectedRoute><PlaceholderPage title="Meus Documentos" /></ProtectedRoute>} />
      <Route path="orientations" element={<ProtectedRoute><PlaceholderPage title="Orientações" /></ProtectedRoute>} />
      <Route path="news" element={<ProtectedRoute><PlaceholderPage title="Notícias" /></ProtectedRoute>} />

      {/* Medical */}
      <Route path="patients" element={<ProtectedRoute><PlaceholderPage title="Pacientes" /></ProtectedRoute>} />
      <Route path="medical-records" element={<ProtectedRoute><PlaceholderPage title="Prontuários" /></ProtectedRoute>} />
      <Route path="templates" element={<ProtectedRoute><PlaceholderPage title="Modelos" /></ProtectedRoute>} />
      <Route path="teleconsultation" element={<ProtectedRoute><PlaceholderPage title="Teleconsulta" /></ProtectedRoute>} />

      {/* Financial */}
      <Route path="invoices" element={<ProtectedRoute><PlaceholderPage title="Faturas" /></ProtectedRoute>} />
      <Route path="payments" element={<ProtectedRoute><PlaceholderPage title="Pagamentos" /></ProtectedRoute>} />
      <Route path="reports/financial" element={<ProtectedRoute><PlaceholderPage title="Relatórios Financeiros" /></ProtectedRoute>} />

      {/* Inventory */}
      <Route path="inventory" element={<ProtectedRoute><InventoryDashboard /></ProtectedRoute>} />
      <Route path="inventory/items" element={<ProtectedRoute><PlaceholderPage title="Itens de Estoque" /></ProtectedRoute>} />
      <Route path="inventory/movements" element={<ProtectedRoute><PlaceholderPage title="Movimentações" /></ProtectedRoute>} />
      <Route path="inventory/suppliers" element={<ProtectedRoute><PlaceholderPage title="Fornecedores" /></ProtectedRoute>} />

      {/* Communication */}
      <Route path="whatsapp" element={<ProtectedRoute><PlaceholderPage title="WhatsApp" /></ProtectedRoute>} />
      <Route path="campaigns" element={<ProtectedRoute><PlaceholderPage title="Campanhas" /></ProtectedRoute>} />

      {/* Surveys */}
      <Route path="nps" element={<ProtectedRoute><PlaceholderPage title="NPS" /></ProtectedRoute>} />
      <Route path="surveys" element={<ProtectedRoute><PlaceholderPage title="Pesquisas" /></ProtectedRoute>} />

      {/* Reports */}
      <Route path="reports" element={<ProtectedRoute><PlaceholderPage title="Relatórios" /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="admin/users" element={<ProtectedRoute><PlaceholderPage title="Usuários" /></ProtectedRoute>} />
      <Route path="admin/settings" element={<ProtectedRoute><PlaceholderPage title="Configurações" /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/portal" replace />} />
    </Routes>
  );
}

export default function PortalApp() {
  return (
    <PortalAuthProvider>
      <PortalRoutes />
    </PortalAuthProvider>
  );
}
