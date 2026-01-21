import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, FileText, Bell, MessageSquare, Shield, 
  Clock, Smartphone, Heart, CheckCircle2, ArrowRight,
  Play, Star, Users, Award, Film
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoNeofolic from '@/assets/logo-byneofolic.png';
import { useVideos, Video } from '@/hooks/useVideos';
import { VideoPlayer } from '@/components/VideoPlayer';

const features = [
  {
    icon: Calendar,
    title: 'Agendamento Online',
    description: 'Agende suas consultas e retornos diretamente pelo app, 24 horas por dia.',
    color: 'bg-emerald-500',
  },
  {
    icon: FileText,
    title: 'Documentos Digitais',
    description: 'Acesse exames, receitas e contratos de forma segura em um só lugar.',
    color: 'bg-blue-500',
  },
  {
    icon: Bell,
    title: 'Lembretes Automáticos',
    description: 'Receba notificações de consultas e orientações no WhatsApp e email.',
    color: 'bg-amber-500',
  },
  {
    icon: Heart,
    title: 'Orientações Pós-Operatórias',
    description: 'Guia completo de recuperação com timeline personalizada para seu procedimento.',
    color: 'bg-rose-500',
  },
];

const benefits = [
  'Acesso 24h aos seus documentos médicos',
  'Agendamento sem precisar ligar',
  'Lembretes automáticos de consultas',
  'Orientações pós-procedimento atualizadas',
  'Comunicação direta com a clínica',
  'Histórico completo de atendimentos',
];

const testimonials = [
  {
    name: 'Carlos M.',
    procedure: 'Transplante FUE',
    text: 'O app me ajudou muito na recuperação. As orientações diárias foram essenciais!',
    rating: 5,
  },
  {
    name: 'Roberto S.',
    procedure: 'Transplante Capilar',
    text: 'Poder agendar retornos pelo celular facilita muito minha rotina corrida.',
    rating: 5,
  },
  {
    name: 'André L.',
    procedure: 'Avaliação + Procedimento',
    text: 'Documentos sempre à mão. Não preciso mais guardar papelada.',
    rating: 5,
  },
];

export default function NeoCareLanding() {
  const navigate = useNavigate();
  const { videos } = useVideos('apresentacao');
  const [showVideo, setShowVideo] = useState(false);
  
  // Get the first "apresentacao" video for the landing page
  const featuredVideo = videos.find(v => v.tags?.includes('neocare')) || videos[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg">NeoCare</span>
              <span className="text-xs text-muted-foreground block -mt-1">Portal do Paciente</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              Acessar Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-1">
                ✨ Novo Portal do Paciente
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Sua jornada de{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-600">
                  recuperação capilar
                </span>{' '}
                na palma da mão
              </h1>
              
              <p className="text-xl text-muted-foreground">
                Agende consultas, acesse seus documentos e acompanhe suas orientações 
                pós-procedimento de forma simples e segura.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-lg h-14 px-8"
                >
                  Acessar Minha Conta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg h-14 px-8"
                  onClick={() => setShowVideo(true)}
                  disabled={!featuredVideo}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Ver Como Funciona
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-background flex items-center justify-center text-white text-xs font-bold"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    +2.000 pacientes ativos
                  </p>
                </div>
              </div>
            </div>
            
            {/* Hero Image/Illustration */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-3xl blur-3xl" />
              <Card className="relative overflow-hidden border-2 border-emerald-500/20">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Heart className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold">Próximo Agendamento</p>
                        <p className="text-sm opacity-90">Segunda, 10:00</p>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="font-medium">Dr. Ricardo Mendes</p>
                      <p className="text-sm opacity-90">Consulta de Retorno</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Clock className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="font-medium text-sm">Dia 5 de Recuperação</p>
                        <p className="text-xs text-muted-foreground">Primeira lavagem liberada!</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-auto" />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Novo Documento</p>
                        <p className="text-xs text-muted-foreground">Receita médica disponível</p>
                      </div>
                      <Badge variant="secondary">Novo</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section - Only show if there's a featured video and user clicked */}
      {showVideo && featuredVideo && (
        <section className="py-12 px-4 bg-muted/50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <Badge className="mb-4">
                <Film className="h-3 w-3 mr-1" />
                Vídeo de Apresentação
              </Badge>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                {featuredVideo.title}
              </h2>
              {featuredVideo.description && (
                <p className="text-muted-foreground">{featuredVideo.description}</p>
              )}
            </div>
            <Card className="overflow-hidden">
              <VideoPlayer video={featuredVideo} autoPlay className="w-full" />
            </Card>
            <div className="text-center mt-6">
              <Button variant="ghost" onClick={() => setShowVideo(false)}>
                Fechar vídeo
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4">Funcionalidades</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Desenvolvemos o NeoCare pensando na sua experiência e comodidade durante 
              todo o processo de tratamento capilar.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className={`${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Benefícios
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Por que usar o NeoCare?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Simplifique sua jornada de recuperação e tenha controle total sobre 
                seu tratamento capilar.
              </p>
              
              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <Users className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">2.000+</p>
                <p className="text-sm text-muted-foreground">Pacientes Ativos</p>
              </Card>
              <Card className="p-6 text-center">
                <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">5.000+</p>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
              </Card>
              <Card className="p-6 text-center">
                <FileText className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">10.000+</p>
                <p className="text-sm text-muted-foreground">Documentos</p>
              </Card>
              <Card className="p-6 text-center">
                <Award className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-3xl font-bold">98%</p>
                <p className="text-sm text-muted-foreground">Satisfação</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4">Depoimentos</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              O que nossos pacientes dizem
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                <div className="border-t pt-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.procedure}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Seus dados estão seguros
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            O NeoCare utiliza criptografia de ponta e segue todas as normas da LGPD 
            para garantir a privacidade e segurança das suas informações médicas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Criptografia SSL
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Conformidade LGPD
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Dados Protegidos
            </Badge>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-12 text-center text-white">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Pronto para começar?
              </h2>
              <p className="text-xl opacity-90 mb-8 max-w-xl mx-auto">
                Acesse agora o portal do paciente e tenha controle total sobre 
                sua jornada de recuperação capilar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate('/login')}
                  className="text-lg h-14 px-8"
                >
                  <Smartphone className="mr-2 h-5 w-5" />
                  Acessar Portal
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                  className="text-lg h-14 px-8 bg-transparent border-white text-white hover:bg-white/10"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Falar com a Clínica
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold">NeoCare</span>
                <span className="text-xs text-muted-foreground block">Portal do Paciente</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Powered by</span>
              <img src={logoNeofolic} alt="ByNeoFolic" className="h-6" />
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NeoFolic. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
