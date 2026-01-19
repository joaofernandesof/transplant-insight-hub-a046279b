import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Calendar, FileText, Video, CreditCard, 
  Settings, LogOut, Heart, ArrowLeft, User,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useNeoHubAuth } from '../contexts/NeoHubAuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoNeofolic from '@/assets/logo-byneofolic.png';

interface NeoCareSidebarProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: 'Início', path: '/neocare' },
  { icon: Calendar, label: 'Meus Agendamentos', path: '/neocare/appointments' },
  { icon: FileText, label: 'Meus Documentos', path: '/neocare/my-records' },
  { icon: Video, label: 'Teleconsulta', path: '/neocare/teleconsultation' },
  { icon: CreditCard, label: 'Minhas Faturas', path: '/neocare/my-invoices' },
  { icon: Settings, label: 'Configurações', path: '/neocare/settings' },
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
          <img 
            src={logoNeofolic} 
            alt="NeoFolic" 
            className="h-8 w-auto dark:invert"
          />
          <div>
            <span className="font-bold text-primary">NeoCare</span>
            <p className="text-xs text-muted-foreground">Portal do Paciente</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>
              {user?.fullName ? getInitials(user.fullName) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
      <div className="p-4 border-t space-y-2">
        {hasMultipleProfiles && (
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleSwitchProfile}
          >
            <ChevronLeft className="h-4 w-4" />
            Trocar Perfil
          </Button>
        )}
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
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
            className="fixed top-4 left-4 z-40 lg:hidden"
          >
            <Heart className="h-5 w-5 text-primary" />
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
