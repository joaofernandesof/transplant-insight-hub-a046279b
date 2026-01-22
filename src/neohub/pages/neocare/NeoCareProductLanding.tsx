import { useState } from 'react';
import { 
  Shield, Check, Camera, FileText, Bell, Clock, 
  Users, AlertTriangle, ChevronRight, Star, Phone,
  MessageSquare, BarChart3, Lock, Calendar,
  Stethoscope, Scissors, Syringe, Heart, ArrowRight,
  CheckCircle2, XCircle, Scale, FileCheck, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Protect Basic',
    price: 'R$ 549',
    period: '/mês',
    features: [
      'Pós-operatório automatizado',
      'Check-in diário',
      'Fotos obrigatórias',
      'Relatório jurídico final',
    ],
    popular: false,
  },
  {
    name: 'Protect Pro',
    price: 'R$ 1.199',
    period: '/mês',
    features: [
      'Tudo do Basic',
      'Protocolos customizados',
      'Score de risco',
      'Alertas avançados',
      'Histórico completo',
    ],
    popular: true,
  },
  {
    name: 'Protect Clinic',
    price: 'R$ 1.899',
    period: '/mês',
    features: [
      'Tudo do Pro',
      'Equipe multiusuário',
      'Clínicas de médio porte',
      'Suporte prioritário',
    ],
    popular: false,
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Cadastro do paciente',
    desc: 'Nome + telefone + protocolo do procedimento',
    icon: Users,
  },
  {
    step: 2,
    title: 'Acompanhamento automático',
    desc: 'Do D+1 ao D+10 (ou mais, se quiser)',
    icon: Calendar,
  },
  {
    step: 3,
    title: 'Check-in diário do paciente',
    desc: 'Seguiu orientações? Fotos obrigatórias?',
    icon: Camera,
  },
  {
    step: 4,
    title: 'Tudo documentado',
    desc: 'Envios, respostas, ausências e alertas',
    icon: FileCheck,
  },
  {
    step: 5,
    title: 'Relatório jurídico',
    desc: 'Dossiê completo para auditoria e defesa',
    icon: Scale,
  },
];

const segments = [
  { icon: Scissors, name: 'Transplante capilar' },
  { icon: Heart, name: 'Cirurgia plástica' },
  { icon: Stethoscope, name: 'Dermatologia' },
  { icon: Building2, name: 'Dentistas' },
  { icon: Syringe, name: 'Biomédicos / Injetores' },
  { icon: Building2, name: 'Clínicas ambulatoriais' },
];

