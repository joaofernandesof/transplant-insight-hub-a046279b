import { UnifiedSidebar } from "@/components/UnifiedSidebar";

interface ModuleLayoutProps {
  children: React.ReactNode;
}

export function ModuleLayout({ children }: ModuleLayoutProps) {
  return (
    <UnifiedSidebar>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </UnifiedSidebar>
  );
}
