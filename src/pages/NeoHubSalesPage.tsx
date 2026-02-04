import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Users, GraduationCap, Building2, Zap, Scale, 
  CreditCard, Leaf, ArrowRight, Check, Star, Shield,
  MessageSquare, BarChart3, Calendar, FileText, Bot,
  Sparkles, Clock, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import iconeNeofolic from '@/assets/icone-neofolic.png';
import { VisionIcon } from '@/components/icons/VisionIcon';
import { FeatureCarousel } from '@/components/landing/FeatureCarousel';

// Módulos do NeoHub
const modules = [
  { 
    id: 'neocare', 
    name: 'NeoCare', 
    icon: Heart, 
    gradient: 'from-rose-500 to-pink-500',
    description: 'Portal do Paciente',
    features: [
      'Agendamento online 24/7',
      'Prontuário digital completo',
      'Teleconsulta integrada',
      'Lembretes automáticos',
      'Histórico de tratamentos'
    ]
  },
  { 
    id: 'neoteam', 
    name: 'NeoTeam', 
    icon: Users, 
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Portal do Colaborador',
    features: [
      'Gestão de equipe',
      'Escalas e turnos',
      'Comunicação interna',
      'Gamificação e metas',
      'Treinamentos online'
    ]
  },
  { 
    id: 'academy', 
    name: 'IBRAMEC', 
    icon: GraduationCap, 
    gradient: 'from-emerald-500 to-green-500',
    description: 'Academia de Ensino',
    features: [
      'Cursos certificados',
      'Materiais didáticos',
      'Avaliações online',
      'Certificados digitais',
      'Comunidade de alunos'
    ]
  },
  { 
    id: 'neolicense', 
    name: 'Licença', 
    icon: Building2, 
    gradient: 'from-amber-400 to-yellow-500',
    description: 'Portal do Licenciado',
    features: [
      'Gestão de franquias',
      'Padrões operacionais',
      'Suporte dedicado',
      'Relatórios de performance',
      'Manuais e protocolos'
    ]
  },
  { 
    id: 'avivar', 
    name: 'Avivar', 
    icon: Zap, 
    gradient: 'from-purple-500 to-violet-500',
    description: 'CRM + IA para Vendas',
    features: [
      'WhatsApp integrado',
      'Automações inteligentes',
      'Pipeline de vendas',
      'IA conversacional',
      'Cadências automáticas'
    ]
  },
  { 
    id: 'ipromed', 
    name: 'CPG Advocacia Médica', 
    icon: Scale, 
    gradient: 'from-cyan-500 to-cyan-600',
    description: 'Proteção Médico-Legal',
    features: [
      'Assessoria jurídica 24/7',
      'Defesa ética e cível',
      'Gestão de crise',
      'Documentação preventiva',
      'Parecer técnico'
    ]
  },
  { 
    id: 'vision', 
    name: 'Vision', 
    icon: VisionIcon, 
    gradient: 'from-pink-500 via-rose-500 to-orange-500',
    description: 'Diagnóstico por IA',
    features: [
      'Análise de imagens',
      'Classificação de calvície',
      'Relatórios automáticos',
      'Comparativo evolutivo',
      'Predições de resultado'
    ]
  },
  { 
    id: 'neopay', 
    name: 'NeoPay', 
    icon: CreditCard, 
    gradient: 'from-green-500 to-emerald-600',
    description: 'Gateway de Pagamentos',
    features: [
      'PIX e cartões',
      'Parcelamento inteligente',
      'Split de pagamentos',
      'Régua de cobrança',
      'Dashboard financeiro'
    ]
  },
  { 
    id: 'neohair', 
    name: 'NeoHair', 
    icon: Leaf, 
    gradient: 'from-teal-500 to-cyan-500',
    description: 'Tratamento Capilar',
    features: [
      'Protocolos clínicos',
      'Acompanhamento',
      'Produtos personalizados',
      'Resultados visuais',
      'Suporte especializado'
    ]
  },
];

