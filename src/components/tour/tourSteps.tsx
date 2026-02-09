import { 
  BarChart3, 
  Video, 
  TrendingUp, 
  Flame,
  Gift,
  Users,
  Sparkles,
  Rocket,
  Home
} from "lucide-react";

export interface TourStep {
  id: string;
  title: string;
  message: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  route?: string;
  targetSelector?: string;
}

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Escritório Virtual! 🎉",
    message: "Olá! Eu sou o Jon Jobs, seu assistente virtual. Vou te guiar por todo o sistema para você aproveitar ao máximo sua Licença ByNeofolic. Clique em 'Próximo' para começar!",
    icon: <Sparkles className="h-5 w-5" />,
    iconColor: "text-primary",
    bgColor: "bg-primary/20",
    route: "/home",
  },
  {
    id: "profile",
    title: "Seu Perfil",
    message: "Aqui está seu avatar! Clique nele para completar seu perfil com foto, dados da clínica e contato. Um perfil completo ajuda na sua jornada!",
    icon: <Home className="h-5 w-5" />,
    iconColor: "text-primary",
    bgColor: "bg-primary/20",
    route: "/home",
    targetSelector: "[data-tour='profile-avatar']",
  },
  {
    id: "roadmap",
    title: "Sua Jornada de Crescimento",
    message: "Este é seu roadmap de evolução! Do Basic ao Legacy, cada nível desbloqueia novos benefícios. Acompanhe seu progresso aqui!",
    icon: <TrendingUp className="h-5 w-5" />,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-100",
    route: "/home",
    targetSelector: "[data-tour='journey-roadmap']",
  },
  {
    id: "menu",
    title: "Menu de Módulos",
    message: "Estes são os módulos disponíveis para você! Cada card leva a uma área específica do sistema. Vamos explorar os principais?",
    icon: <BarChart3 className="h-5 w-5" />,
    iconColor: "text-primary",
    bgColor: "bg-primary/20",
    route: "/home",
    targetSelector: "[data-tour='menu-grid']",
  },
  {
    id: "dashboard",
    title: "Dashboard de Métricas",
    message: "Aqui você acompanha seus KPIs semanais, o funil de vendas e recebe insights automáticos para melhorar seus resultados!",
    icon: <BarChart3 className="h-5 w-5" />,
    iconColor: "text-primary",
    bgColor: "bg-primary/20",
    route: "/home",
    targetSelector: "[data-tour='menu-metrics']",
  },
  {
    id: "university",
    title: "Academia ByNeofolic",
    message: "Na Academia você encontra trilhas de capacitação, aulas gravadas e imersões exclusivas. Tudo para dominar as técnicas!",
    icon: <Video className="h-5 w-5" />,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-100",
    route: "/home",
    targetSelector: "[data-tour='menu-university']",
  },
  {
    id: "hotleads",
    title: "HotLeads",
    message: "Este é um dos maiores benefícios! Você recebe leads qualificados diretamente. Quanto mais você evolui, mais leads recebe!",
    icon: <Flame className="h-5 w-5" />,
    iconColor: "text-red-600",
    bgColor: "bg-red-100",
    route: "/home",
    targetSelector: "[data-tour='menu-hotleads']",
  },
  {
    id: "career",
    title: "Plano de Carreira",
    message: "Evolua do nível Basic ao Legacy! A cada nível você desbloqueia novos benefícios e aumenta sua participação nos HotLeads.",
    icon: <TrendingUp className="h-5 w-5" />,
    iconColor: "text-amber-600",
    bgColor: "bg-amber-100",
    route: "/home",
    targetSelector: "[data-tour='menu-career']",
  },
  {
    id: "referral",
    title: "Indique e Ganhe",
    message: "Conhece alguém que se beneficiaria da licença? Indique e ganhe 5% de comissão! Seu link exclusivo está te esperando.",
    icon: <Gift className="h-5 w-5" />,
    iconColor: "text-rose-600",
    bgColor: "bg-rose-100",
    route: "/home",
    targetSelector: "[data-tour='menu-referral']",
  },
  {
    id: "mentorship",
    title: "Mentoria & Suporte",
    message: "Aqui você agenda mentorias individuais, participa do grupo exclusivo e se conecta com outros licenciados. Nunca estará sozinho!",
    icon: <Users className="h-5 w-5" />,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-100",
    route: "/home",
    targetSelector: "[data-tour='menu-mentorship']",
  },
  {
    id: "complete",
    title: "Tudo pronto! 🚀",
    message: "Parabéns! Agora você conhece todo o sistema. Complete seu perfil, explore os módulos e comece sua jornada de sucesso. Estarei sempre aqui para ajudar!",
    icon: <Rocket className="h-5 w-5" />,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-100",
    route: "/home",
  }
];
