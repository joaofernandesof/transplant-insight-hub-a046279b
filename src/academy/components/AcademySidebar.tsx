import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, Award,
  Settings, LogOut, User, Users, CalendarDays, Menu, UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import ibramecLogo from '@/assets/ibramec-logo.png';
import ibramecLogoDark from '@/assets/ibramec-logo-white.png';

interface AcademySidebarProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: 'Início', path: '/academy' },
  { icon: BookOpen, label: 'Cursos', path: '/academy/courses' },
  { icon: CalendarDays, label: 'Agenda do Aluno', path: '/academy/schedule' },
  { icon: Award, label: 'Certificados', path: '/academy/certificates' },
  { icon: Users, label: 'Comunidade', path: '/academy/community' },
];

const adminItems = [
  { icon: UserCog, label: 'Gestão de Matrículas', path: '/academy/admin/enrollments' },
  { icon: Users, label: 'Alunos x Turmas', path: '/academy/admin/students' },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, activeProfile } = useUnifiedAuth();
  const isAdmin = activeProfile === 'administrador';
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchProfile = () => {
    navigate('/select-profile');
  };

  const hasMultipleProfiles = user && user.profiles.length > 1;
  const currentLogo = mounted && resolvedTheme === 'dark' ? ibramecLogoDark : ibramecLogo;

  return (
    <div className="flex flex-col h-full">
      {/* Header with IBRAMEC Logo */}
      <div className="p-4 border-b bg-gradient-to-r from-emerald-500/10 to-green-500/10">
        <div className="flex justify-center">
          <img 
            src={currentLogo} 
            alt="IBRAMEC - Instituto Brasileiro de Medicina Capilar" 
            className="h-8 object-contain"
          />
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-emerald-500">
            <AvatarImage src={user?.avatarUrl || ''} alt={user?.fullName || 'Aluno'} />
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AL'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user?.fullName || 'Aluno'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-2">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/academy'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-emerald-100 text-emerald-700 font-medium dark:bg-emerald-900/50 dark:text-emerald-300"
                    : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <Separator className="my-3" />
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </p>
              {adminItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                      isActive
                        ? "bg-amber-100 text-amber-700 font-medium dark:bg-amber-900/50 dark:text-amber-300"
                        : "text-muted-foreground hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/50 dark:hover:text-amber-400"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-2">
        {/* Settings */}
        <NavLink
          to="/academy/profile"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-emerald-100 text-emerald-700 font-medium dark:bg-emerald-900/50 dark:text-emerald-300"
                : "text-muted-foreground hover:bg-muted"
            )
          }
        >
          <Settings className="h-4 w-4" />
          Configurações
        </NavLink>

        {/* Switch Profile */}
        {hasMultipleProfiles && (
          <button
            onClick={handleSwitchProfile}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-muted w-full"
          >
            <User className="h-4 w-4" />
            Trocar Perfil
          </button>
        )}
        
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 w-full"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}

export function AcademySidebar({ children }: AcademySidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-40 lg:hidden border-emerald-500 bg-background"
          >
            <Menu className="h-5 w-5 text-emerald-600" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 w-full max-w-full overflow-x-hidden">
        <div className="min-h-screen w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
