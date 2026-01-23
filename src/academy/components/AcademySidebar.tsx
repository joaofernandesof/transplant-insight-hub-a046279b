import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, Award, FileText, Trophy,
  Settings, LogOut, User, Users, TrendingUp, CalendarDays, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import ibramecLogo from '@/assets/ibramec-logo.png';
import ibramecLogoDark from '@/assets/ibramec-logo-white.png';
import ibramecIcon from '@/assets/ibramec-icon.png';

interface AcademySidebarProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: 'Início', path: '/academy' },
  { icon: BookOpen, label: 'Meus Cursos', path: '/academy/courses' },
  { icon: CalendarDays, label: 'Agenda do Aluno', path: '/academy/schedule' },
  { icon: FileText, label: 'Provas', path: '/academy/exams' },
  { icon: Award, label: 'Certificados', path: '/academy/certificates' },
  { icon: Users, label: 'Comunidade', path: '/academy/community' },
  { icon: TrendingUp, label: 'Carreira', path: '/academy/career' },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useUnifiedAuth();
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
        <div className="flex items-center gap-3">
          <img 
            src={ibramecIcon} 
            alt="IBRAMEC" 
            className="w-10 h-10 rounded-xl shadow-lg object-cover"
          />
          <div className="flex-1">
            <img 
              src={currentLogo} 
              alt="IBRAMEC - Instituto Brasileiro de Medicina Capilar" 
              className="h-6 object-contain"
            />
            <p className="text-xs text-muted-foreground mt-0.5">Portal do Aluno</p>
          </div>
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
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
              <Trophy className="h-3 w-3 mr-1" />
              Basic
            </Badge>
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
        </nav>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t space-y-3">
        {/* Theme Toggle */}
        <div className="flex items-center gap-3 py-2">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
        </div>
        
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
            <img src={ibramecIcon} alt="Menu" className="h-6 w-6 rounded object-cover" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
