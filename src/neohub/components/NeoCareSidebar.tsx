import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Calendar, FileText, BookOpen, Newspaper,
  Settings, LogOut, Heart, User,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useNeoHubAuth } from '../contexts/NeoHubAuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NeoCareSidebarProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: 'Início', path: '/neocare' },
  { icon: Calendar, label: 'Meus Agendamentos', path: '/neocare/appointments' },
  { icon: FileText, label: 'Meus Documentos', path: '/neocare/my-records' },
  { icon: BookOpen, label: 'Orientações', path: '/neocare/orientations' },
  { icon: Newspaper, label: 'Notícias', path: '/neocare/news' },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout, hasProfile } = useNeoHubAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchProfile = () => {
    navigate('/select-profile');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const hasMultipleProfiles = user && user.profiles.length > 1;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--neocare-primary))] flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-[hsl(var(--neocare-primary))]">Portal Neo Folic</span>
            <p className="text-xs text-muted-foreground">Clínica de Transplante Capilar</p>
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
              end={item.path === '/neocare'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-[hsl(var(--neocare-primary-light))] text-[hsl(var(--neocare-primary))] font-medium"
                    : "text-muted-foreground hover:bg-[hsl(var(--neocare-primary-light))] hover:text-[hsl(var(--neocare-primary))]"
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
        {/* User info */}
        <div className="flex items-center gap-3 py-2">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground truncate">{user?.fullName}</span>
        </div>
        
        {/* Settings */}
        <NavLink
          to="/neocare/settings"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-[hsl(var(--neocare-primary-light))] text-[hsl(var(--neocare-primary))] font-medium"
                : "text-muted-foreground hover:bg-muted"
            )
          }
        >
          <Settings className="h-4 w-4" />
          Configurações
        </NavLink>
        
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-950 w-full"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}

export function NeoCareSidebar({ children }: NeoCareSidebarProps) {
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
            className="fixed top-4 left-4 z-40 lg:hidden border-[hsl(var(--neocare-primary))]"
          >
            <Heart className="h-5 w-5 text-[hsl(var(--neocare-primary))]" />
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
