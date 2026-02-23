import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth, ProfileKey, PROFILE_ROUTES } from '@/contexts/UnifiedAuthContext';
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
  Sparkles,
  Shield,
  Lock,
  Flame,
  CreditCard,
  Scale
} from 'lucide-react';
import { VisionIcon } from '@/components/icons/VisionIcon';
import iconeNeofolic from '@/assets/icone-neofolic.png';
import { NeoHubIcon } from '@/components/icons/NeoHubIcon';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

// Portal configuration with icons, colors and routes
interface PortalConfig {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  bgColor: string;
  profiles: ProfileKey[];
  route: string;
  portalKey: string; // Chave usada em allowed_portals
  adminOnly?: boolean;
}

const PORTAL_CONFIG: Record<string, PortalConfig> = {
  admin: {
    title: 'Administrador',
    description: 'Gestão do ecossistema NeoHub',
    icon: Shield,
    gradient: 'from-slate-800 to-slate-900',
    bgColor: 'bg-slate-100 dark:bg-slate-900/50',
    profiles: ['administrador'],
    route: '/admin-portal',
    portalKey: 'admin',
    adminOnly: true,
  },
  academy: {
    title: 'Portal do Aluno',
    description: 'Cursos, certificados e materiais educacionais',
    icon: GraduationCap,
    gradient: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    profiles: ['aluno'],
    route: '/academy',
    portalKey: 'academy',
  },
  neolicense: {
    title: 'Portal do Licenciado',
    description: 'Dashboard da sua Licença ByNeoFolic',
    icon: Building2,
    gradient: 'from-amber-400 to-yellow-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    profiles: ['licenciado'],
    route: '/home',
    portalKey: 'neolicense',
  },
  hotleads: {
    title: 'HotLeads',
    description: 'Marketplace de leads quentes',
    icon: Flame,
    gradient: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    profiles: ['licenciado'],
    route: '/hotleads',
    portalKey: 'hotleads',
  },
  neocare: {
    title: 'Portal do Paciente',
    description: 'Agendamentos, documentos e acompanhamento',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    profiles: ['paciente'],
    route: '/neocare',
    portalKey: 'neocare',
  },
  neoteam: {
    title: 'Portal do Colaborador',
    description: 'Operações, tarefas e gestão de pacientes',
    icon: Briefcase,
    gradient: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    profiles: ['colaborador'],
    route: '/neoteam',
    portalKey: 'neoteam',
  },
  medico: {
    title: 'Portal do Médico',
    description: 'Prontuários, agenda médica e cirurgias',
    icon: Stethoscope,
    gradient: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    profiles: ['medico'],
    route: '/neoteam/doctor-view',
    portalKey: 'medico',
  },
  avivar: {
    title: 'Portal Avivar',
    description: 'Marketing, leads e crescimento',
    icon: Sparkles,
    gradient: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    profiles: ['cliente_avivar'],
    route: '/avivar',
    portalKey: 'avivar',
  },
  vision: {
    title: 'Vision',
    description: 'Análise capilar com IA',
    icon: VisionIcon,
    gradient: 'from-pink-500 via-rose-500 to-orange-500',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    profiles: ['medico', 'colaborador'],
    route: '/vision',
    portalKey: 'vision',
  },
  neopay: {
    title: 'NeoPay',
    description: 'Gateway de pagamentos',
    icon: CreditCard,
    gradient: 'from-emerald-600 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    profiles: ['administrador'],
    route: '/neopay',
    portalKey: 'neopay',
  },
  ipromed: {
    title: 'IPROMED',
    description: 'Advocacia médica preventiva',
    icon: Scale,
    gradient: 'from-blue-600 to-indigo-700',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    profiles: ['ipromed'],
    route: '/ipromed',
    portalKey: 'ipromed',
  },
};

export default function PortalSelector() {
  const navigate = useNavigate();
  const { user, isLoading, setActiveProfile, logout } = useUnifiedAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

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
    await logout();
    window.location.href = '/login';
  };

  // Verificar se o usuário pode acessar um portal
  const canAccessPortal = (key: string, config: PortalConfig): boolean => {
    // Admin sempre tem acesso total
    if (user?.isAdmin) return true;
    // Portal admin somente para admins
    if (config.adminOnly) return false;

    // Combinar allowed_portals E perfis — qualquer um dos dois concede acesso
    const portals = user?.allowedPortals;
    const hasPortalAccess = portals && portals.length > 0 && portals.includes(config.portalKey);
    const hasProfileAccess = config.profiles.some(profile => user?.profiles?.includes(profile));

    return hasPortalAccess || hasProfileAccess;
  };

  // Obter todos os portais com status de acesso
  const getAllPortals = () => {
    if (!user) return [];
    
    const portals = Object.entries(PORTAL_CONFIG)
      // Ocultar portal admin para não-admins
      .filter(([key, config]) => {
        if (config.adminOnly && !user.isAdmin) return false;
        return true;
      })
      .map(([key, config]) => {
        const hasAccess = canAccessPortal(key, config);
        const matchingProfile = config.profiles.find(p => user.profiles.includes(p)) || config.profiles[0];
        return {
          key,
          ...config,
          matchingProfile,
          hasAccess,
        };
      });

    // Ordenar: acessíveis primeiro, depois bloqueados
    return portals.sort((a, b) => {
      if (a.hasAccess && !b.hasAccess) return -1;
      if (!a.hasAccess && b.hasAccess) return 1;
      return 0;
    });
  };

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 p-3 shadow-2xl animate-pulse flex items-center justify-center">
            <NeoHubIcon size={40} className="text-white" />
          </div>
          <Skeleton className="h-6 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const allPortals = getAllPortals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 p-2 shadow-lg flex items-center justify-center">
            <NeoHubIcon size={24} className="text-white" />
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
          {allPortals.map((portal) => {
            const Icon = portal.icon;
            const hasAccess = portal.hasAccess;

            return (
              <button
                key={portal.key}
                onClick={() => hasAccess && handleSelectPortal(portal.key, portal.matchingProfile)}
                disabled={!hasAccess}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 text-left backdrop-blur",
                  hasAccess 
                    ? "border-slate-700 hover:border-primary/50 bg-slate-800/50 hover:bg-slate-800/80 cursor-pointer"
                    : "border-slate-700/40 bg-slate-800/20 cursor-not-allowed"
                )}
              >
                {/* Lock overlay for inaccessible portals */}
                {!hasAccess && (
                  <div className="absolute top-3 right-3 z-20">
                    <div className="bg-slate-900/80 rounded-full p-1.5">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                )}

                {/* Gradient overlay on hover (only for accessible) */}
                {hasAccess && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${portal.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                )}
                
                <div className={cn(
                  "p-5 relative z-10",
                  !hasAccess && "opacity-50"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl text-white shadow-lg",
                      `bg-gradient-to-br ${portal.gradient}`
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "font-semibold transition-colors",
                        hasAccess ? "text-white group-hover:text-primary" : "text-slate-400"
                      )}>
                        {portal.title}
                      </h3>
                      <p className={cn(
                        "text-sm mt-1 line-clamp-2",
                        hasAccess ? "text-slate-400" : "text-slate-500"
                      )}>
                        {portal.description}
                      </p>
                    </div>
                    {hasAccess ? (
                      <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Hint for locked modules */}
        <p className="text-xs text-slate-500 text-center mt-6 flex items-center gap-1.5 justify-center">
          <Lock className="h-3 w-3" />
          Módulos com cadeado requerem permissão adicional
        </p>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NeoHub by NeoFolic. Todos os direitos reservados.
      </footer>
    </div>
  );
}