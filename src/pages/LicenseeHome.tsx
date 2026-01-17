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
  TrendingUp,
  Flame,
  GraduationCap,
  Store,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Building2,
  Gift
} from "lucide-react";
import logoByNeofolic from "@/assets/logo-byneofolic.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import UserNotificationsPopover from "@/components/UserNotificationsPopover";

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

// Seções principais do portal - mesma ordem do menu lateral
const mainSections = [
  {
    id: 'metrics',
    title: 'Dashboard de Métricas',
    description: 'KPIs semanais, funil de vendas e insights do mentor virtual',
    icon: BarChart3,
    route: '/dashboard',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary'
  },
  {
    id: 'university',
    title: 'Universidade ByNeofolic',
    description: 'Trilhas de capacitação, aulas gravadas e imersões',
    icon: Video,
    route: '/university',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600'
  },
  {
    id: 'regularization',
    title: 'Regularização da Clínica',
    description: 'Checklist de documentos, alvarás e compliance',
    icon: FileCheck,
    route: '/regularization',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600'
  },
  {
    id: 'materials',
    title: 'Central de Materiais',
    description: 'POPs, protocolos, scripts, contratos e termos',
    icon: BookOpen,
    route: '/materials',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600'
  },
  {
    id: 'marketing',
    title: 'Central de Marketing',
    description: 'Templates, campanhas, banco de mídia e branding',
    icon: Palette,
    route: '/marketing',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600'
  },
  {
    id: 'store',
    title: 'Loja Neo-Spa',
    description: 'Produtos com preço de custo e fornecedores parceiros',
    icon: ShoppingBag,
    route: '/store',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600'
  },
  {
    id: 'estrutura-neo',
    title: 'Estrutura NEO',
    description: 'Modelo de negócio e estrutura da franquia',
    icon: Building2,
    route: '/estrutura-neo',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600'
  },
  {
    id: 'financial',
    title: 'Gestão Financeira',
    description: 'Metas comerciais, dashboards e orientações',
    icon: DollarSign,
    route: '/financial',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    id: 'mentorship',
    title: 'Mentoria & Suporte',
    description: 'Consultorias, grupo exclusivo e comunidade',
    icon: Users,
    route: '/mentorship',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600'
  },
  {
    id: 'systems',
    title: 'Sistemas & Ferramentas',
    description: 'CRM, WhatsApp API, Feegow e robôs',
    icon: Settings,
    route: '/systems',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600'
  },
  {
    id: 'career',
    title: 'Plano de Carreira',
    description: 'Roadmap, checklist de domínio e evolução',
    icon: TrendingUp,
    route: '/career',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  },
  {
    id: 'hotleads',
    title: 'HotLeads',
    description: 'Leads qualificados para sua clínica',
    icon: Flame,
    route: '/hotleads',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600'
  },
  {
    id: 'community',
    title: 'Comunidade',
    description: 'Conecte-se com outros licenciados',
    icon: Users,
    route: '/community',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600'
  },
  {
    id: 'certificates',
    title: 'Certificados',
    description: 'Seus cursos e certificações',
    icon: GraduationCap,
    route: '/certificates',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600'
  },
  {
    id: 'partners',
    title: 'Vitrine de Parceiros',
    description: 'Cupons exclusivos para você',
    icon: Store,
    route: '/partners',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600'
  },
  {
    id: 'referral',
    title: 'Indique e Ganhe',
    description: 'Ganhe 5% de comissão por indicação',
    icon: Gift,
    route: '/indique-e-ganhe',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600'
  },
  {
    id: 'license-payments',
    title: 'Financeiro Licença',
    description: 'Pagamentos e ROI do HotLeads',
    icon: CreditCard,
    route: '/license-payments',
    iconBg: 'bg-lime-100',
    iconColor: 'text-lime-600'
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 overflow-x-hidden w-full">
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
              <ThemeToggle />
              <UserNotificationsPopover />
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
        {/* Profile Photo & Welcome Section */}
        <div className="text-center mb-10">
          {/* Profile Avatar */}
          <div 
            className="mx-auto mb-4 cursor-pointer group"
            onClick={() => navigate('/profile')}
          >
            <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all shadow-lg">
              <AvatarImage src={user?.avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-bold">
                {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            Olá, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mb-6">
            {user?.clinicName}
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

        {/* Mentors Section */}
        <Card className="mb-8 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Users className="h-7 w-7 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Seus Mentores</h2>
              <p className="text-sm text-muted-foreground">
                Equipe especializada para guiar sua jornada no transplante capilar
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={() => navigate('/mentorship')}
            >
              Agendar Mentoria
            </Button>
          </div>
        </Card>

        {/* Plano de Carreira - Níveis */}
        <Card className="border-2 mb-8 overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Sua Jornada ByNeofolic</CardTitle>
                  <CardDescription>Evolua do Basic ao Legacy e desbloqueie novos benefícios</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/career')} className="gap-2">
                Ver Detalhes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Progresso na jornada</span>
                <span>{Object.keys(tierConfig).indexOf(tier) + 1} de {Object.keys(tierConfig).length} níveis</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                  style={{ width: `${((Object.keys(tierConfig).indexOf(tier) + 1) / Object.keys(tierConfig).length) * 100}%` }}
                />
              </div>
            </div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {(Object.keys(tierConfig) as LicenseeTier[]).map((tierKey, index) => {
                const info = tierConfig[tierKey];
                const isCurrentTier = tierKey === tier;
                const isPast = Object.keys(tierConfig).indexOf(tier) > index;
                const isFuture = Object.keys(tierConfig).indexOf(tier) < index;
                
                return (
                  <div 
                    key={tierKey} 
                    className={`relative p-4 rounded-xl text-center transition-all duration-300 ${
                      isCurrentTier 
                        ? `${info.bgColor} ${info.borderColor} ${info.color} border-2 shadow-lg ring-2 ring-primary/20 scale-105` 
                        : isPast
                          ? 'bg-primary/10 border border-primary/30 text-primary'
                          : 'bg-muted/30 border border-transparent text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {/* Current tier badge */}
                    {isCurrentTier && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="text-[10px] px-2 py-0.5 bg-primary shadow-md whitespace-nowrap">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Seu nível
                        </Badge>
                      </div>
                    )}
                    
                    {/* Completed check */}
                    {isPast && (
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                    
                    {/* Icon */}
                    <div className={`mx-auto mb-2 p-2 rounded-lg ${
                      isCurrentTier 
                        ? 'bg-white/50' 
                        : isPast 
                          ? 'bg-primary/20' 
                          : 'bg-muted'
                    }`}>
                      <div className={isCurrentTier ? info.color : isPast ? 'text-primary' : 'text-muted-foreground'}>
                        {info.icon}
                      </div>
                    </div>
                    
                    {/* Name */}
                    <p className={`font-bold text-sm ${isCurrentTier ? info.color : ''}`}>
                      {info.name}
                    </p>
                    
                    {/* Threshold */}
                    <p className={`text-[11px] mt-0.5 ${isCurrentTier ? 'opacity-80' : 'opacity-60'}`}>
                      {info.threshold}
                    </p>
                    
                    {/* Description - only for current */}
                    {isCurrentTier && (
                      <p className="text-[10px] mt-2 opacity-70 font-medium">
                        {info.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Next level hint */}
            {tier !== 'legacy' && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent border border-muted flex items-center gap-4">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Trophy className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Próximo nível: {tierConfig[(Object.keys(tierConfig) as LicenseeTier[])[Object.keys(tierConfig).indexOf(tier) + 1]]?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Meta: {tierConfig[(Object.keys(tierConfig) as LicenseeTier[])[Object.keys(tierConfig).indexOf(tier) + 1]]?.threshold} • {tierConfig[(Object.keys(tierConfig) as LicenseeTier[])[Object.keys(tierConfig).indexOf(tier) + 1]]?.description}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/career')}>
                  Como chegar lá
                </Button>
              </div>
            )}
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
