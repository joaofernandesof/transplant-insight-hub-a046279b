/**
 * IPROMED Dashboard - Dashboard Jurídico Completo
 * Reutiliza o LegalModuleDashboard já existente
 */

import { LegalModuleDashboard } from "@/neohub/components/academy/LegalModuleDashboard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale } from "lucide-react";

export default function IpromedDashboard() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          IPROMED
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <span className="font-medium">Dashboard Jurídico</span>
        </div>
      </div>

      {/* Dashboard Component */}
      <LegalModuleDashboard />
    </div>
  );
}