export default function NeoCareProductLanding() {
  const [email, setEmail] = useState('');

  const scrollToPlans = () => {
    document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMi00VjI0SDI0djJoMTB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">NeoCare Protect</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Documente todo o<br />
            <span className="text-emerald-400">pós-operatório.</span><br />
            Reduza riscos jurídicos.<br />
            <span className="text-slate-400">Proteja sua clínica.</span>
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 max-w-2xl">
            A plataforma de compliance pós-procedimento que registra orientações, 
            adesão do paciente, fotos diárias e gera um <strong className="text-white">dossiê jurídico automático</strong>, 
            do D+1 ao D+10.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-emerald-500 hover:bg-emerald-600 text-lg h-14 px-8"
              onClick={scrollToPlans}
            >
              <Shield className="mr-2 h-5 w-5" />
              Quero proteger minha clínica
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-slate-500 text-slate-300 hover:bg-slate-800 text-lg h-14 px-8"
            >
              Ver como funciona
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              A verdade que ninguém fala
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O problema não é o procedimento
            </h2>
            <p className="text-xl text-muted-foreground">
              É o pós mal documentado. E o processo vem meses depois.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="pt-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Orientação verbal</h3>
                <p className="text-muted-foreground">Não prova nada em um tribunal</p>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="pt-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">WhatsApp solto</h3>
                <p className="text-muted-foreground">Não protege juridicamente</p>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="pt-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Prontuário genérico</h3>
                <p className="text-muted-foreground">Não sustenta defesa</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              👉 Sem prova, a clínica perde.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Shield className="h-3 w-3 mr-1" />
              A solução
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que a plataforma faz
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              { icon: Bell, title: 'Orientações diárias automáticas', desc: 'Enviadas no momento certo' },
              { icon: CheckCircle2, title: 'Declaração objetiva', desc: 'O paciente confirma adesão' },
              { icon: Camera, title: 'Fotos padronizadas', desc: 'Obrigatórias por protocolo' },
              { icon: FileText, title: 'Registro de sintomas', desc: 'Queixas documentadas' },
              { icon: MessageSquare, title: 'Tentativas de contato', desc: 'Tudo registrado' },
              { icon: Scale, title: 'Relatório jurídico final', desc: 'Dossiê completo' },
            ].map((item, idx) => (
              <Card key={idx} className="border-emerald-200 dark:border-emerald-800/50">
                <CardContent className="pt-6">
                  <item.icon className="h-8 w-8 text-emerald-500 mb-3" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Badge className="bg-emerald-500 text-white text-sm px-4 py-2">
              <Lock className="h-4 w-4 mr-2" />
              Tudo registrado, organizado e imutável
            </Badge>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-muted-foreground">Simples, automatizado e seguro</p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="relative">
                <Card className="h-full">
                  <CardContent className="pt-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mx-auto mb-3">
                      {step.step}
                    </div>
                    <step.icon className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
                {idx < howItWorks.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-emerald-400 h-6 w-6 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Differentiator */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Scale className="h-12 w-12 mx-auto mb-4 text-emerald-200" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Isso NÃO é um app de paciente
            </h2>
            <p className="text-xl text-emerald-100">
              É uma <strong>infraestrutura de prova</strong>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Prova de orientação',
              'Prova de tentativa de contato',
              'Prova de adesão ou não adesão',
              'Prova de acompanhamento ativo',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/10 rounded-lg p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-lg text-emerald-100">
              👉 A clínica fez a parte dela. Se o paciente não seguiu, <strong>está documentado</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Features */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4">
              <BarChart3 className="h-3 w-3 mr-1" />
              Dashboard
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo em um lugar
            </h2>
            <p className="text-muted-foreground">Sem planilha. Sem bagunça.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, title: 'Lista de pacientes por risco' },
              { icon: BarChart3, title: 'Score de adesão' },
              { icon: AlertTriangle, title: 'Alertas de intercorrência' },
              { icon: Camera, title: 'Fotos organizadas por dia' },
              { icon: Clock, title: 'Histórico completo' },
              { icon: FileText, title: 'Notas internas da equipe' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 border rounded-lg">
                <item.icon className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="font-medium">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Who */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Para quem é
            </h2>
            <p className="text-muted-foreground">
              Se existe pós-procedimento, existe risco. Se existe risco, isso é para você.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {segments.map((seg, idx) => (
              <Card key={idx} className="text-center">
                <CardContent className="pt-6">
                  <seg.icon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">{seg.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="plans" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4">Planos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Não cobramos por paciente
            </h2>
            <p className="text-xl text-muted-foreground">Cobramos por proteção.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={cn(
                  "relative",
                  plan.popular && "border-emerald-500 ring-2 ring-emerald-500/20"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500">
                      <Star className="h-3 w-3 mr-1" />
                      Mais popular
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-8">
                  <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={cn(
                      "w-full",
                      plan.popular 
                        ? "bg-emerald-500 hover:bg-emerald-600" 
                        : "bg-slate-900 hover:bg-slate-800"
                    )}
                  >
                    Começar agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center space-y-2 text-muted-foreground">
            <p>👉 Sem taxa de implantação. Sem custo por paciente.</p>
            <p>
              <strong>Enterprise:</strong> Multiunidades, contrato anual, SLA e customizações — 
              <Button variant="link" className="text-emerald-600 p-0 h-auto">
                Fale conosco
              </Button>
            </p>
          </div>
        </div>
      </section>

      {/* Why it Works */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que funciona
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              'Automatiza o que ninguém faz bem',
              'Remove falha humana',
              'Padroniza conduta',
              'Cria prova',
              'Reduz conflito',
              'Protege reputação',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-background rounded-lg border">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h2 className="text-2xl font-bold mb-6">Recorrência e Segurança</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              'Histórico salvo na plataforma',
              'Relatórios com assinatura ativa',
              'Dados protegidos',
              'Auditoria completa de ações',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 border rounded-lg text-left">
                <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sua clínica já faz procedimentos.
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Agora precisa provar que acompanhou o pós.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-emerald-500 hover:bg-emerald-600 text-lg h-14 px-8"
            >
              <Shield className="mr-2 h-5 w-5" />
              Ver a plataforma funcionando
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-slate-500 text-slate-300 hover:bg-slate-800 text-lg h-14 px-8"
            >
              <Phone className="mr-2 h-5 w-5" />
              Agendar demonstração
            </Button>
          </div>
          
          <div className="border-t border-slate-700 pt-8">
            <blockquote className="text-2xl md:text-3xl font-medium italic text-slate-300">
              "Você não perde processos pelo que fez.<br />
              <span className="text-emerald-400">Perde pelo que não consegue provar."</span>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <span className="font-semibold text-foreground">NeoCare Protect</span>
          </div>
          <p>© 2025 NeoCare. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
