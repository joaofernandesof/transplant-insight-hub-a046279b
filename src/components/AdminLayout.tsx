import { UnifiedSidebar } from "@/components/UnifiedSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <UnifiedSidebar>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </UnifiedSidebar>
  );
}
