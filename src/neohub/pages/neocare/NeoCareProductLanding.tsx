import { useState } from 'react';
import { 
  Shield, Check, Camera, FileText, Bell, Clock, 
  Users, AlertTriangle, ChevronRight, Star, Phone,
  MessageSquare, BarChart3, Lock, Calendar,
  Stethoscope, Scissors, Syringe, Heart, ArrowRight,
  CheckCircle2, XCircle, Scale, FileCheck, Building2,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import skorynLogo from '@/assets/skoryn-logo.jpg';

const plans = [
  {
    name: 'Starter',
    price: 'R$ 549',
    period: '/mês',
    features: [
      'Pós-procedimento automatizado',
      'Check-in diário do paciente',
      'Fotos obrigatórias por protocolo',
      'Relatório jurídico final',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    price: 'R$ 1.199',
    period: '/mês',
    features: [
      'Tudo do Starter',
      'Protocolos customizados',
      'Score de risco em tempo real',
      'Alertas avançados',
      'Histórico completo',
    ],
    popular: true,
  },
  {
    name: 'Clinic',
    price: 'R$ 1.899',
    period: '/mês',
    features: [
      'Tudo do Professional',
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
    desc: 'Do D+1 ao D+10 (ou mais, configurável)',
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
    title: 'Dossiê jurídico',
    desc: 'Relatório completo para auditoria e defesa',
    icon: Scale,
  },
];

const segments = [
  { icon: Scissors, name: 'Transplante capilar' },
  { icon: Heart, name: 'Cirurgia plástica' },
  { icon: Stethoscope, name: 'Dermatologia' },
  { icon: Building2, name: 'Odontologia' },
  { icon: Syringe, name: 'Biomédicos / Harmonização' },
  { icon: Building2, name: 'Clínicas ambulatoriais' },
];

export default function NeoCareProductLanding() {
  const [email, setEmail] = useState('');

  const scrollToPlans = () => {
    document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={skorynLogo} alt="SKORYN" className="h-10 object-contain" />
          <div className="hidden md:flex items-center gap-6 text-slate-300 text-sm">
            <button onClick={scrollToHowItWorks} className="hover:text-white transition">Como funciona</button>
            <button onClick={scrollToPlans} className="hover:text-white transition">Planos</button>
          </div>
          <Button 
            size="sm" 
            className="bg-emerald-500 hover:bg-emerald-600"
            onClick={scrollToPlans}
          >
            Começar agora
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMi00VjI0SDI0djJoMTB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-slate-700/50 text-slate-300 border-slate-600">
              Plataforma de Governança Pós-Procedimento
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
              A clínica faz o procedimento.<br />
              <span className="text-emerald-400">A SKORYN garante o que acontece depois.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
              SaaS que padroniza, automatiza e documenta todo o pós-procedimento médico e estético, 
              garantindo <strong className="text-white">orientação contínua ao paciente</strong> e 
              <strong className="text-white"> segurança clínica, jurídica e operacional</strong> para a clínica.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-600 text-lg h-14 px-8"
                onClick={scrollToPlans}
              >
                <Shield className="mr-2 h-5 w-5" />
                Proteger minha clínica
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-slate-500 text-slate-300 hover:bg-slate-800 text-lg h-14 px-8"
                onClick={scrollToHowItWorks}
              >
                <Play className="mr-2 h-5 w-5" />
                Ver como funciona
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* One-liner Value Prop */}
      <section className="py-8 bg-slate-800 border-y border-slate-700">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-slate-300 text-lg md:text-xl">
            <span className="text-emerald-400 font-semibold">SKORYN</span> — 
            Padroniza conduta. Documenta adesão. Gera prova. Reduz conflito.
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="h-3 w-3 mr-1" />
              O problema que ninguém resolve
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
                <p className="text-muted-foreground">Não tem rastreabilidade jurídica</p>
              </CardContent>
            </Card>
            
            <Card className="border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="pt-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Prontuário genérico</h3>
                <p className="text-muted-foreground">Não documenta o dia a dia</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center bg-red-100 dark:bg-red-950/30 rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              👉 Sem prova de acompanhamento, a clínica perde.
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
              A solução SKORYN
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Infraestrutura completa de governança pós-procedimento
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[
              { icon: Bell, title: 'Orientações diárias automáticas', desc: 'Enviadas no momento certo, por protocolo' },
              { icon: CheckCircle2, title: 'Declaração de adesão', desc: 'O paciente confirma que seguiu as instruções' },
              { icon: Camera, title: 'Fotos padronizadas', desc: 'Registro visual obrigatório por dia' },
              { icon: FileText, title: 'Registro de sintomas', desc: 'Queixas e intercorrências documentadas' },
              { icon: MessageSquare, title: 'Tentativas de contato', desc: 'Toda comunicação registrada' },
              { icon: Scale, title: 'Dossiê jurídico final', desc: 'Relatório completo pronto para auditoria' },
            ].map((item, idx) => (
              <Card key={idx} className="border-emerald-200 dark:border-emerald-800/50 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <item.icon className="h-10 w-10 text-emerald-500 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Badge className="bg-slate-900 dark:bg-slate-700 text-white text-sm px-6 py-3">
              <Lock className="h-4 w-4 mr-2" />
              Tudo registrado, organizado e com validade jurídica
            </Badge>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como a SKORYN funciona
            </h2>
            <p className="text-muted-foreground text-lg">Simples de implementar. Automático de operar.</p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            {howItWorks.map((step, idx) => (
              <div key={idx} className="relative">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                      {step.step}
                    </div>
                    <step.icon className="h-8 w-8 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
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
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Scale className="h-16 w-16 mx-auto mb-6 text-emerald-400" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Isso NÃO é um app de paciente
            </h2>
            <p className="text-xl text-slate-300">
              É uma <strong className="text-emerald-400">infraestrutura de prova e governança</strong>
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              'Prova de orientação enviada',
              'Prova de tentativa de contato',
              'Prova de adesão ou não adesão',
              'Prova de acompanhamento ativo',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="text-center bg-slate-800/50 rounded-xl p-8 max-w-3xl mx-auto">
            <p className="text-xl text-slate-200 mb-4">
              A clínica fez a parte dela.
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              Se o paciente não seguiu, está documentado.
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
              Painel de Controle
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Gestão completa em um único lugar
            </h2>
            <p className="text-muted-foreground text-lg">Sem planilha. Sem bagunça. Sem perda de informação.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, title: 'Lista de pacientes por risco' },
              { icon: BarChart3, title: 'Score de adesão em tempo real' },
              { icon: AlertTriangle, title: 'Alertas de intercorrência' },
              { icon: Camera, title: 'Galeria de fotos por dia' },
              { icon: Clock, title: 'Timeline completa do paciente' },
              { icon: FileText, title: 'Notas internas da equipe' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-5 border rounded-xl hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <item.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-lg">{item.title}</span>
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
              Para quem é a SKORYN
            </h2>
            <p className="text-muted-foreground text-lg">
              Se existe pós-procedimento, existe risco. Se existe risco, isso é para você.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {segments.map((seg, idx) => (
              <Card key={idx} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 pb-6">
                  <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full w-fit mx-auto mb-3">
                    <seg.icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
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
            <p className="text-xl text-muted-foreground">Cobramos por proteção. Uso ilimitado.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={cn(
                  "relative",
                  plan.popular && "border-emerald-500 ring-2 ring-emerald-500/20 scale-105"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">
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
                        : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
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
              <Button variant="link" className="text-emerald-600 p-0 h-auto ml-1">
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
              Por que a SKORYN funciona
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              'Automatiza o que ninguém faz bem',
              'Remove falha humana',
              'Padroniza conduta clínica',
              'Cria prova jurídica',
              'Reduz conflito com paciente',
              'Protege reputação da clínica',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-background rounded-lg border hover:shadow-md transition-shadow">
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
          <h2 className="text-2xl font-bold mb-6">Segurança e Conformidade</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              'Dados protegidos e criptografados',
              'Histórico imutável e auditável',
              'Relatórios com validade jurídica',
              'Backup automático diário',
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
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <img src={skorynLogo} alt="SKORYN" className="h-16 mx-auto mb-8 object-contain" />
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            A clínica faz o procedimento.
          </h2>
          <p className="text-2xl text-emerald-400 font-semibold mb-8">
            A SKORYN garante o que acontece depois.
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
            <blockquote className="text-xl md:text-2xl font-medium italic text-slate-300">
              "Você não perde processos pelo que fez.<br />
              <span className="text-emerald-400">Perde pelo que não consegue provar."</span>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={skorynLogo} alt="SKORYN" className="h-8 object-contain" />
          </div>
          <p className="mb-2">Plataforma de Governança Pós-Procedimento</p>
          <p>© 2025 SKORYN. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
