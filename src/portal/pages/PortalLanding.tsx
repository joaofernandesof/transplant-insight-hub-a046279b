import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, FileText, Shield, Video, MessageSquare, 
  Clock, Heart, Users, Star, CheckCircle2, ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Agendamento Online 24/7',
    description: 'Agende suas consultas e procedimentos a qualquer hora, de qualquer lugar.',
  },
  {
    icon: FileText,
    title: 'Prontuário Digital',
    description: 'Acesse seus documentos, exames e histórico médico de forma segura.',
  },
  {
    icon: Video,
    title: 'Teleconsulta',
    description: 'Consultas por vídeo com nossos especialistas sem sair de casa.',
  },
  {
    icon: MessageSquare,
    title: 'Chat Direto',
    description: 'Comunique-se diretamente com a clínica pelo WhatsApp integrado.',
  },
  {
    icon: Shield,
    title: 'Segurança LGPD',
    description: 'Seus dados protegidos seguindo as normas da Lei Geral de Proteção de Dados.',
  },
  {
    icon: Clock,
    title: 'Lembretes Automáticos',
    description: 'Receba lembretes de consultas e orientações pré e pós procedimento.',
  },
];

const benefits = [
  'Resultados naturais e permanentes',
  'Equipe médica especializada',
  'Tecnologia de ponta',
  'Acompanhamento personalizado',
  'Mais de 5.000 procedimentos realizados',
  'Satisfação de 98% dos pacientes',
];

export default function PortalLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl">Portal Neo Folic</h1>
              <p className="text-xs text-muted-foreground">Clínica de Transplante Capilar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/portal/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link to="/portal/register">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Sua jornada para a 
              <span className="text-primary"> autoestima</span> começa aqui
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              O Portal Neo Folic oferece uma experiência completa para pacientes e profissionais. 
              Agende consultas, acompanhe seu tratamento e comunique-se com nossa equipe de forma simples e segura.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/portal/register">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/portal/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="text-center p-8">
                <Users className="h-24 w-24 mx-auto text-primary mb-4" />
                <p className="text-4xl font-bold text-primary">5.000+</p>
                <p className="text-muted-foreground">Pacientes Atendidos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Tudo em um só lugar</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nosso portal oferece todas as ferramentas que você precisa para gerenciar sua jornada de tratamento capilar.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-6">Por que escolher a Neo Folic?</h3>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 text-primary-foreground">
            <Star className="h-12 w-12 mb-4" />
            <p className="text-5xl font-bold mb-2">98%</p>
            <p className="text-xl mb-4">de satisfação dos pacientes</p>
            <p className="opacity-90">
              Nossos resultados falam por si. Confie em quem entende de transplante capilar.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Pronto para começar?</h3>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Crie sua conta gratuitamente e tenha acesso a todas as funcionalidades do Portal Neo Folic.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/portal/register">
              Criar Minha Conta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-semibold">Portal Neo Folic</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Neo Folic. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link to="/portal/privacy" className="hover:text-foreground">Privacidade</Link>
              <Link to="/portal/terms" className="hover:text-foreground">Termos</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
