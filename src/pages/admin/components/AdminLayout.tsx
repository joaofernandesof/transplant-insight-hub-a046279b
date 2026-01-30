/**
 * AdminLayout - Layout dedicado do Portal Administrativo
 * Wrapper com sidebar própria para todas as páginas admin
 */

import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Menu, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (!isAdmin) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 border-slate-700 bg-slate-900">
                <div className="h-full">
                  <AdminSidebar 
                    collapsed={false}
                    onToggle={() => {}}
                    onMobileClose={() => setIsMobileOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-slate-950">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-b from-slate-900 to-slate-950">
      <AdminSidebar 
        collapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />
      
      <main className={cn(
        "flex-1 min-h-screen overflow-auto transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}
