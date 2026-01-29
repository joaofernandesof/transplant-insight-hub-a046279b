import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth, ProfileKey, PROFILE_NAMES, PROFILE_ROUTES } from '@/contexts/UnifiedAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Heart, 
  Briefcase, 
  GraduationCap, 
  User, 
  LogOut, 
  Building2, 
  TrendingUp, 
  Stethoscope,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { VisionIcon } from '@/components/icons/VisionIcon';
import iconeNeofolic from '@/assets/icone-neofolic.png';
import { ThemeToggle } from '@/components/ThemeToggle';

// Portal configuration with icons, colors and routes
const PORTAL_CONFIG: Record<string, {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  bgColor: string;
  profiles: ProfileKey[];
  route: string;
}> = {
  academy: {
    title: 'Portal do Aluno',
    description: 'Cursos, certificados e materiais educacionais',
    icon: GraduationCap,
    gradient: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    profiles: ['aluno'],
    route: '/academy',
  },
  neolicense: {
    title: 'Portal do Licenciado',
    description: 'Dashboard da sua Licença ByNeoFolic',
    icon: Building2,
    gradient: 'from-amber-400 to-yellow-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    profiles: ['licenciado'],
    route: '/home',
  },
  neocare: {
    title: 'Portal do Paciente',
    description: 'Agendamentos, documentos e acompanhamento',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    profiles: ['paciente'],
    route: '/neocare',
  },
  neoteam: {
    title: 'Portal do Colaborador',
    description: 'Operações, tarefas e gestão de pacientes',
    icon: Briefcase,
    gradient: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    profiles: ['colaborador'],
    route: '/neoteam',
  },
  medico: {
    title: 'Portal do Médico',
    description: 'Prontuários, agenda médica e cirurgias',
    icon: Stethoscope,
    gradient: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    profiles: ['medico'],
    route: '/neoteam/doctor-view',
  },
  avivar: {
    title: 'Portal Avivar',
    description: 'Marketing, leads e crescimento',
    icon: Sparkles,
    gradient: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    profiles: ['cliente_avivar'],
    route: '/avivar',
  },
  vision: {
    title: 'Vision',
    description: 'Análise capilar com IA',
    icon: VisionIcon,
    gradient: 'from-pink-500 via-rose-500 to-orange-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    profiles: ['medico', 'colaborador'],
    route: '/vision',
  },
};

export default function PortalSelector() {
  const navigate = useNavigate();
  const { user, isLoading, setActiveProfile, logout } = useUnifiedAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (!isLoading && user?.isAdmin) {
      navigate('/admin-dashboard');
    }
  }, [user, isLoading, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  const handleSelectPortal = (portalKey: string, profile: ProfileKey) => {
    setIsRedirecting(true);
    setActiveProfile(profile);
    const portal = PORTAL_CONFIG[portalKey];
    navigate(portal?.route || PROFILE_ROUTES[profile] || '/');
  };

  const handleLogout = async () => {
    // Primeiro deslogar, depois redirecionar após o estado ser limpo
    await logout();
    // Usar window.location para evitar race condition com React state
    window.location.href = '/login';
  };

  // Get available portals based on user profiles
  const getAvailablePortals = () => {
    if (!user?.profiles) return [];
    
    return Object.entries(PORTAL_CONFIG)
      .filter(([_, config]) => 
        config.profiles.some(profile => user.profiles.includes(profile))
      )
      .map(([key, config]) => ({
        key,
        ...config,
        // Get the first matching profile for this portal
        matchingProfile: config.profiles.find(p => user.profiles.includes(p)) || config.profiles[0],
      }));
  };

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-800 p-1 shadow-2xl animate-pulse overflow-hidden">
            <img src={iconeNeofolic} alt="NeoHub" className="w-full h-full object-cover rounded-full" />
          </div>
          <Skeleton className="h-6 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const availablePortals = getAvailablePortals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 p-0.5 shadow-lg overflow-hidden">
            <img src={iconeNeofolic} alt="NeoHub" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Neo<span className="bg-gradient-to-b from-[#D4AF61] via-[#C9A86C] to-[#8B7355] bg-clip-text text-transparent">Hub</span>
            </h1>
            <p className="text-xs text-slate-400">Ecossistema Integrado</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300 hover:text-white hover:bg-slate-700">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* User greeting */}
        <div className="text-center mb-8">
          <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-primary/20">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-white mb-1">
            Olá, {user.fullName?.split(' ')[0]}!
          </h2>
          <p className="text-slate-400">
            Selecione o portal que deseja acessar
          </p>
        </div>

        {/* Portals Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePortals.map((portal) => {
            const Icon = portal.icon;
            return (
              <button
                key={portal.key}
                onClick={() => handleSelectPortal(portal.key, portal.matchingProfile)}
                className="group relative overflow-hidden rounded-2xl border-2 border-slate-700 hover:border-primary/50 transition-all duration-300 text-left bg-slate-800/50 backdrop-blur hover:bg-slate-800/80"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${portal.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className="p-5 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${portal.gradient} text-white shadow-lg`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                        {portal.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                        {portal.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {availablePortals.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              Nenhum portal disponível para seu perfil.
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Entre em contato com o administrador.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NeoHub by NeoFolic. Todos os direitos reservados.
      </footer>
    </div>
  );
}
