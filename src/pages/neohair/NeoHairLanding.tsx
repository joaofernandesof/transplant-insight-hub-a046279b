import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Shield, 
  Clock, 
  Microscope,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

const features = [
  {
    icon: Microscope,
    title: 'Avaliação Inteligente',
    description: 'Análise precisa do seu grau de calvície com tecnologia de ponta'
  },
  {
    icon: Sparkles,
    title: 'Tratamento Personalizado',
    description: 'Recomendação automática do kit ideal para seu caso'
  },
  {
    icon: TrendingUp,
    title: 'Acompanhamento de Evolução',
    description: 'Veja sua melhora mês a mês com comparativos visuais'
  },
  {
    icon: Shield,
    title: 'Critérios Clínicos',
    description: 'Baseado em protocolos médicos e evidências científicas'
  }
];

const stats = [
  { value: '97%', label: 'Satisfação' },
  { value: '15mil+', label: 'Pacientes' },
  { value: '89%', label: 'Melhora Visível' },
  { value: '4.9', label: 'Avaliação', icon: Star },
];

export default function NeoHairLanding() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();

  const handleStart = () => {
    if (user) {
      navigate('/neohair/avaliacao');
    } else {
      navigate('/login', { state: { from: '/neohair/avaliacao' } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-teal-950/30 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-32">
          <div className="text-center space-y-8">
            {/* Badge */}
            <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-2" />
              Avaliação Capilar Inteligente
            </Badge>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Descubra o melhor
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                tratamento capilar
              </span>
              <br />
              para você
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              O NeoHair avalia seu grau de calvície, indica o tratamento ideal e 
              acompanha sua evolução. Tudo personalizado, seguro e baseado em critérios clínicos.
            </p>
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                onClick={handleStart}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-6 text-lg shadow-lg shadow-teal-500/25"
              >
                Iniciar Avaliação Capilar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/neohair/loja')}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg"
              >
                Ver Tratamentos
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-500" />
                <span>Avaliação gratuita</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-500" />
                <span>Resultado em 5 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-500" />
                <span>100% confidencial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl md:text-4xl font-bold text-white">{stat.value}</span>
                  {stat.icon && <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />}
                </div>
                <p className="text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Como funciona
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Um processo simples e científico para recuperar sua confiança
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-slate-900/50 border-slate-800 hover:border-teal-500/50 transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Seu caminho para a recuperação
            </h2>
          </div>
          
          <div className="space-y-8">
            {[
              { step: '1', title: 'Faça sua avaliação', desc: 'Envie fotos e responda um questionário simples' },
              { step: '2', title: 'Receba seu diagnóstico', desc: 'Análise automática do seu grau de calvície e perfil' },
              { step: '3', title: 'Escolha seu tratamento', desc: 'Kits personalizados com base no seu caso' },
              { step: '4', title: 'Acompanhe sua evolução', desc: 'Reavaliações mensais e comparativos visuais' },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg"
              onClick={handleStart}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8"
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 text-teal-400 mb-4">
            <Award className="h-5 w-5" />
            <span className="text-sm font-medium">Plataforma líder em tratamento capilar</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Dê o próximo passo para recuperar sua confiança
          </h2>
          <p className="text-slate-400 mb-8">
            Milhares de pessoas já transformaram sua autoestima com o NeoHair
          </p>
          <Button 
            size="lg"
            onClick={handleStart}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-10 py-6 text-lg"
          >
            Iniciar Avaliação Gratuita
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800 text-center text-sm text-slate-500">
        <p>© 2026 NeoHair - Parte do ecossistema NeoHub</p>
      </footer>
    </div>
  );
}
