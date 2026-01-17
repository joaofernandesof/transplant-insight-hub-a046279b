import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BarChart3, 
  FileCheck, 
  BookOpen, 
  Video, 
  LogOut, 
  Crown, 
  Award, 
  Star, 
  Trophy, 
  Gem, 
  Shield, 
  Sparkles,
  Palette,
  ShoppingBag,
  DollarSign,
  Users,
  Settings,
  Bell,
  TrendingUp,
  Flame,
  User
} from "lucide-react";
import logoByNeofolic from "@/assets/logo-byneofolic.png";

type LicenseeTier = 'basic' | 'pro' | 'expert' | 'master' | 'elite' | 'titan' | 'legacy';

interface TierInfo {
  name: string;
  threshold: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const tierConfig: Record<LicenseeTier, TierInfo> = {
  basic: {
    name: 'Basic',
    threshold: 'até 50 mil',
    description: 'Validar operação',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
    icon: <Shield className="h-6 w-6" />
  },
  pro: {
    name: 'Pro',
    threshold: '100 mil',
    description: 'Previsibilidade',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: <Star className="h-6 w-6" />
  },
  expert: {
    name: 'Expert',
    threshold: '200 mil',
    description: 'Escalar cirurgias',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    icon: <Award className="h-6 w-6" />
  },
  master: {
    name: 'Master',
    threshold: '500 mil',
    description: 'Equipe robusta',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: <Trophy className="h-6 w-6" />
  },
  elite: {
    name: 'Elite',
    threshold: '750 mil',
    description: 'Referência regional',
    color: 'text-rose-700',
    bgColor: 'bg-rose-100',
    borderColor: 'border-rose-300',
    icon: <Gem className="h-6 w-6" />
  },
  titan: {
    name: 'Titan',
    threshold: '1 milhão',
    description: 'Multiclínicas',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    icon: <Crown className="h-6 w-6" />
  },
  legacy: {
    name: 'Legacy',
    threshold: '2M+',
    description: 'Parte estratégica do Neo Group',
    color: 'text-primary',
    bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100',
    borderColor: 'border-amber-400',
    icon: <Sparkles className="h-6 w-6" />
  }
};

const getLicenseeTier = (userId: string): LicenseeTier => {
  const tierMap: Record<string, LicenseeTier> = {
    'clinic-1': 'pro',
    'clinic-2': 'expert',
    'clinic-3': 'master'
  };
  return tierMap[userId] || 'basic';
};

// Seções principais do portal
const mainSections = [
  {
    id: 'metrics',
    title: 'Dashboard de Métricas',
    description: 'KPIs semanais, funil de vendas e insights do mentor virtual',
    icon: BarChart3,
    route: '/dashboard',
    color: 'bg-primary hover:bg-primary/90',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary'
  },
  {
    id: 'university',
    title: 'Universidade ByNeofolic',
    description: 'Trilhas de capacitação, aulas gravadas e imersões',
    icon: Video,
    route: '/university',
    color: 'bg-purple-600 hover:bg-purple-700',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    id: 'regularization',
    title: 'Regularização da Clínica',
    description: 'Checklist de documentos, alvarás e compliance',
    icon: FileCheck,
    route: '/regularization',
    color: 'bg-emerald-600 hover:bg-emerald-700',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  {
    id: 'materials',
    title: 'Central de Materiais',
    description: 'POPs, protocolos, scripts, contratos e termos',
    icon: BookOpen,
    route: '/materials',
    color: 'bg-blue-600 hover:bg-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 'marketing',
    title: 'Central de Marketing',
    description: 'Templates, campanhas, banco de mídia e branding',
    icon: Palette,
    route: '/marketing',
    color: 'bg-pink-600 hover:bg-pink-700',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600'
  },
  {
    id: 'store',
    title: 'Loja Neo-Spa',
    description: 'Produtos com preço de custo e fornecedores parceiros',
    icon: ShoppingBag,
    route: '/store',
    color: 'bg-orange-600 hover:bg-orange-700',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  {
    id: 'financial',
    title: 'Gestão Financeira',
    description: 'Metas comerciais, dashboards e orientações',
    icon: DollarSign,
    route: '/financial',
    color: 'bg-green-600 hover:bg-green-700',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    id: 'mentorship',
    title: 'Mentoria & Suporte',
    description: 'Consultorias, grupo exclusivo e comunidade',
    icon: Users,
    route: '/mentorship',
    color: 'bg-indigo-600 hover:bg-indigo-700',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  },
  {
    id: 'systems',
    title: 'Sistemas & Ferramentas',
    description: 'CRM, WhatsApp API, Feegow e robôs',
    icon: Settings,
    route: '/systems',
    color: 'bg-slate-600 hover:bg-slate-700',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600'
  },
  {
    id: 'career',
    title: 'Plano de Carreira',
    description: 'Roadmap, checklist de domínio e evolução',
    icon: TrendingUp,
    route: '/career',
    color: 'bg-amber-600 hover:bg-amber-700',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  },
  {
    id: 'hotleads',
    title: 'HotLeads',
    description: 'Leads qualificados para sua clínica',
    icon: Flame,
    route: '/hotleads',
    color: 'bg-red-600 hover:bg-red-700',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600'
  },
  {
    id: 'community',
    title: 'Comunidade',
    description: 'Conecte-se com outros licenciados',
    icon: Users,
    route: '/community',
    color: 'bg-cyan-600 hover:bg-cyan-700',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600'
  }
];

export default function LicenseeHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const tier = user ? getLicenseeTier(user.id) : 'basic';
  const tierInfo = tierConfig[tier];

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={logoByNeofolic} 
                alt="Licença ByNeofolic" 
                className="h-12 object-contain"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full text-[10px] flex items-center justify-center text-white">
                  3
                </span>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.clinicName}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section with Badge */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo ao Portal do Licenciado
          </h1>
          <p className="text-muted-foreground mb-6">
            {user?.name} • {user?.clinicName}
          </p>
          
          {/* Licensee Badge */}
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${tierInfo.bgColor} ${tierInfo.borderColor} ${tierInfo.color} shadow-sm`}>
            {tierInfo.icon}
            <div className="text-left">
              <p className="font-bold text-lg leading-tight">Nível {tierInfo.name}</p>
              <p className="text-xs opacity-80">{tierInfo.threshold} • {tierInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Menu Grid - 5 colunas em telas grandes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-12">
          {mainSections.map((section) => (
            <Card 
              key={section.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border hover:border-primary/30"
              onClick={() => handleNavigate(section.route)}
            >
              <CardContent className="p-4">
                <div className={`w-12 h-12 rounded-xl ${section.iconBg} flex items-center justify-center mb-3`}>
                  <section.icon className={`h-6 w-6 ${section.iconColor}`} />
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plano de Carreira - Níveis */}
        <Card className="border-2 mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Sua Jornada ByNeofolic</CardTitle>
                <CardDescription>Evolua do Basic ao Legacy e desbloqueie novos benefícios</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/career')}>
                Ver Detalhes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {(Object.keys(tierConfig) as LicenseeTier[]).map((tierKey, index) => {
                const info = tierConfig[tierKey];
                const isCurrentTier = tierKey === tier;
                const isPast = Object.keys(tierConfig).indexOf(tier) > index;
                return (
                  <div key={tierKey} className="flex items-center">
                    <div 
                      className={`relative flex-shrink-0 p-3 rounded-xl text-center border-2 transition-all min-w-[100px] ${
                        isCurrentTier 
                          ? `${info.bgColor} ${info.borderColor} ${info.color} shadow-md` 
                          : isPast
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-muted/30 border-transparent text-muted-foreground'
                      }`}
                    >
                      {isCurrentTier && (
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 bg-primary">
                          Você está aqui
                        </Badge>
                      )}
                      <div className={`mx-auto mb-1 ${isCurrentTier ? info.color : isPast ? 'text-primary' : 'text-muted-foreground'}`}>
                        {info.icon}
                      </div>
                      <p className="font-semibold text-sm">{info.name}</p>
                      <p className="text-[10px] opacity-70">{info.threshold}</p>
                    </div>
                    {index < Object.keys(tierConfig).length - 1 && (
                      <div className={`w-8 h-0.5 ${isPast ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer Logo */}
        <div className="mt-12 text-center opacity-40">
          <img 
            src={logoByNeofolic} 
            alt="Licença ByNeofolic" 
            className="h-8 mx-auto object-contain grayscale"
          />
          <p className="text-xs mt-2">Portal Exclusivo do Licenciado</p>
        </div>
      </main>
    </div>
  );
}
