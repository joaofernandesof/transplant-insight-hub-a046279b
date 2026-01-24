import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Users,
  Award,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Timer,
  Phone,
  Mail,
  User,
  Stethoscope,
  ArrowRight,
  Star,
  Calendar,
  Percent,
  Scissors,
  Briefcase,
  TrendingUp,
  Loader2,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { useSubmitReferral, useValidateReferralCode } from '../hooks/useStudentReferrals';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Promotion deadline: 25/01/2026 at 23:59 BRT (UTC-3)
const PROMO_DEADLINE = new Date('2026-01-26T02:59:00.000Z');
const DISCOUNT_PERCENTAGE = 10;

// Pricing
const ORIGINAL_PRICE = 39900;
const DISCOUNTED_PRICE = ORIGINAL_PRICE * (1 - DISCOUNT_PERCENTAGE / 100); // 35.910
const DEPOSIT_AMOUNT = 1000;
const REMAINING_AMOUNT = DISCOUNTED_PRICE - DEPOSIT_AMOUNT; // 34.910

export function Formacao360ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const submitReferral = useSubmitReferral();
  
  // Validate the referral code
  const { data: validation, isLoading: isValidating } = useValidateReferralCode(code);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hasCrm: false,
    crm: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  // Check payment status from URL
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setPaymentSuccess(true);
    }
  }, [searchParams]);

  // Check if promo is active
  const isPromoActive = new Date() < PROMO_DEADLINE;

  // Update countdown
  useEffect(() => {
    if (!isPromoActive) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = PROMO_DEADLINE.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown(null);
        return;
      }

      setCountdown({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isPromoActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsProcessing(true);

    try {
      // First, submit the referral to database
      await submitReferral.mutateAsync({
        referralCode: code || 'DIRECT',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        hasCrm: formData.hasCrm,
        crm: formData.crm,
      });

      // Then, create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-referral-checkout', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          referralCode: code || 'DIRECT',
          hasCrm: formData.hasCrm,
          crm: formData.crm,
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao processar. Tente novamente.');
      setIsProcessing(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Invalid code state
  if (!validation?.isValid) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center bg-[#0d1e36] border-blue-900/50">
          <CardContent className="p-8">
            <div className="w-20 h-20 mx-auto bg-red-900/50 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="h-10 w-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">Link Inválido</h1>
            <p className="text-gray-400 mb-6">
              Este link de indicação não é válido ou expirou.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Ir para o site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center bg-[#0d1e36] border-blue-900/50">
          <CardContent className="p-8">
            <div className="w-20 h-20 mx-auto bg-emerald-900/50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">Reserva Confirmada!</h1>
            <p className="text-gray-400 mb-4">
              Parabéns! Sua vaga na <strong className="text-white">Formação 360° em Transplante Capilar</strong> foi reservada com sucesso!
            </p>
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-4 mb-6">
              <p className="text-emerald-400 font-semibold mb-2">Resumo do Pagamento:</p>
              <div className="text-gray-300 text-sm space-y-1">
                <p>Sinal contratual para reserva de vaga: <strong>{formatPrice(DEPOSIT_AMOUNT)}</strong></p>
                <p>Saldo devedor (pago no dia do curso, em até 24x): <strong>{formatPrice(REMAINING_AMOUNT)}</strong></p>
              </div>
            </div>
            <Badge className="bg-blue-600 text-white mb-4">
              Código de indicação: {code}
            </Badge>
            <p className="text-sm text-gray-500">
              Nossa equipe entrará em contato via WhatsApp para confirmar os detalhes da sua participação.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="bg-[#0d1e36] border-b border-blue-900/30 p-4 flex items-center justify-center">
        <img 
          src="https://ibramec.com/wp-content/uploads/2025/09/logo-branca-ibramec.webp" 
          alt="IBRAMEC" 
          className="h-10 object-contain" 
        />
      </header>

      {/* Discount Banner */}
      {isPromoActive && countdown && (
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 px-4 text-center text-white">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Percent className="h-6 w-6" />
            <span className="font-bold text-lg">DESCONTO EXCLUSIVO DE {DISCOUNT_PERCENTAGE}% NA MATRÍCULA!</span>
          </div>
          <p className="text-sm text-white/90 mt-1">Válido apenas para indicados. Promoção por tempo limitado!</p>
          <div className="flex items-center justify-center gap-2 mt-2 bg-white/20 rounded-lg px-4 py-2 w-fit mx-auto">
            <Timer className="h-4 w-4" />
            <span className="font-mono font-bold text-lg">
              {String(countdown.hours).padStart(2, '0')}:
              {String(countdown.minutes).padStart(2, '0')}:
              {String(countdown.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left - Course Info */}
          <div className="text-white space-y-6">
            {/* Course Title */}
            <div>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-4">
                <Sparkles className="h-3 w-3 mr-1" />
                Você foi indicado por {validation?.referrerName || 'um aluno'}!
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-2">
                <span className="text-blue-400">FORMAÇÃO 360°</span> EM
              </h1>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                TRANSPLANTE CAPILAR
              </h2>
              <p className="text-lg text-gray-400 mt-4">
                Acesse em <strong className="text-white">3 dias</strong> a estrutura completa para entrar com segurança no mercado mais promissor da medicina.
              </p>
            </div>

            {/* Location Badge */}
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="h-5 w-5 text-blue-400" />
              <span>Localização: São Paulo (SP)</span>
            </div>

            {/* Key Highlights */}
            <div className="grid grid-cols-3 gap-4 border-t border-b border-blue-900/50 py-6">
              <div className="text-center">
                <Award className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Certificado Oficial</p>
                <p className="text-xs text-gray-500">IBRAMEC®</p>
              </div>
              <div className="text-center">
                <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium">+30 Horas</p>
                <p className="text-xs text-gray-500">de Hands-On</p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Para médicos</p>
                <p className="text-xs text-gray-500">de todas as áreas</p>
              </div>
            </div>

            {/* Differentials */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">O que torna nossa formação diferente:</h3>
              
              <div className="bg-[#0d1e36] border border-blue-900/50 rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Scissors className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-emerald-400">Vivência Real de Cirurgia</h4>
                    <p className="text-sm text-gray-400">Mais de 70% do curso é prática em pacientes reais. De 20 a 30 cirurgias em 3 dias!</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-400">Formação Completa</h4>
                    <p className="text-sm text-gray-400">Transplante de cabelo, barba e sobrancelhas. Certificação Oficial pelo IBRAMEC®.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Briefcase className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-400">Modelo de Negócio</h4>
                    <p className="text-sm text-gray-400">Aulas de Marketing e Comercial + Mentoria com a equipe do Dr. Hygor Guerreiro.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-xl p-5">
              <p className="text-sm text-gray-400 mb-3">Números que comprovam:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <TrendingUp className="h-5 w-5 text-emerald-400 mb-1" />
                  <p className="text-2xl font-bold">+5.000</p>
                  <p className="text-xs text-gray-500">transplantes realizados</p>
                </div>
                <div>
                  <TrendingUp className="h-5 w-5 text-emerald-400 mb-1" />
                  <p className="text-2xl font-bold">R$ 2,5M+</p>
                  <p className="text-xs text-gray-500">faturamento mensal da clínica</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-[#0d1e36] border border-blue-900/50 rounded-xl p-5">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="italic text-gray-300 mb-3">
                "Em apenas 40 dias estou operando meus primeiros 5 pacientes. Daqui a 15 dias tenho outros 6 pacientes agendados. O curso é muito completo!"
              </p>
              <p className="text-sm text-gray-500">— Aluno da Formação 360°</p>
            </div>
          </div>

          {/* Right - Form */}
          <div className="lg:sticky lg:top-8">
            <Card className="shadow-2xl bg-white border-0">
              <CardHeader className="text-center pb-2">
                <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <Percent className="h-7 w-7 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl">Reserve Sua Vaga!</CardTitle>
                
                {/* Pricing Display */}
                <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-gray-400 line-through text-lg">{formatPrice(ORIGINAL_PRICE)}</span>
                    <Badge className="bg-red-500 text-white text-xs">-{DISCOUNT_PERCENTAGE}%</Badge>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">{formatPrice(DISCOUNTED_PRICE)}</p>
                  <p className="text-xs text-gray-500 mt-1">Valor com desconto de indicado</p>
                </div>

                {/* Payment Breakdown */}
                <div className="mt-4 text-left bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Como funciona o pagamento:
                  </p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Sinal contratual para reserva de vaga:</span>
                      <span className="font-bold text-blue-700">{formatPrice(DEPOSIT_AMOUNT)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Saldo devedor:</span>
                        <span className="font-semibold text-gray-700">{formatPrice(REMAINING_AMOUNT)}</span>
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        Poderá ser pago no dia do curso, à vista ou em até 24x no cartão
                      </p>
                    </div>
                  </div>
                </div>

                {code && (
                  <Badge variant="outline" className="mt-3 border-blue-500 text-blue-600">
                    Indicado pelo código: {code}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Dr. João Silva"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="joao@email.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasCrm"
                        checked={formData.hasCrm}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, hasCrm: checked as boolean, crm: '' })
                        }
                      />
                      <Label htmlFor="hasCrm" className="text-sm cursor-pointer">
                        Sou médico e possuo CRM
                      </Label>
                    </div>

                    {formData.hasCrm && (
                      <div className="space-y-2">
                        <Label htmlFor="crm">Número do CRM</Label>
                        <div className="relative">
                          <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="crm"
                            placeholder="CRM/SP 123456"
                            className="pl-10"
                            value={formData.crm}
                            onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-base font-semibold"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Reservar Vaga por {formatPrice(DEPOSIT_AMOUNT)}
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Pagamento seguro via Stripe</span>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    O saldo de {formatPrice(REMAINING_AMOUNT)} será pago apenas no dia do curso.
                    Ao continuar, você concorda em receber contato da equipe IBRAMEC.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="mt-4 bg-[#0d1e36] border border-blue-900/50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-400 mb-3">Evento exclusivo para médicos</p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">3 dias presenciais</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">São Paulo/SP</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm">Garantia total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0d1e36] border-t border-blue-900/30 text-center py-8 mt-12">
        <img 
          src="https://ibramec.com/wp-content/uploads/2025/09/logo-branca-ibramec.webp" 
          alt="IBRAMEC" 
          className="h-8 object-contain mx-auto mb-4" 
        />
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} IBRAMEC - Instituto Brasileiro de Medicina Capilar</p>
        <p className="text-gray-600 text-xs">Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
