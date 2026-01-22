import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
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
  Gift,
  Menu,
  ChevronRight,
  Stethoscope
} from "lucide-react";
import logoByNeofolic from "@/assets/logo-byneofolic.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import UserNotificationsPopover from "@/components/UserNotificationsPopover";
import OnboardingTour from "@/components/OnboardingTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import FirstStepsChecklist from "@/components/FirstStepsChecklist";
import AchievementsPanel from "@/components/AchievementsPanel";
import { ModuleSidebar } from "@/components/ModuleSidebar";
import MonthlyGoals from "@/components/MonthlyGoals";
import SurgerySubmissions from "@/components/SurgerySubmissions";
import AchievementTimeline from "@/components/AchievementTimeline";
import Leaderboard from "@/components/Leaderboard";
import { SalaTecnicaNotification } from "@/components/SalaTecnicaNotification";
import { SalaTecnicaUpcoming } from "@/components/SalaTecnicaUpcoming";

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
    id: 'achievements',
    title: 'Conquistas',
    description: 'Suas conquistas e pontos acumulados',
    icon: Trophy,
    route: '/achievements',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600'
  },
  {
    id: 'surgery-schedule',
    title: 'Agenda de Cirurgias',
    description: 'Gerencie a agenda da sua clínica',
    icon: Stethoscope,
    route: '/surgery-schedule',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600'
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
  const { showOnboarding, completeOnboarding } = useOnboarding();
  
  const tier = user ? getLicenseeTier(user.id) : 'basic';
  const tierInfo = tierConfig[tier];

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Função para abrir o menu lateral (dispara evento customizado)
  const openSidebar = () => {
    window.dispatchEvent(new CustomEvent('openSidebar'));
  };

  return (
    <>
      {/* Onboarding Tour */}
      <OnboardingTour isOpen={showOnboarding} onComplete={completeOnboarding} />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 overflow-x-hidden w-full">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={openSidebar}
                className="flex-shrink-0 h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
                className="flex-shrink-0 h-9 w-9"
              >
                <Building2 className="h-5 w-5" />
              </Button>
              <span className="text-lg font-semibold text-foreground">
                Licença ByNeofolic
              </span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <ThemeToggle />
              <UserNotificationsPopover />
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="h-9 w-9">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.clinicName}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
                <LogOut className="h-4 w-4" />
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
          <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full border-2 ${tierInfo.bgColor} ${tierInfo.borderColor} ${tierInfo.color} shadow-sm`}>
            {tierInfo.icon}
            <p className="font-bold text-lg">Nível {tierInfo.name}</p>
          </div>
        </div>


        {/* Thursday Sala Técnica Notification */}
        <SalaTecnicaNotification className="mb-6" />

        {/* First Steps + Monthly Goals & Surgeries (row 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* First Steps - spans 7 cols on large screens */}
          <div className="lg:col-span-7">
            <FirstStepsChecklist />
          </div>
          {/* Monthly Goals + Surgery side by side on right - spans 5 cols */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <MonthlyGoals />
            <SurgerySubmissions />
          </div>
        </div>

        {/* Achievements + Leaderboard (row 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <AchievementsPanel compact />
          <Leaderboard limit={10} />
        </div>

        {/* Sala Técnica + Timeline (row 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <SalaTecnicaUpcoming />
          <AchievementTimeline />
        </div>

        {/* Menu Grid - 2 colunas no mobile para melhor usabilidade */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-12">
          {mainSections.map((section) => (
            <Card 
              key={section.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border hover:border-primary/30"
              onClick={() => handleNavigate(section.route)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${section.iconBg} flex items-center justify-center mb-2 sm:mb-3`}>
                  <section.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${section.iconColor}`} />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {section.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 hidden xs:block">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Jornada ByNeofolic - Compacta */}
        <Card className="border-2 border-primary/20 dark:border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background dark:from-primary/10 mb-8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Sua Jornada
                    <Badge variant="secondary" className="text-xs">
                      {Object.keys(tierConfig).indexOf(tier) + 1}/{Object.keys(tierConfig).length}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Nível {tierInfo.name} • {tierInfo.threshold}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/career")} className="gap-1">
                Ver detalhes
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <Progress value={((Object.keys(tierConfig).indexOf(tier) + 1) / Object.keys(tierConfig).length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(((Object.keys(tierConfig).indexOf(tier) + 1) / Object.keys(tierConfig).length) * 100)}% da jornada
              </p>
            </div>

            {/* Current level highlight */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${tierInfo.bgColor} ${tierInfo.borderColor}`}>
              <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20 ${tierInfo.color}`}>
                {tierInfo.icon}
              </div>
              <div className="flex-1">
                <p className={`font-bold ${tierInfo.color}`}>Nível {tierInfo.name}</p>
                <p className="text-xs text-muted-foreground">{tierInfo.description}</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Atual
              </Badge>
            </div>

            {/* Next level preview */}
            {tier !== 'legacy' && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  {tierConfig[(Object.keys(tierConfig) as LicenseeTier[])[Object.keys(tierConfig).indexOf(tier) + 1]]?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    Próximo: {tierConfig[(Object.keys(tierConfig) as LicenseeTier[])[Object.keys(tierConfig).indexOf(tier) + 1]]?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Meta: {tierConfig[(Object.keys(tierConfig) as LicenseeTier[])[Object.keys(tierConfig).indexOf(tier) + 1]]?.threshold}
                  </p>
                </div>
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
    </>
  );
}
