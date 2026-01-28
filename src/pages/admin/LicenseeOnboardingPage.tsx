import { LicenseeOnboardingChecklist } from "@/neohub/components/LicenseeOnboardingChecklist";
import { GlobalBreadcrumb } from "@/components/GlobalBreadcrumb";

export default function LicenseeOnboardingPage() {
  return (
    <div className="p-4 lg:p-6 overflow-x-hidden w-full space-y-6">
      <GlobalBreadcrumb />
      
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Onboarding de Licenciados
        </h1>
        <p className="text-sm text-muted-foreground">
          Checklist completo para integração de novos licenciados ByNeoFolic
        </p>
      </div>
      
      <LicenseeOnboardingChecklist />
    </div>
  );
}
