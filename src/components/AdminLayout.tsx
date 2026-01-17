import { AdminSidebar } from "@/components/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminSidebar>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </AdminSidebar>
  );
}
