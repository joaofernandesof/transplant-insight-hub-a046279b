import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Home, Calendar, Clock, Users, FileText,
  Settings, LogOut, Menu, X, ChevronLeft,
  Bell, Folder, Stethoscope
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { cn } from '@/lib/utils';

interface NeoTeamSidebarProps {
  children: React.ReactNode;
}

const menuItems = [
  { id: 'home', title: 'Início', icon: Home, route: '/neoteam' },
  { id: 'schedule', title: 'Agenda', icon: Calendar, route: '/neoteam/schedule' },
  { id: 'waiting-room', title: 'Sala de Espera', icon: Clock, route: '/neoteam/waiting-room' },
  { id: 'doctor-view', title: 'Visão do Médico', icon: Stethoscope, route: '/neoteam/doctor-view' },
  { id: 'patients', title: 'Pacientes', icon: Users, route: '/neoteam/patients' },
  { id: 'medical-records', title: 'Prontuários', icon: FileText, route: '/neoteam/medical-records' },
  { id: 'documents', title: 'Documentos', icon: Folder, route: '/neoteam/documents' },
  { id: 'settings', title: 'Configurações', icon: Settings, route: '/neoteam/settings' },
];

export function NeoTeamSidebar({ children }: NeoTeamSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useUnifiedAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (route: string) => {
    if (route === '/neoteam') {
      return location.pathname === '/neoteam';
    }
    return location.pathname.startsWith(route);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r z-40 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg">NeoTeam</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )} />
            </Button>
          </div>

          {/* User Info */}
          <div className={cn(
            "p-4 border-b",
            isCollapsed && "flex justify-center"
          )}>
            <div className={cn(
              "flex items-center gap-3",
              isCollapsed && "flex-col"
            )}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user?.fullName}</p>
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    Colaborador
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={isActive(item.route) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    isCollapsed && "justify-center px-2",
                    isActive(item.route) && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  )}
                  onClick={() => navigate(item.route)}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="flex-1 text-left">{item.title}</span>
                  )}
                </Button>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-2 border-t space-y-1">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
                isCollapsed && "justify-center px-2"
              )}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Sair</span>}
            </Button>
            
            {!isCollapsed && (
              <div className="flex justify-center pt-2">
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}
