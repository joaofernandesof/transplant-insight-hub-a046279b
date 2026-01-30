/**
 * IPROMED Layout - Layout dedicado com Sidebar Astrea
 * Wrapper para todas as páginas do portal IPROMED
 */

import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AstreaStyleSidebar from "./AstreaStyleSidebar";
import { Button } from "@/components/ui/button";
import { Menu, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

  // Mobile layout with header like NeoPay
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Mobile Header - NeoPay style */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Scale className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">IPROMED</span>
          </div>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-primary/20">
              <AstreaStyleSidebar 
                isCollapsed={false}
                onToggle={() => {}}
                isMobileOpen={true}
                onMobileClose={() => setIsMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
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