// Planos de pagamento
const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para clínicas em crescimento',
    monthlyPrice: 997,
    yearlyPrice: 797,
    featured: false,
    modules: ['NeoCare', 'NeoTeam'],
    features: [
      'Até 500 pacientes',
      'Até 10 colaboradores',
      'Suporte por email',
      'Atualizações incluídas',
      'Backup diário'
    ],
    cta: 'Começar Agora'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Para clínicas estabelecidas',
    monthlyPrice: 2497,
    yearlyPrice: 1997,
    featured: true,
    modules: ['NeoCare', 'NeoTeam', 'Avivar', 'NeoPay', 'Vision'],
    features: [
      'Pacientes ilimitados',
      'Colaboradores ilimitados',
      'Suporte prioritário',
      'IA para diagnóstico',
      'CRM completo',
      'Gateway de pagamentos',
      'Integrações API'
    ],
    cta: 'Mais Popular'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solução completa para redes',
    monthlyPrice: 4997,
    yearlyPrice: 3997,
    featured: false,
    modules: ['Todos os 9 módulos'],
    features: [
      'Tudo do Professional +',
      'Multi-unidades',
      'Portal de licenciados',
      'Academia de ensino',
      'Proteção jurídica',
      'Gerente de sucesso',
      'SLA garantido',
      'Customizações'
    ],
    cta: 'Falar com Vendas'
  },
];

// KPIs
const kpis = [
  { value: '+500', label: 'Clínicas ativas' },
  { value: '98%', label: 'Satisfação' },
  { value: '24/7', label: 'Suporte' },
  { value: '+50k', label: 'Pacientes gerenciados' },
];

// FAQs
const faqs = [
  {
    question: 'Como funciona o período de teste?',
    answer: 'Oferecemos 14 dias de teste gratuito em todos os planos, sem necessidade de cartão de crédito. Você terá acesso completo a todas as funcionalidades do plano escolhido.'
  },
  {
    question: 'Posso mudar de plano depois?',
    answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor no próximo ciclo de cobrança.'
  },
  {
    question: 'Como funciona o suporte?',
    answer: 'Todos os planos incluem suporte por email. Planos Professional e Enterprise contam com suporte prioritário via chat e telefone, além de um gerente de sucesso dedicado no Enterprise.'
  },
  {
    question: 'Meus dados estão seguros?',
    answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta, servidores seguros e estamos em conformidade com a LGPD. Realizamos backups diários e temos redundância de dados.'
  },
  {
    question: 'Vocês oferecem treinamento?',
    answer: 'Sim! Oferecemos onboarding completo, materiais de treinamento, webinars semanais e uma base de conhecimento extensa. Planos Enterprise incluem treinamento presencial.'
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim, você pode cancelar sua assinatura a qualquer momento sem multas. Seu acesso continuará ativo até o final do período já pago.'
  },
];

// Carrosséis de funcionalidades
const dashboardCarouselSlides = [
  {
    title: 'Dashboard Geral',
    description: 'Visão completa de KPIs, agendamentos, receita e métricas em tempo real.',
    imagePlaceholder: 'Dashboard com métricas',
    placeholderType: 'dashboard-kpis' as const,
    features: ['KPIs em tempo real', 'Gráficos interativos', 'Filtros por período', 'Comparativo mensal']
  },
  {
    title: 'Calendário de Agendamentos',
    description: 'Visualize e gerencie todos os agendamentos em um calendário intuitivo.',
    imagePlaceholder: 'Calendário de consultas',
    placeholderType: 'dashboard-calendar' as const,
    features: ['Visão diária/semanal/mensal', 'Drag and drop', 'Cores por status', 'Conflitos automáticos']
  },
  {
    title: 'Gestão de Pacientes',
    description: 'Prontuário digital completo com histórico de tratamentos.',
    imagePlaceholder: 'Ficha do paciente',
    placeholderType: 'dashboard-patient' as const,
    features: ['Prontuário eletrônico', 'Fotos evolutivas', 'Histórico completo', 'Documentos anexos']
  },
];

