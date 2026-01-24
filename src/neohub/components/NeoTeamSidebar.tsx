import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Home, Calendar, Clock, Users, FileText,
  Settings, LogOut, Menu, X, ChevronLeft,
  Bell, Folder, Stethoscope, BarChart3, CheckSquare,
  UserCog, Building2, ChevronDown, ChevronRight,
  List, Ticket, CalendarDays, Images, ClipboardList, Shield
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NeoTeamSidebarProps {
  children: React.ReactNode;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  route: string;
  adminOnly?: boolean;
  doctorOnly?: boolean;
  postvendaOnly?: boolean;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { id: 'home', title: 'Início', icon: Home, route: '/neoteam' },
  { id: 'schedule', title: 'Agenda', icon: Calendar, route: '/neoteam/schedule' },
  { id: 'waiting-room', title: 'Sala de Espera', icon: Clock, route: '/neoteam/waiting-room' },
  { id: 'doctor-view', title: 'Visão do Médico', icon: Stethoscope, route: '/neoteam/doctor-view', doctorOnly: true },
  { id: 'tasks', title: 'Tarefas', icon: CheckSquare, route: '/neoteam/tasks' },
  { id: 'events', title: 'Organização de Eventos', icon: CalendarDays, route: '/neoteam/events' },
  { id: 'galleries', title: 'Galerias de Fotos', icon: Images, route: '/neoteam/galleries' },
  { id: 'patients', title: 'Pacientes', icon: Users, route: '/neoteam/patients' },
  { id: 'anamnesis', title: 'Anamnese', icon: ClipboardList, route: '/neoteam/anamnesis' },
  { id: 'medical-records', title: 'Prontuários', icon: FileText, route: '/neoteam/medical-records' },
  { id: 'documents', title: 'Documentos', icon: Folder, route: '/neoteam/documents' },
  { 
    id: 'postvenda', 
    title: 'Pós-Venda', 
    icon: Ticket, 
    route: '/neoteam/postvenda', 
    postvendaOnly: true,
    children: [
      { id: 'postvenda-dashboard', title: 'Dashboard', icon: BarChart3, route: '/neoteam/postvenda' },
      { id: 'postvenda-chamados', title: 'Chamados', icon: List, route: '/neoteam/postvenda/chamados' },
      { id: 'postvenda-sla', title: 'Config. SLA', icon: Clock, route: '/neoteam/postvenda/sla' },
    ]
  },
  { id: 'staff-roles', title: 'Cargos & Funções', icon: UserCog, route: '/neoteam/staff-roles', adminOnly: true },
  { id: 'settings', title: 'Configurações', icon: Settings, route: '/neoteam/settings' },
];

export function NeoTeamSidebar({ children }: NeoTeamSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout, isAdmin, activeProfile } = useUnifiedAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter menu items based on profile and admin status
  const isDoctor = activeProfile === 'medico';
  
  // TODO: Check if user has postvenda role (for now, show for admin and colaborador)
  const hasPostvendaAccess = isAdmin || activeProfile === 'colaborador';
  
  const filteredMenuItems = menuItems.filter(item => {
    // Admin-only items
    if (item.adminOnly && !isAdmin) return false;
    // Doctor-only items - show for medico and administrador profiles
    if (item.doctorOnly && !isDoctor && !isAdmin) return false;
    // Postvenda items - show for users with postvenda access
    if ((item as any).postvendaOnly && !hasPostvendaAccess) return false;
    return true;
  });

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
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      activeProfile === 'medico' 
                        ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    )}
                  >
                    {activeProfile === 'medico' ? 'Médico' : 
                     activeProfile === 'administrador' ? 'Administrador' : 'Colaborador'}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 p-2">
            <nav className="space-y-1">
              {/* Admin Home Button */}
              {isAdmin && (
                <Button
                  variant={location.pathname === '/admin-dashboard' ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11 mb-2",
                    isCollapsed && "justify-center px-2",
                    location.pathname === '/admin-dashboard' 
                      ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                      : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                  )}
                  onClick={() => navigate('/admin-dashboard')}
                >
                  <Shield className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="flex-1 text-left">Início Admin</span>}
                </Button>
              )}
              
              {filteredMenuItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isItemActive = isActive(item.route);
                const isChildActive = hasChildren && item.children?.some(child => isActive(child.route));
                const showExpanded = isChildActive || location.pathname.startsWith(item.route);

                if (hasChildren && !isCollapsed) {
                  return (
                    <Collapsible key={item.id} defaultOpen={showExpanded}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant={isItemActive || isChildActive ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 h-11",
                            (isItemActive || isChildActive) && "bg-primary/10 text-primary"
                          )}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="flex-1 text-left">{item.title}</span>
                          <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4 space-y-1 mt-1">
                        {item.children?.map((child) => (
                          <Button
                            key={child.id}
                            variant={isActive(child.route) ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start gap-3 h-10 text-sm",
                              isActive(child.route) && "bg-primary/10 text-primary"
                            )}
                            onClick={() => navigate(child.route)}
                          >
                            <child.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 text-left">{child.title}</span>
                          </Button>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }

                return (
                  <Button
                    key={item.id}
                    variant={isItemActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-11",
                      isCollapsed && "justify-center px-2",
                      isItemActive && "bg-primary/10 text-primary"
                    )}
                    onClick={() => navigate(item.route)}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 text-left">{item.title}</span>
                    )}
                  </Button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Clinic Branding */}
          <div className={cn(
            "px-3 py-4 border-t",
            isCollapsed && "flex justify-center"
          )}>
            <div className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50",
              isCollapsed && "px-0 justify-center"
            )}>
              {user?.clinicLogoUrl ? (
                <img 
                  src={user.clinicLogoUrl} 
                  alt="Logo da Clínica"
                  className="h-8 w-8 rounded-md object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              )}
              {!isCollapsed && (
                <span className="text-sm font-medium text-muted-foreground truncate">
                  {user?.clinicName || 'Clínica Ativa'}
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10",
                isCollapsed && "justify-center px-2"
              )}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>Sair</span>}
            </Button>
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
