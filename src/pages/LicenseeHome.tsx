import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileCheck, BookOpen, Video, LogOut, Crown, Award, Star, Trophy, Gem, Shield, Sparkles } from "lucide-react";
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

// Mock function to get licensee tier - in real app, this would come from the user data
const getLicenseeTier = (userId: string): LicenseeTier => {
  // For demo purposes, assign tiers based on user id
  const tierMap: Record<string, LicenseeTier> = {
    'clinic-1': 'pro',
    'clinic-2': 'expert',
    'clinic-3': 'master'
  };
  return tierMap[userId] || 'basic';
};

const menuItems = [
  {
    id: 'metrics',
    title: 'Análise de Métricas',
    description: 'Dashboard completo com indicadores de desempenho, insights e mentor virtual',
    icon: BarChart3,
    route: '/dashboard',
    color: 'bg-primary hover:bg-primary/90',
    iconBg: 'bg-primary/10'
  },
  {
    id: 'regularization',
    title: 'Regularização da Clínica',
    description: 'Documentação, alvarás e conformidade legal da sua unidade',
    icon: FileCheck,
    route: '/regularization',
    color: 'bg-emerald-600 hover:bg-emerald-700',
    iconBg: 'bg-emerald-100'
  },
  {
    id: 'materials',
    title: 'Materiais do Licenciado',
    description: 'Manuais, templates, materiais de marketing e recursos exclusivos',
    icon: BookOpen,
    route: '/materials',
    color: 'bg-blue-600 hover:bg-blue-700',
    iconBg: 'bg-blue-100'
  },
  {
    id: 'classes',
    title: 'Aulas Gravadas',
    description: 'Biblioteca completa de treinamentos e capacitações',
    icon: Video,
    route: '/classes',
    color: 'bg-purple-600 hover:bg-purple-700',
    iconBg: 'bg-purple-100'
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
            
            <div className="flex items-center gap-4">
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
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section with Badge */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mb-6">
            {user?.clinicName}
          </p>
          
          {/* Licensee Badge */}
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${tierInfo.bgColor} ${tierInfo.borderColor} ${tierInfo.color} shadow-sm`}>
            {tierInfo.icon}
            <div className="text-left">
              <p className="font-bold text-lg leading-tight">{tierInfo.name}</p>
              <p className="text-xs opacity-80">{tierInfo.threshold} • {tierInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {menuItems.map((item) => (
            <Card 
              key={item.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/20"
              onClick={() => handleNavigate(item.route)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${item.iconBg}`}>
                    <item.icon className="h-8 w-8 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {item.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className={`w-full ${item.color} text-white`}>
                  Acessar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* All Tiers Preview */}
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Níveis de Licenciado</CardTitle>
            <CardDescription>Sua jornada de crescimento com a ByNeofolic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {(Object.keys(tierConfig) as LicenseeTier[]).map((tierKey) => {
                const info = tierConfig[tierKey];
                const isCurrentTier = tierKey === tier;
                return (
                  <div 
                    key={tierKey}
                    className={`relative p-3 rounded-lg text-center border-2 transition-all ${
                      isCurrentTier 
                        ? `${info.bgColor} ${info.borderColor} ${info.color} shadow-md scale-105` 
                        : 'bg-muted/30 border-transparent opacity-60'
                    }`}
                  >
                    {isCurrentTier && (
                      <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-primary">
                        Atual
                      </Badge>
                    )}
                    <div className={`mx-auto mb-1 ${isCurrentTier ? info.color : 'text-muted-foreground'}`}>
                      {info.icon}
                    </div>
                    <p className="font-semibold text-sm">{info.name}</p>
                    <p className="text-[10px] opacity-70">{info.threshold}</p>
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
        </div>
      </main>
    </div>
  );
}
