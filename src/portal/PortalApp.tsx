import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PortalAuthProvider, usePortalAuth } from './contexts/PortalAuthContext';
import { PortalSidebar } from './components/PortalSidebar';
import PortalLanding from './pages/PortalLanding';
import PortalLogin from './pages/PortalLogin';
import PortalRegister from './pages/PortalRegister';
import PortalHome from './pages/PortalHome';
import PortalSettings from './pages/PortalSettings';
import { Loader2 } from 'lucide-react';

// Placeholder component for pages not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">Esta página está em desenvolvimento.</p>
    </div>
  );
}

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
    return <Navigate to="/portal/login" replace />;
  }

  return <PortalSidebar>{children}</PortalSidebar>;
}

function PortalRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="landing" element={<PortalLanding />} />
      <Route path="login" element={<PortalLogin />} />
      <Route path="register" element={<PortalRegister />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><PortalHome /></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute><PortalSettings /></ProtectedRoute>} />
      
      {/* Scheduling */}
      <Route path="appointments" element={<ProtectedRoute><PlaceholderPage title="Meus Agendamentos" /></ProtectedRoute>} />
      <Route path="appointments/new" element={<ProtectedRoute><PlaceholderPage title="Novo Agendamento" /></ProtectedRoute>} />
      <Route path="schedule" element={<ProtectedRoute><PlaceholderPage title="Agenda" /></ProtectedRoute>} />
      <Route path="waiting-room" element={<ProtectedRoute><PlaceholderPage title="Sala de Espera" /></ProtectedRoute>} />
      <Route path="rooms" element={<ProtectedRoute><PlaceholderPage title="Salas" /></ProtectedRoute>} />

      {/* Medical */}
      <Route path="my-records" element={<ProtectedRoute><PlaceholderPage title="Meus Documentos" /></ProtectedRoute>} />
      <Route path="patients" element={<ProtectedRoute><PlaceholderPage title="Pacientes" /></ProtectedRoute>} />
      <Route path="medical-records" element={<ProtectedRoute><PlaceholderPage title="Prontuários" /></ProtectedRoute>} />
      <Route path="templates" element={<ProtectedRoute><PlaceholderPage title="Modelos" /></ProtectedRoute>} />

      {/* Teleconsultation */}
      <Route path="teleconsultation" element={<ProtectedRoute><PlaceholderPage title="Teleconsulta" /></ProtectedRoute>} />

      {/* Financial */}
      <Route path="my-invoices" element={<ProtectedRoute><PlaceholderPage title="Minhas Faturas" /></ProtectedRoute>} />
      <Route path="invoices" element={<ProtectedRoute><PlaceholderPage title="Faturas" /></ProtectedRoute>} />
      <Route path="payments" element={<ProtectedRoute><PlaceholderPage title="Pagamentos" /></ProtectedRoute>} />
      <Route path="cash-flow" element={<ProtectedRoute><PlaceholderPage title="Fluxo de Caixa" /></ProtectedRoute>} />
      <Route path="accounts" element={<ProtectedRoute><PlaceholderPage title="Contas" /></ProtectedRoute>} />

      {/* Inventory */}
      <Route path="inventory/items" element={<ProtectedRoute><PlaceholderPage title="Itens de Estoque" /></ProtectedRoute>} />
      <Route path="inventory/movements" element={<ProtectedRoute><PlaceholderPage title="Movimentações" /></ProtectedRoute>} />
      <Route path="inventory/suppliers" element={<ProtectedRoute><PlaceholderPage title="Fornecedores" /></ProtectedRoute>} />

      {/* Communication */}
      <Route path="whatsapp" element={<ProtectedRoute><PlaceholderPage title="WhatsApp" /></ProtectedRoute>} />
      <Route path="campaigns" element={<ProtectedRoute><PlaceholderPage title="Campanhas" /></ProtectedRoute>} />
      <Route path="automations" element={<ProtectedRoute><PlaceholderPage title="Automações" /></ProtectedRoute>} />

      {/* Surveys */}
      <Route path="nps" element={<ProtectedRoute><PlaceholderPage title="NPS" /></ProtectedRoute>} />
      <Route path="surveys" element={<ProtectedRoute><PlaceholderPage title="Pesquisas" /></ProtectedRoute>} />

      {/* Reports */}
      <Route path="reports" element={<ProtectedRoute><PlaceholderPage title="Relatórios" /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="admin/users" element={<ProtectedRoute><PlaceholderPage title="Usuários" /></ProtectedRoute>} />
      <Route path="admin/doctors" element={<ProtectedRoute><PlaceholderPage title="Médicos" /></ProtectedRoute>} />
      <Route path="admin/audit" element={<ProtectedRoute><PlaceholderPage title="Auditoria" /></ProtectedRoute>} />
      <Route path="admin/lgpd" element={<ProtectedRoute><PlaceholderPage title="LGPD" /></ProtectedRoute>} />
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
