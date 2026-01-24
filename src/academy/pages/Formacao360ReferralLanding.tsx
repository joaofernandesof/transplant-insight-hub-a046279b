import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Calendar
} from 'lucide-react';
import { useSubmitReferral } from '../hooks/useStudentReferrals';
import ibramecLogo from '@/assets/ibramec-logo.png';
import formacao360Logo from '@/assets/logo-formacao-360.png';

// Promotion deadline: 25/01/2026 at 23:59 BRT (UTC-3)
const PROMO_DEADLINE = new Date('2026-01-26T02:59:00.000Z');

export function Formacao360ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const submitReferral = useSubmitReferral();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hasCrm: false,
    crm: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

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
      return;
    }

    try {
      await submitReferral.mutateAsync({
        referralCode: code || 'DIRECT',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        hasCrm: formData.hasCrm,
        crm: formData.crm,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting:', error);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Inscrição Recebida!</h1>
            <p className="text-muted-foreground mb-6">
              Obrigado pelo seu interesse na Formação 360 em Transplante Capilar.
              Nossa equipe entrará em contato em breve para apresentar todos os detalhes do curso.
            </p>
            <Badge className="bg-emerald-500 text-white mb-4">
              Código de indicação: {code}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Aguarde nosso contato via WhatsApp ou e-mail nas próximas 24 horas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900">
      {/* Header */}
      <header className="p-4 flex items-center justify-center">
        <img src={ibramecLogo} alt="IBRAMEC" className="h-10 object-contain bg-white rounded-lg px-4 py-2" />
      </header>

      {/* Promo Banner */}
      {isPromoActive && countdown && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-3 px-4 text-center text-white">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">PROMOÇÃO: Comissão de 10% no PIX para quem indicar!</span>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1">
              <Timer className="h-4 w-4" />
              <span className="font-mono font-bold">
                {String(countdown.hours).padStart(2, '0')}:
                {String(countdown.minutes).padStart(2, '0')}:
                {String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left - Course Info */}
          <div className="text-white space-y-6">
            <div className="flex items-center gap-4">
              <img src={formacao360Logo} alt="Formação 360" className="h-16 object-contain" />
            </div>
            
            <div>
              <Badge className="bg-white/20 text-white mb-4">Você foi indicado!</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                Formação 360° em Transplante Capilar
              </h1>
              <p className="text-lg text-white/80">
                O programa mais completo de formação em transplante capilar do Brasil.
                Aprenda com os melhores especialistas e transforme sua carreira.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                <Clock className="h-6 w-6 text-emerald-400" />
                <div>
                  <p className="font-medium">60 Horas</p>
                  <p className="text-sm text-white/70">Carga horária total</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                <Users className="h-6 w-6 text-emerald-400" />
                <div>
                  <p className="font-medium">Turmas Reduzidas</p>
                  <p className="text-sm text-white/70">Máximo 12 alunos</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                <Stethoscope className="h-6 w-6 text-emerald-400" />
                <div>
                  <p className="font-medium">Hands-On Completo</p>
                  <p className="text-sm text-white/70">Prática em pacientes reais</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                <Award className="h-6 w-6 text-emerald-400" />
                <div>
                  <p className="font-medium">Certificação</p>
                  <p className="text-sm text-white/70">Reconhecida nacionalmente</p>
                </div>
              </div>
            </div>

            {/* Benefits List */}
            <div className="bg-white/10 rounded-xl p-6 space-y-3">
              <h3 className="font-semibold text-lg mb-4">O que você vai aprender:</h3>
              {[
                'Técnicas FUE e FUT completas',
                'Desenho de linha frontal',
                'Anestesia e sedação',
                'Gestão de clínica capilar',
                'Marketing médico especializado',
                'Pós-operatório e acompanhamento',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="bg-white/10 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="italic text-white/90 mb-3">
                "A Formação 360 mudou minha carreira. Em 6 meses após o curso, já recuperei o investimento 
                e hoje tenho uma clínica própria com agenda cheia."
              </p>
              <p className="text-sm text-white/70">— Dr. Rafael M., Turma 2025</p>
            </div>
          </div>

          {/* Right - Form */}
          <div className="lg:sticky lg:top-8">
            <Card className="shadow-2xl">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <GraduationCap className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Quero Saber Mais</CardTitle>
                <CardDescription>
                  Preencha seus dados e nossa equipe entrará em contato
                </CardDescription>
                {code && (
                  <Badge variant="outline" className="mt-2">
                    Indicado por: {code}
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
                    disabled={submitReferral.isPending}
                  >
                    {submitReferral.isPending ? (
                      'Enviando...'
                    ) : (
                      <>
                        Quero Receber Informações
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Ao enviar, você concorda em receber contato da equipe IBRAMEC.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Next Class Info */}
            <div className="mt-4 bg-white/10 backdrop-blur rounded-xl p-4 text-white text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <span className="font-medium">Próximas Turmas</span>
              </div>
              <p className="text-sm text-white/80">
                Consulte as datas disponíveis com nossa equipe
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-white/60 text-sm">
        <p>© {new Date().getFullYear()} IBRAMEC - Instituto Brasileiro de Medicina Capilar</p>
        <p>Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