const crmCarouselSlides = [
  {
    title: 'Pipeline de Vendas',
    description: 'Visualize todos os leads organizados por etapa do funil.',
    imagePlaceholder: 'Kanban de leads',
    placeholderType: 'crm-pipeline' as const,
    features: ['Drag and drop', 'Cores por temperatura', 'Valor estimado', 'Tempo em cada etapa']
  },
  {
    title: 'WhatsApp Integrado',
    description: 'Converse com leads diretamente pelo WhatsApp sem sair do sistema.',
    imagePlaceholder: 'Chat WhatsApp',
    placeholderType: 'crm-whatsapp' as const,
    features: ['Mensagens automáticas', 'Templates prontos', 'Anexos de mídia', 'Histórico completo']
  },
  {
    title: 'Detetive de Leads',
    description: 'IA que pesquisa e enriquece dados dos seus leads automaticamente.',
    imagePlaceholder: 'Relatório de lead',
    placeholderType: 'crm-detective' as const,
    features: ['Pesquisa automática', 'LinkedIn/Instagram', 'Score de qualificação', 'Insights de abordagem']
  },
];

const mobileCarouselSlides = [
  {
    title: 'Agendamento Online',
    description: 'Pacientes agendam consultas 24/7 direto pelo celular.',
    imagePlaceholder: 'Tela de agendamento',
    placeholderType: 'mobile-scheduling' as const,
    features: ['Horários disponíveis', 'Confirmação automática', 'Lembretes por SMS', 'Cancelamento fácil']
  },
  {
    title: 'Jornada do Paciente',
    description: 'Acompanhe cada etapa do tratamento com orientações automáticas.',
    imagePlaceholder: 'Timeline do paciente',
    placeholderType: 'mobile-journey' as const,
    features: ['Orientações pós-cirurgia', 'Lembretes de medicação', 'Progresso de recuperação', 'Suporte integrado']
  },
];

