import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Trophy,
  Star,
  Award,
  Crown,
  Gem,
  Shield,
  Sparkles,
  CheckCircle2,
  Circle,
  Lock
} from "lucide-react";
import { ModuleLayout } from "@/components/ModuleLayout";

type LicenseeTier = 'basic' | 'pro' | 'expert' | 'master' | 'elite' | 'titan' | 'legacy';

interface TierDetail {
  name: string;
  threshold: string;
  revenue: number;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  benefits: string[];
  checklist: { id: string; label: string; completed: boolean }[];
}

const tierDetails: Record<LicenseeTier, TierDetail> = {
  basic: { name: 'Basic', threshold: 'até 50 mil', revenue: 50000, description: 'Validar operação', color: 'text-slate-700', bgColor: 'bg-slate-100', icon: <Shield className="h-6 w-6" />, benefits: ['Acesso aos materiais básicos', 'Suporte via grupo', 'POPs e protocolos essenciais'], checklist: [{ id: '1', label: 'Clínica estruturada', completed: true }, { id: '2', label: 'Primeira venda realizada', completed: true }, { id: '3', label: 'CRM configurado', completed: false }, { id: '4', label: 'Primeira campanha de tráfego', completed: false }] },
  pro: { name: 'Pro', threshold: '100 mil', revenue: 100000, description: 'Previsibilidade', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <Star className="h-6 w-6" />, benefits: ['Trilha comercial completa', 'Templates de marketing', 'Mentoria em grupo mensal'], checklist: [{ id: '1', label: '100k de faturamento mensal', completed: false }, { id: '2', label: 'Processo comercial padronizado', completed: false }, { id: '3', label: '3 canais de aquisição ativos', completed: false }, { id: '4', label: 'Taxa de conversão > 25%', completed: false }] },
  expert: { name: 'Expert', threshold: '200 mil', revenue: 200000, description: 'Escalar cirurgias', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <Award className="h-6 w-6" />, benefits: ['Trilha avançada de técnicas', 'Consultoria de escala', 'Acesso a fornecedores premium'], checklist: [{ id: '1', label: '200k de faturamento mensal', completed: false }, { id: '2', label: 'Equipe de atendimento treinada', completed: false }, { id: '3', label: 'Processo cirúrgico otimizado', completed: false }, { id: '4', label: 'Marketing automatizado', completed: false }] },
  master: { name: 'Master', threshold: '500 mil', revenue: 500000, description: 'Equipe robusta', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: <Trophy className="h-6 w-6" />, benefits: ['Possibilidade de sociedade Neo Group', 'Mentoria executiva', 'Acesso prioritário a novidades'], checklist: [{ id: '1', label: '500k de faturamento mensal', completed: false }, { id: '2', label: 'Time completo contratado', completed: false }, { id: '3', label: 'Processos documentados', completed: false }, { id: '4', label: 'Múltiplas salas cirúrgicas', completed: false }] },
  elite: { name: 'Elite', threshold: '750 mil', revenue: 750000, description: 'Referência regional', color: 'text-rose-700', bgColor: 'bg-rose-100', icon: <Gem className="h-6 w-6" />, benefits: ['Participação em eventos exclusivos', 'Networking com top performers', 'Estratégias de expansão'], checklist: [{ id: '1', label: '750k de faturamento mensal', completed: false }, { id: '2', label: 'Reconhecimento regional', completed: false }, { id: '3', label: 'Parcerias estratégicas', completed: false }, { id: '4', label: 'Equipe autônoma', completed: false }] },
  titan: { name: 'Titan', threshold: '1 milhão', revenue: 1000000, description: 'Multiclínicas', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: <Crown className="h-6 w-6" />, benefits: ['Suporte para expansão', 'Modelo de franquia', 'Consultoria de gestão avançada'], checklist: [{ id: '1', label: '1M de faturamento mensal', completed: false }, { id: '2', label: 'Múltiplas unidades', completed: false }, { id: '3', label: 'Gestão descentralizada', completed: false }, { id: '4', label: 'ROI sustentável em todas unidades', completed: false }] },
  legacy: { name: 'Legacy', threshold: '2M+', revenue: 2000000, description: 'Parte estratégica do Neo Group', color: 'text-primary', bgColor: 'bg-gradient-to-r from-amber-100 to-yellow-100', icon: <Sparkles className="h-6 w-6" />, benefits: ['Participação nos lucros', 'Assento no conselho', 'Definição de estratégias do grupo'], checklist: [{ id: '1', label: '2M+ de faturamento mensal', completed: false }, { id: '2', label: 'Operação consolidada', completed: false }, { id: '3', label: 'Contribuição estratégica ativa', completed: false }, { id: '4', label: 'Mentoria de novos licenciados', completed: false }] }
};

