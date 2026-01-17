import { ModuleLayout } from "@/components/ModuleLayout";
import { UpsellSection } from "@/components/UpsellSection";
import { Building2 } from "lucide-react";

export default function EstruturaNeo() {
  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Estrutura NEO
          </h1>
          <p className="text-sm text-muted-foreground">
            Eleve os níveis da sua clínica com a nossa estrutura
          </p>
        </div>

        {/* Upsell Cards */}
        <UpsellSection />
      </div>
    </ModuleLayout>
  );
}
