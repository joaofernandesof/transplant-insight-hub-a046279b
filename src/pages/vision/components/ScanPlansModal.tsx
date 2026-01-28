import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Coins, Zap, Sparkles, Crown, X, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

interface ScanPlansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: 'free' | 'starter' | 'professional' | 'unlimited';
  onPlanChanged?: () => void;
}

const plans = [
  {
    id: 'free',
    name: 'Grátis',
    price: 0,
    priceLabel: 'R$ 0',
    period: '/mês',
    icon: Coins,
    color: 'border-muted',
    bgColor: 'bg-muted/20',
    textColor: 'text-muted-foreground',
    features: [
      { text: '3 créditos por dia', included: true },
      { text: '~90 scans/mês', included: true },
      { text: 'Simulação de progressão', included: true },
      { text: 'Scan de densidade', included: true },
      { text: 'Nova versão (transplante)', included: false },
      { text: 'Histórico de scans', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
    dailyCredits: 3,
    monthlyCredits: 0,
    cta: 'Plano Atual',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29.90,
    priceLabel: 'R$ 29,90',
    period: '/mês',
    icon: Zap,
    color: 'border-blue-500/50',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    features: [
      { text: '5 créditos por dia', included: true },
      { text: '+50 créditos/mês extras', included: true },
      { text: '~200 scans/mês total', included: true },
      { text: 'Todas as análises', included: true },
      { text: 'Nova versão (transplante)', included: true },
      { text: 'Histórico 30 dias', included: true },
      { text: 'Suporte prioritário', included: false },
    ],
    dailyCredits: 5,
    monthlyCredits: 50,
    cta: 'Assinar Starter',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79.90,
    priceLabel: 'R$ 79,90',
    period: '/mês',
    icon: Sparkles,
    color: 'border-purple-500/50',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    features: [
      { text: '10 créditos por dia', included: true },
      { text: '+150 créditos/mês extras', included: true },
      { text: '~450 scans/mês total', included: true },
      { text: 'Todas as análises', included: true },
      { text: 'Nova versão (transplante)', included: true },
      { text: 'Histórico ilimitado', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
    dailyCredits: 10,
    monthlyCredits: 150,
    cta: 'Assinar Pro',
    popular: true,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: 199.90,
    priceLabel: 'R$ 199,90',
    period: '/mês',
    icon: Crown,
    color: 'border-amber-500/50',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    features: [
      { text: 'Créditos ilimitados', included: true },
      { text: 'Uso sem restrições', included: true },
      { text: 'Todas as análises', included: true },
      { text: 'Nova versão (transplante)', included: true },
      { text: 'Histórico ilimitado', included: true },
      { text: 'Suporte VIP 24/7', included: true },
      { text: 'API de integração', included: true },
    ],
    dailyCredits: 999,
    monthlyCredits: 9999,
    cta: 'Assinar Unlimited',
    popular: false,
  },
];

export function ScanPlansModal({ open, onOpenChange, currentPlan = 'free', onPlanChanged }: ScanPlansModalProps) {
  const { session } = useUnifiedAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    subscribed: boolean;
    plan: string;
    subscription_end?: string;
  } | null>(null);

  useEffect(() => {
    if (open && session?.user) {
      checkSubscription();
    }
  }, [open, session?.user]);

  const checkSubscription = async () => {
    if (!session?.user) return;
    
    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-check-subscription');
      if (error) throw error;
      setSubscriptionInfo(data);
      onPlanChanged?.();
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') return;
    if (planId === currentPlan || planId === subscriptionInfo?.plan) {
      await handleManageSubscription();
      return;
    }
    
    if (!session?.user) {
      toast.error("Você precisa estar logado para assinar um plano");
      return;
    }

    setSelectedPlan(planId);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('scan-create-checkout', {
        body: { planId },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Checkout aberto em nova aba", {
          description: "Complete o pagamento para ativar seu plano"
        });
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      toast.error("Erro ao iniciar checkout");
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-customer-portal');
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Portal de assinatura aberto");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
      toast.error("Erro ao abrir portal de assinatura");
    } finally {
      setLoading(false);
    }
  };

  const activePlan = subscriptionInfo?.plan || currentPlan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Escolha seu Plano Vision
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            Desbloqueie todo o potencial da análise de cabelo com IA
          </p>
        </DialogHeader>

        {checkingSubscription && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Verificando assinatura...</span>
          </div>
        )}

        {subscriptionInfo?.subscribed && subscriptionInfo?.subscription_end && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
            <p className="text-sm">
              Você tem o plano <strong className="text-primary">{subscriptionInfo.plan}</strong> ativo até{' '}
              <strong>{new Date(subscriptionInfo.subscription_end).toLocaleDateString('pt-BR')}</strong>
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 gap-1"
              onClick={handleManageSubscription}
              disabled={loading}
            >
              <ExternalLink className="w-3 h-3" />
              Gerenciar Assinatura
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const isCurrentPlan = plan.id === activePlan;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border-2 p-4 transition-all ${
                  isCurrentPlan ? 'border-primary bg-primary/5' : plan.color
                } ${plan.bgColor} ${plan.popular ? 'ring-2 ring-purple-500/50' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white">
                    Mais Popular
                  </Badge>
                )}
                
                {isCurrentPlan && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Seu Plano
                  </Badge>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${plan.bgColor}`}>
                    <PlanIcon className={`w-5 h-5 ${plan.textColor}`} />
                  </div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold">{plan.priceLabel}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>

                <div className="flex-1 space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "secondary"}
                  className={`w-full ${plan.popular ? 'bg-purple-500 hover:bg-purple-600' : ''}`}
                  disabled={plan.id === 'free' || (loading && isSelected)}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {loading && isSelected ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : isCurrentPlan ? (
                    plan.id === 'free' ? 'Plano Atual' : 'Gerenciar'
                  ) : (
                    plan.cta
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Pagamento seguro via Stripe. Cancele a qualquer momento.
        </p>
      </DialogContent>
    </Dialog>
  );
}
