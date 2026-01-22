import { UnifiedSidebar } from "@/components/UnifiedSidebar";
import { GlobalBreadcrumb } from "@/components/GlobalBreadcrumb";

interface ModuleLayoutProps {
  children: React.ReactNode;
  /** Ocultar breadcrumb */
  hideBreadcrumb?: boolean;
}

export function ModuleLayout({ children, hideBreadcrumb = false }: ModuleLayoutProps) {
  return (
    <UnifiedSidebar>
      <div className="min-h-screen bg-background">
        {!hideBreadcrumb && (
          <div className="p-4 lg:p-6 pb-0 lg:pb-0">
            <GlobalBreadcrumb />
          </div>
        )}
        {children}
      </div>
    </UnifiedSidebar>
  );
}
