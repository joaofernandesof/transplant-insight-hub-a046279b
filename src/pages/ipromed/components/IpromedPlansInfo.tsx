/**
 * CPG Advocacia Médica - Planos de Assessoria
 * Informações dos planos da CPG Advocacia Médica
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Shield,
  Crown,
  Scale,
  FileText,
  Gavel,
  Users,
  AlertTriangle,
  MessageSquare,
  FileSignature,
  Star,
} from "lucide-react";

export interface IpromedPlan {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  featured: boolean;
  features: string[];
  extras?: string[];
}

// Planos da CPG Advocacia Médica
export const ipromedPlans: IpromedPlan[] = [
  {
    id: "essencial",
    name: "Essencial",
    subtitle: "Proteção fundamental",
    price: 1900,
    featured: false,
    features: [
      "Consultoria jurídica preventiva ilimitada",
      "Defesa ética perante CRM",
      "Defesa cível (danos morais e materiais)",
      "Acompanhamento em audiências",
      "Até 3 processos concomitantes",
      "Documentação Jurídica com desconto",
    ],
  },
  {
    id: "integral",
    name: "Integral",
    subtitle: "Proteção completa",
    price: 2900,
    featured: true,
    features: [
      "Tudo do Essencial +",
      "Análise e revisão de contratos médicos",
      "Defesa criminal médica",
      "Defesa administrativa (Vigilância, ANS)",
      "Gestão de crise e reputação",
      "Parecer jurídico técnico",
      "Processos concomitantes ilimitados",
      "Documentação Jurídica Preventiva inclusa",
    ],
  },
];

// Custos de defesa avulsa (fonte: site oficial)
export const litigationCosts = [
  { type: "Defesa ética (CRM)", value: 10000, icon: Scale },
  { type: "Defesa cível", value: 30000, icon: FileText },
  { type: "Defesa criminal", value: 30000, icon: Gavel },
  { type: "Defesa administrativa", value: 30000, icon: AlertTriangle },
];

export const totalLitigationRisk = litigationCosts.reduce((acc, c) => acc + c.value, 0);

// KPIs do IPROMED (fonte: site oficial)
export const ipromedKPIs = [
  { label: "Médicos protegidos", value: "+500", icon: Users },
  { label: "Tempo de resposta", value: "24h", icon: MessageSquare },
  { label: "Foco em saúde", value: "100%", icon: Shield },
];

interface PlanCardProps {
  plan: IpromedPlan;
}

export function PlanCard({ plan }: PlanCardProps) {
  return (
    <Card className={`border-none shadow-lg relative ${plan.featured ? 'ring-2 ring-primary' : ''}`}>
      {plan.featured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          <Star className="h-3 w-3 mr-1" />
          Mais completo
        </Badge>
      )}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.subtitle}</CardDescription>
        <div className="pt-4">
          <span className="text-4xl font-bold">R$ {plan.price.toLocaleString('pt-BR')}</span>
          <span className="text-muted-foreground">/mês</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button className={`w-full ${plan.featured ? '' : 'variant-outline'}`}>
          Contratar {plan.name}
        </Button>
      </CardContent>
    </Card>
  );
}

export function LitigationCostCard() {
  return (
    <Card className="border-none shadow-lg bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          O custo de um único ato médico
        </CardTitle>
        <CardDescription>
          Um único ato médico pode gerar 4 responsabilidades diferentes. Isso independe de condenação.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {litigationCosts.map((cost) => {
          const Icon = cost.icon;
          return (
            <div key={cost.type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{cost.type}</span>
              </div>
              <span className="font-semibold text-rose-600">
                R$ {cost.value.toLocaleString('pt-BR')}
              </span>
            </div>
          );
        })}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Risco total em honorários avulsos:</span>
            <span className="text-xl font-bold text-rose-600">
              R$ {totalLitigationRisk.toLocaleString('pt-BR')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Por isso médicos inteligentes investem em prevenção.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function KPICards() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {ipromedKPIs.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="border-none shadow-md text-center">
            <CardContent className="pt-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function PlansComparison() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Planos de Assessoria</h2>
        <p className="text-muted-foreground mt-1">
          Escolha o nível certo para sua carreira. Economia de mais de 90% comparado à contratação avulsa.
        </p>
      </div>

      <KPICards />

      <LitigationCostCard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ipromedPlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}

export default PlansComparison;
