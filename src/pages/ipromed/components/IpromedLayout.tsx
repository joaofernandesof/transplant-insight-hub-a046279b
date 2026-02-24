/**
 * CPG Advocacia Médica Layout - Layout dedicado com Sidebar Astrea
 * Wrapper para todas as páginas do portal jurídico
 */

import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AstreaStyleSidebar from "./AstreaStyleSidebar";
import IpromedGlobalSearch from "./IpromedGlobalSearch";
import IpromedGuidedTour from "./IpromedGuidedTour";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Scale, 
  HelpCircle, 
  UserPlus, 
  FileSignature, 
  CheckSquare,
  Calendar,
  FolderPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIpromedOnboarding } from "@/hooks/useIpromedOnboarding";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IpromedLayoutProps {
  children: ReactNode;
}

export default function IpromedLayout({ children }: IpromedLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { showTour, completeTour, startTour } = useIpromedOnboarding();

  // Quick actions for header
  const quickActions = [
    { icon: UserPlus, label: "Novo Cliente", route: "/cpg/clients?new=1" },
    { icon: FileSignature, label: "Novo Contrato", route: "/cpg/contracts?new=1" },
    { icon: FolderPlus, label: "Novo Processo", route: "/cpg/legal?tab=cases&new=1" },
    { icon: CheckSquare, label: "Nova Tarefa", route: "/cpg/legal?tab=tasks&new=1" },
    { icon: Calendar, label: "Agendar Reunião", route: "/cpg/legal?tab=agenda&new=1" },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Mobile layout with header like NeoPay
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-primary/90 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Scale className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">CPG Advocacia Médica</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div data-tour="global-search">
              <IpromedGlobalSearch isCollapsed />
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
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        
        {/* Guided Tour */}
        <IpromedGuidedTour isOpen={showTour} onComplete={completeTour} />
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
      
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isCollapsed ? "lg:ml-16" : "lg:ml-60"
      )}>
        {/* Top Bar with Global Search and Quick Actions */}
        <header className="sticky top-0 z-40 h-14 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center justify-between h-full px-4 gap-4">
            {/* Search */}
            <div data-tour="global-search" className="flex-1 max-w-md">
              <IpromedGlobalSearch />
            </div>
            
            {/* Quick Actions */}
            <div className="hidden md:flex items-center gap-1">
              <TooltipProvider delayDuration={200}>
                {quickActions.map((action) => (
                  <Tooltip key={action.label}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(action.route)}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <action.icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{action.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                
                <div className="w-px h-6 bg-border mx-1" />
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startTour}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Iniciar tour guiado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Mobile: only help */}
            <div className="flex md:hidden items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startTour}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Iniciar tour guiado</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Guided Tour */}
      <IpromedGuidedTour isOpen={showTour} onComplete={completeTour} />
    </div>
  );
}
