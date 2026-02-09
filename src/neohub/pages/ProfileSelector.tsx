import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LogOut, 
  Shield, 
  Building2, 
  Stethoscope, 
  GraduationCap, 
  Heart,
  Users,
  TrendingUp,
  Lock,
  CreditCard,
  Flame
} from 'lucide-react';
import { VisionIcon } from '@/components/icons/VisionIcon';
import logoNeofolic from '@/assets/logo-byneofolic.png';
import { cn } from '@/lib/utils';

// Definição dos módulos do sistema
interface SystemModule {
  key: string;
  name: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  portalKey: string; // Chave usada em allowed_portals
  requiredProfiles: string[];
  adminOnly?: boolean;
}

const SYSTEM_MODULES: SystemModule[] = [
  {
    key: 'admin',
    name: 'Painel Admin',
    description: 'Gestão completa do sistema',
    icon: Shield,
    route: '/admin',
    color: 'bg-purple-500',
    portalKey: 'admin',
    requiredProfiles: [],
    adminOnly: true,
  },
  {
    key: 'academy',
    name: 'Academy IBRAMEC',
    description: 'Cursos, aulas e certificações',
    icon: GraduationCap,
    route: '/academy',
    color: 'bg-emerald-500',
    portalKey: 'academy',
    requiredProfiles: ['aluno', 'administrador'],
  },
  {
    key: 'neoteam',
    name: 'NeoTeam',
    description: 'Operações e gestão de equipe',
    icon: Building2,
    route: '/neoteam',
    color: 'bg-blue-500',
    portalKey: 'neoteam',
    requiredProfiles: ['colaborador', 'medico', 'licenciado', 'administrador'],
  },
  {
    key: 'neocare',
    name: 'NeoCare',
    description: 'Portal do paciente',
    icon: Heart,
    route: '/neocare',
    color: 'bg-rose-500',
    portalKey: 'neocare',
    requiredProfiles: ['paciente', 'administrador'],
  },
  {
    key: 'neolicense',
    name: 'NeoLicense',
    description: 'Portal do licenciado ByNeoFolic',
    icon: Users,
    route: '/home',
    color: 'bg-amber-500',
    portalKey: 'neolicense',
    requiredProfiles: ['licenciado', 'administrador'],
  },
  {
    key: 'hotleads',
    name: 'HotLeads',
    description: 'Marketplace de leads quentes',
    icon: Flame,
    route: '/neolicense/hotleads',
    color: 'bg-orange-500',
    portalKey: 'hotleads',
    requiredProfiles: ['licenciado', 'administrador'],
  },
  {
    key: 'neopay',
    name: 'NeoPay',
    description: 'Gateway de pagamentos',
    icon: CreditCard,
    route: '/neopay',
    color: 'bg-emerald-600',
    portalKey: 'neopay',
    requiredProfiles: ['administrador'],
  },
  {
    key: 'avivar',
    name: 'Avivar',
    description: 'Marketing e crescimento',
    icon: TrendingUp,
    route: '/avivar',
    color: 'bg-orange-500',
    portalKey: 'avivar',
    requiredProfiles: ['cliente_avivar', 'administrador'],
  },
  {
    key: 'vision',
    name: 'Vision',
    description: 'Análise capilar com IA',
    icon: VisionIcon,
    route: '/vision',
    color: 'bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500',
    portalKey: 'vision',
    requiredProfiles: ['medico', 'colaborador', 'administrador'],
  },
];

export default function ProfileSelector() {
  const navigate = useNavigate();
  const { user, logout, setActiveProfile } = useUnifiedAuth();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSelectModule = (module: SystemModule) => {
    if (module.adminOnly && user.isAdmin) {
      setActiveProfile('administrador');
      navigate(module.route);
      return;
    }

    // Encontrar o primeiro perfil que dá acesso ao módulo
    const matchingProfile = user.profiles.find(profile => 
      module.requiredProfiles.includes(profile)
    );

    if (matchingProfile) {
      setActiveProfile(matchingProfile);
    } else if (user.isAdmin) {
      setActiveProfile('administrador');
    }
    
    navigate(module.route);
  };

  const canAccessModule = (module: SystemModule): boolean => {
    // Admin sempre tem acesso total
    if (user.isAdmin) return true;
    if (module.adminOnly) return false;
    
    // Verificar allowed_portals - se o array existe e não está vazio, usar como filtro principal
    const portals = user.allowedPortals;
    if (portals && portals.length > 0) {
      return portals.includes(module.portalKey);
    }
    
    // Fallback: verificar por perfis (comportamento legado)
    return module.requiredProfiles.some(profile => user.profiles.includes(profile as any));
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Ordenar módulos: acessíveis primeiro, depois bloqueados
  const sortedModules = [...SYSTEM_MODULES].sort((a, b) => {
    const aAccess = canAccessModule(a);
    const bAccess = canAccessModule(b);
    if (aAccess && !bAccess) return -1;
    if (!aAccess && bAccess) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <img 
          src={logoNeofolic} 
          alt="NeoHub" 
          className="h-8 w-auto dark:invert"
        />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                  {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">Olá, {user.fullName.split(' ')[0]}!</CardTitle>
            <CardDescription>
              Selecione o módulo que deseja acessar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {sortedModules.map(module => {
                const Icon = module.icon;
                const hasAccess = canAccessModule(module);

                return (
                  <button
                    key={module.key}
                    onClick={() => hasAccess && handleSelectModule(module)}
                    disabled={!hasAccess}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center group relative",
                      hasAccess 
                        ? "border-border hover:border-primary hover:bg-muted/50 cursor-pointer"
                        : "border-border/50 cursor-not-allowed opacity-70"
                    )}
                  >
                    {/* Lock icon for inaccessible modules */}
                    {!hasAccess && (
                      <div className="absolute top-2 right-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}

                    <div className={cn(
                      "p-3 rounded-lg text-white transition-transform",
                      module.color,
                      hasAccess ? "group-hover:scale-110" : ""
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div>
                      <h3 className={cn(
                        "font-semibold text-sm",
                        hasAccess ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {module.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {module.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hint for locked modules */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              Módulos com <Lock className="h-3 w-3 inline-block mx-0.5" /> requerem permissão adicional
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NeoHub by NeoFolic. Todos os direitos reservados.
      </footer>
    </div>
  );
}