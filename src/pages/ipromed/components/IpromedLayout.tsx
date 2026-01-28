/**
 * IPROMED Layout - Layout dedicado com Sidebar Astrea
 * Wrapper para todas as páginas do portal IPROMED
 */

import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AstreaStyleSidebar from "./AstreaStyleSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface IpromedLayoutProps {
  children: ReactNode;
}

export default function IpromedLayout({ children }: IpromedLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <AstreaStyleSidebar 
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />
      
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        isCollapsed ? "lg:ml-16" : "lg:ml-60"
      )}>
        {children}
      </main>
    </div>
  );
}
