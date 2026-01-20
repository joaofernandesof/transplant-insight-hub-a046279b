import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ClinicAuthProvider, useClinicAuth } from './contexts/ClinicAuthContext';
import { ClinicSidebar } from './components/ClinicSidebar';
import ClinicLogin from './pages/ClinicLogin';
import ClinicDashboard from './pages/ClinicDashboard';
import RegisterPatient from './pages/RegisterPatient';
import NewSale from './pages/NewSale';
import ClinicSchedule from './pages/ClinicSchedule';
import NoDateQueue from './pages/NoDateQueue';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useClinicAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/clinic/login" replace />;
  }

  return <ClinicSidebar>{children}</ClinicSidebar>;
}

function ClinicRoutes() {
  return (
    <Routes>
      <Route path="login" element={<ClinicLogin />} />
      <Route path="/" element={<ProtectedRoute><ClinicDashboard /></ProtectedRoute>} />
      <Route path="paciente" element={<ProtectedRoute><RegisterPatient /></ProtectedRoute>} />
      <Route path="nova-venda" element={<ProtectedRoute><NewSale /></ProtectedRoute>} />
      <Route path="agenda" element={<ProtectedRoute><ClinicSchedule /></ProtectedRoute>} />
      <Route path="sem-data" element={<ProtectedRoute><NoDateQueue /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/clinic" replace />} />
    </Routes>
  );
}

export default function ClinicApp() {
  return (
    <ClinicAuthProvider>
      <ClinicRoutes />
    </ClinicAuthProvider>
  );
}