export default function NeoHubSalesPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={iconeNeofolic} alt="NeoHub" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-bold">
              Neo<span className="bg-gradient-to-b from-[#D4AF61] via-[#C9A86C] to-[#8B7355] bg-clip-text text-transparent">Hub</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-slate-400 hover:text-blue-400 transition-colors">Funcionalidades</a>
            <a href="#modulos" className="text-slate-400 hover:text-blue-400 transition-colors">Módulos</a>
            <a href="#planos" className="text-slate-400 hover:text-blue-400 transition-colors">Planos</a>
            <a href="#faq" className="text-slate-400 hover:text-blue-400 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10">
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <a href="#planos">Ver Planos</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/30 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Plataforma #1 para Clínicas de Transplante Capilar
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Gerencie sua clínica com
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              inteligência e eficiência
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10">
            O NeoHub reúne 9 módulos poderosos em uma única plataforma: CRM, agendamento, 
            prontuário, pagamentos, IA diagnóstica, proteção jurídica e muito mais.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6">
              <a href="#planos" className="flex items-center gap-2">
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-lg px-8 py-6">
              Agendar Demonstração
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="text-center p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                <p className="text-3xl md:text-4xl font-bold text-blue-400">
                  {kpi.value}
                </p>
                <p className="text-sm text-slate-500">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Carousels Section */}
      <section id="funcionalidades" className="py-20 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/30">
              Veja na Prática
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Conheça cada funcionalidade em detalhes
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Interface moderna, intuitiva e pensada para otimizar cada minuto do seu dia.
            </p>
          </div>

          {/* Dashboard Carousel */}
          <div className="mb-20">
            <FeatureCarousel
              title="Dashboard Principal"
              subtitle="Visão 360° da sua clínica com métricas em tempo real, agendamentos e faturamento."
              badge="NeoTeam"
              badgeColor="bg-blue-500"
              slides={dashboardCarouselSlides}
              imagePosition="left"
            />
          </div>

          {/* CRM Carousel */}
          <div className="mb-20">
            <FeatureCarousel
              title="CRM Completo + IA"
              subtitle="Acompanhe cada lead do primeiro contato até a conversão com inteligência artificial."
              badge="Avivar CRM"
              badgeColor="bg-purple-500"
              slides={crmCarouselSlides}
              imagePosition="right"
            />
          </div>

          {/* Mobile Carousel */}
          <div>
            <FeatureCarousel
              title="Experiência Mobile"
              subtitle="Pacientes agendam pelo celular, colaboradores acessam de qualquer lugar."
              badge="NeoCare Mobile"
              badgeColor="bg-rose-500"
              slides={mobileCarouselSlides}
              imagePosition="left"
            />
          </div>

          {/* Features Highlight */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Calendar, label: 'Agendamento Inteligente' },
              { icon: MessageSquare, label: 'WhatsApp Integrado' },
              { icon: BarChart3, label: 'Relatórios em Tempo Real' },
              { icon: Bot, label: 'IA para Diagnóstico' },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-colors">
                <feature.icon className="w-6 h-6 text-blue-400" />
                <span className="text-sm text-slate-300">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modulos" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/30">
              9 Módulos Integrados
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Tudo que sua clínica precisa
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Uma plataforma completa que conecta pacientes, colaboradores, alunos e parceiros 
              em uma experiência unificada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.id} className="bg-slate-900/50 border-slate-800 hover:border-blue-500/30 transition-all group">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${module.id === 'vision' ? 'text-amber-200' : 'text-white'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-white">{module.name}</CardTitle>
                        <CardDescription className="text-slate-500">{module.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {module.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                          <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/30">
                Por que NeoHub?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                A transformação digital que sua clínica merece
              </h2>
              <div className="space-y-6">
                {[
                  { icon: Bot, title: 'IA Avançada', description: 'Diagnóstico por imagem, chatbots inteligentes e automações que economizam horas do seu time.' },
                  { icon: Shield, title: 'Segurança Total', description: 'Dados criptografados, backup automático e conformidade LGPD garantida.' },
                  { icon: Clock, title: 'Economia de Tempo', description: 'Reduza em até 70% o tempo gasto em tarefas administrativas.' },
                  { icon: BarChart3, title: 'Decisões Inteligentes', description: 'Dashboards em tempo real com métricas que importam para seu negócio.' },
                ].map((benefit) => (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                      <p className="text-slate-500 text-sm">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4">
                  {modules.slice(0, 9).map((module) => {
                    const Icon = module.icon;
                    return (
                      <div 
                        key={module.id}
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer`}
                      >
                        <Icon className={`w-8 h-8 ${module.id === 'vision' ? 'text-amber-200' : 'text-white'}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/30">
              Planos e Preços
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
              Escolha o plano ideal para sua clínica
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-8">
              Comece com 14 dias grátis. Sem compromisso, sem cartão de crédito.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 p-1 bg-slate-900 border border-slate-800 rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Anual
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">-20%</Badge>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative bg-slate-900/50 border-slate-800 ${
                  plan.featured ? 'ring-2 ring-blue-500 scale-105' : ''
                }`}
              >
                {plan.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-500">{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-5xl font-bold text-white">
                      R$ {billingCycle === 'monthly' ? plan.monthlyPrice.toLocaleString('pt-BR') : plan.yearlyPrice.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-slate-500">/mês</span>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-emerald-400 mt-1">
                        Economia de R$ {((plan.monthlyPrice - plan.yearlyPrice) * 12).toLocaleString('pt-BR')}/ano
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Módulos incluídos:</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.modules.map((mod) => (
                        <Badge key={mod} variant="secondary" className="bg-slate-800 text-slate-400 border-slate-700">
                          {mod}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      plan.featured 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-slate-600 mt-8 text-sm">
            Todos os planos incluem suporte, atualizações e backup automático.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-slate-900/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/30">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Perguntas Frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`}
                className="bg-slate-900/50 border border-slate-800 rounded-lg px-6"
              >
                <AccordionTrigger className="text-white hover:text-blue-400 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-r from-blue-600/10 to-blue-500/5 border-y border-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Pronto para transformar sua clínica?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a mais de 500 clínicas que já utilizam o NeoHub para 
            crescer com inteligência e eficiência.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6">
              Começar Teste Grátis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-lg px-8 py-6">
              <MessageSquare className="w-5 h-5 mr-2" />
              Falar com Consultor
            </Button>
          </div>
          <p className="mt-6 text-sm text-slate-600">
            14 dias grátis • Sem cartão de crédito • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={iconeNeofolic} alt="NeoHub" className="w-8 h-8 rounded-lg" />
              <span className="font-semibold text-white">
                Neo<span className="text-blue-400">Hub</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacidade</Link>
              <Link to="/terms" className="hover:text-blue-400 transition-colors">Termos</Link>
              <span>© {new Date().getFullYear()} NeoHub. Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
