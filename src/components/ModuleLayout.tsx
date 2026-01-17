import { ModuleSidebar } from "@/components/ModuleSidebar";

interface ModuleLayoutProps {
  children: React.ReactNode;
}

export function ModuleLayout({ children }: ModuleLayoutProps) {
  return (
    <ModuleSidebar>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ModuleSidebar>
  );
}