const getLicenseeTier = (userId: string): LicenseeTier => {
  const tierMap: Record<string, LicenseeTier> = { 'clinic-1': 'pro', 'clinic-2': 'expert', 'clinic-3': 'master' };
  return tierMap[userId] || 'basic';
};

export default function Career() {
  const { user } = useAuth();
  const currentTier = user ? getLicenseeTier(user.id) : 'basic';
  const currentTierIndex = Object.keys(tierDetails).indexOf(currentTier);
  const tiers = Object.keys(tierDetails) as LicenseeTier[];

  return (
    <ModuleLayout>
      <div className="p-4 lg:p-6 lg:pt-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-amber-600" />
            Plano de Carreira
          </h1>
          <p className="text-sm text-muted-foreground">Roadmap, checklist e evolução</p>
        </div>

        {/* Current Level */}
        <Card className={`mb-6 ${tierDetails[currentTier].bgColor} border-2`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center ${tierDetails[currentTier].color}`}>
                {tierDetails[currentTier].icon}
              </div>
              <div>
                <Badge className="mb-1">Nível Atual</Badge>
                <h2 className={`text-2xl font-bold ${tierDetails[currentTier].color}`}>{tierDetails[currentTier].name}</h2>
                <p className={`text-sm ${tierDetails[currentTier].color} opacity-80`}>{tierDetails[currentTier].threshold} • {tierDetails[currentTier].description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress to Next Level */}
        {currentTierIndex < tiers.length - 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Progresso para o Próximo Nível</CardTitle>
              <CardDescription>{tierDetails[tiers[currentTierIndex + 1]].name} - {tierDetails[tiers[currentTierIndex + 1]].threshold}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tierDetails[currentTier].checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.completed ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.label}</span>
                  </div>
                ))}
              </div>
              <Progress value={(tierDetails[currentTier].checklist.filter(i => i.completed).length / tierDetails[currentTier].checklist.length) * 100} className="mt-4 h-2" />
            </CardContent>
          </Card>
        )}

        {/* All Levels */}
        <h3 className="text-lg font-semibold mb-4">Todos os Níveis</h3>
        <div className="space-y-4">
          {tiers.map((tierKey, index) => {
            const tier = tierDetails[tierKey];
            const isCurrentTier = tierKey === currentTier;
            const isPast = index < currentTierIndex;
            const isFuture = index > currentTierIndex;
            
            return (
              <Card key={tierKey} className={`transition-all relative ${isCurrentTier ? 'ring-2 ring-primary shadow-lg scale-[1.02] bg-primary/5' : ''} ${isFuture ? 'opacity-50' : ''}`}>
                {isCurrentTier && (
                  <div className="absolute -top-3 left-4">
                    <Badge className="bg-primary shadow-md"><Sparkles className="h-3 w-3 mr-1" />Seu nível</Badge>
                  </div>
                )}
                <CardContent className={`p-4 ${isCurrentTier ? 'pt-5' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${tier.bgColor} ${tier.color} flex items-center justify-center relative ${isCurrentTier ? 'ring-2 ring-primary/30' : ''}`}>
                      {tier.icon}
                      {isFuture && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-muted rounded-full flex items-center justify-center"><Lock className="h-3 w-3 text-muted-foreground" /></div>}
                      {isPast && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><CheckCircle2 className="h-3 w-3 text-white" /></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${isCurrentTier ? 'text-primary' : ''}`}>{tier.name}</h4>
                        <Badge variant="outline" className="text-xs">{tier.threshold}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{tier.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {tier.benefits.map((benefit, i) => <Badge key={i} variant="secondary" className="text-xs font-normal">{benefit}</Badge>)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ModuleLayout>
  );
}
