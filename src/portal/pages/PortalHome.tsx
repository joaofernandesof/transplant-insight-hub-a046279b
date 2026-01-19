import React from 'react';
import { usePortalAuth } from '../contexts/PortalAuthContext';
import PatientDashboard from './dashboards/PatientDashboard';
import DoctorDashboard from './dashboards/DoctorDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import FinancialDashboard from './dashboards/FinancialDashboard';
import ReceptionDashboard from './dashboards/ReceptionDashboard';
import InventoryDashboard from './dashboards/InventoryDashboard';
import { Loader2 } from 'lucide-react';

export default function PortalHome() {
  const { user, isLoading } = usePortalAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Route to appropriate dashboard based on primary role
  switch (user?.primaryRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'financial':
      return <FinancialDashboard />;
    case 'reception':
      return <ReceptionDashboard />;
    case 'inventory':
      return <InventoryDashboard />;
    case 'patient':
    default:
      return <PatientDashboard />;
  }
}
