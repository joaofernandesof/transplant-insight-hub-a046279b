 import React from 'react';
 import { Link } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { 
   CheckCircle2, 
   X, 
   ArrowRight, 
   MessageSquare, 
   Zap, 
   Users, 
   Shield, 
   Clock,
   Target,
   TrendingUp,
   Bot,
   Calendar,
   BarChart3,
   Settings,
   Sparkles,
   Flame
 } from 'lucide-react';
 
 const painPoints = [
   'O lead esfria rápido',
   'Demorar para responder custa cirurgia',
   'O WhatsApp vira bagunça',
   'O time não segue padrão',
   'O follow up depende de alguém lembrar'
 ];
 
 const solutions = [
   { icon: Target, text: 'Transplante capilar' },
   { icon: Sparkles, text: 'Tratamentos capilares' },
   { icon: Calendar, text: 'Consultas de tricologia' },
   { icon: TrendingUp, text: 'Vendas de alto ticket' },
   { icon: Clock, text: 'Follow ups longos' },
   { icon: Users, text: 'Decisão assistida do paciente' }
 ];
 
 const plans = [
   {
     id: 'start',
     name: 'Start Capilar',
     description: 'Para médicos e clínicas que querem organizar o atendimento capilar.',
     price: '297',
     highlighted: false,
     includes: [
       'CRM capilar completo',
       'Cadastro de leads e pacientes',
       'Funil de vendas capilar padrão',
       'Kanban visual por etapa do tratamento',
       'Integração com WhatsApp',
       'Histórico completo de conversas',
       'Relatórios básicos de atendimento',
       'Onboarding 100% automático'
     ],
     excludes: [
       'Inteligência Artificial',
       'Agentes automáticos',
       'Integrações avançadas',
       'Suporte humano dedicado'
     ]
   },
   {
     id: 'pro',
     name: 'Pro Capilar',
     description: 'Para clínicas que já investem em tráfego e querem vender mais transplantes.',
     price: '797',
     highlighted: true,
     badge: 'Mais escolhido',
     includes: [
       'Tudo do plano Start, mais:',
       'IA básica para atendimento capilar',
       'IA para respostas automáticas no WhatsApp',
       'IA para triagem de leads de transplante',
       'Templates inteligentes de mensagens capilares',
       'Organização automática de conversas',
       'Relatórios avançados de performance',
       'Suporte padrão'
     ],
     excludes: []
   },
   {
     id: 'elite',
     name: 'Elite Capilar',
     description: 'Para clínicas capilares que querem escala e previsibilidade de cirurgias.',
     price: '1.697',
     highlighted: false,
     includes: [
       'Tudo do plano Pro, mais:',
       'IA avançada treinada para transplante capilar',
       'Agente de qualificação automática de leads',
       'Agente de follow up automático',
       'Agente de recuperação de leads perdidos',
       'IA com memória de contexto do paciente',
       'Dashboards premium de vendas e cirurgias',
       'Prioridade no suporte',
       'Automação avançada de processos'
     ],
     excludes: []
   }
 ];
 
 const implementations = [
   {
     name: 'Implementação PRO Capilar',
     price: 'a partir de R$ 6.000'
   },
   {
     name: 'Implementação ELITE Capilar',
     price: 'a partir de R$ 12.000'
   }
 ];
 
 const targetAudience = [
   'Médicos capilares',
   'Clínicas de transplante capilar',
   'Clínicas de tratamento capilar',
   'Alunos e ex alunos de formação capilar'
 ];
 
 const trialFeatures = [
   'Acesso ao CRM capilar',
   'Funil padrão',
   'WhatsApp conectado',
   'IA básica limitada'
 ];
 
 const securityFeatures = [
   'Login individual',
   'Controle de acessos por usuário',
   'Dados protegidos',
   'Cancelamento simples e sem burocracia'
 ];
 
 export default function AvivarCapilarLanding() {
   const handleWhatsApp = (planName?: string) => {
     const message = planName 
       ? `Olá! Tenho interesse no ${planName} do Avivar CRM Capilar`
       : 'Olá! Tenho interesse no Avivar CRM Capilar';
     window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(message)}`, '_blank');
   };
 
   return (
     <div className="min-h-screen bg-slate-950 text-white">
       {/* Header */}
       <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
               <Flame className="h-6 w-6 text-white" />
             </div>
             <div>
               <span className="font-bold text-xl text-white">Avivar</span>
               <span className="text-amber-500 font-semibold ml-1">CRM Capilar</span>
             </div>
           </div>
           <Button 
             className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
             onClick={() => handleWhatsApp()}
           >
             Criar conta grátis
           </Button>
         </div>
       </header>
 
       {/* Hero Section */}
       <section className="py-20 px-4 sm:px-6 lg:px-8">
         <div className="max-w-4xl mx-auto text-center">
           <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-6">
             Exclusivo para Clínicas Capilares
           </Badge>
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
             O CRM capilar com IA criado para transformar{' '}
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
               leads em pacientes de transplante
             </span>
           </h1>
           <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
             O Avivar CRM Capilar organiza seu atendimento, acelera respostas no WhatsApp e automatiza follow ups para você vender mais transplantes, tratamentos e consultas, com processo e previsibilidade.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
             <Button 
               size="lg"
               className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-lg px-8"
               onClick={() => handleWhatsApp()}
             >
               Criar conta grátis
               <ArrowRight className="ml-2 h-5 w-5" />
             </Button>
           </div>
           <p className="text-slate-500 text-sm">
             Crie sua conta. Teste gratuitamente. Escale com IA quando quiser.
           </p>
           <p className="text-amber-500/80 text-sm mt-2">
             Teste grátis por 7 dias, exclusivo para clínicas capilares.
           </p>
         </div>
       </section>
 
       {/* Pain Points */}
       <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
         <div className="max-w-4xl mx-auto">
           <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
             Se você trabalha com transplante capilar, sabe que:
           </h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
             {painPoints.map((point, index) => (
               <div key={index} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                 <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                 <span className="text-slate-300">{point}</span>
               </div>
             ))}
           </div>
           <div className="text-center mt-10">
             <p className="text-xl text-slate-400">Não é falta de demanda.</p>
             <p className="text-2xl font-bold text-amber-500 mt-2">É falta de sistema capilar.</p>
           </div>
         </div>
       </section>
 
       {/* Solution */}
       <section className="py-20 px-4 sm:px-6 lg:px-8">
         <div className="max-w-5xl mx-auto">
           <div className="text-center mb-12">
             <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">
               Solução Capilar
             </Badge>
             <h2 className="text-3xl md:text-4xl font-bold mb-4">
               O Avivar CRM Capilar foi criado para a{' '}
               <span className="text-amber-500">realidade de clínicas capilares</span>
             </h2>
             <p className="text-slate-400 text-lg">Um sistema pensado para:</p>
           </div>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {solutions.map((solution, index) => (
               <div key={index} className="flex items-center gap-4 bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 hover:border-amber-500/30 transition-colors">
                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                   <solution.icon className="w-6 h-6 text-amber-500" />
                 </div>
                 <span className="text-lg text-white font-medium">{solution.text}</span>
               </div>
             ))}
           </div>
           <p className="text-center text-slate-400 mt-8">
             Tudo em um único lugar, com IA treinada para esse contexto.
           </p>
         </div>
       </section>
 
       {/* How it Works */}
       <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
         <div className="max-w-4xl mx-auto">
           <h2 className="text-3xl font-bold text-center mb-12">Como funciona</h2>
           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { step: '1', text: 'Você cria sua conta' },
               { step: '2', text: 'Conecta seu WhatsApp' },
               { step: '3', text: 'Escolhe um plano' },
               { step: '4', text: 'Começa a atender imediatamente' }
             ].map((item) => (
               <div key={item.step} className="text-center">
                 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                   {item.step}
                 </div>
                 <p className="text-slate-300">{item.text}</p>
               </div>
             ))}
           </div>
           <div className="text-center mt-10 space-y-2 text-slate-400">
             <p>Sem contratos longos.</p>
             <p>Sem implantação obrigatória.</p>
             <p>Sem depender de ninguém.</p>
           </div>
         </div>
       </section>
 
       {/* Pricing */}
       <section className="py-20 px-4 sm:px-6 lg:px-8">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-12">
             <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
               Planos e Preços
             </Badge>
             <h2 className="text-3xl md:text-4xl font-bold">
               Escolha o plano ideal para sua clínica
             </h2>
           </div>
           <div className="grid lg:grid-cols-3 gap-8">
             {plans.map((plan) => (
               <Card 
                 key={plan.id}
                 className={`relative bg-slate-800 border-slate-700 transition-all ${
                   plan.highlighted 
                     ? 'border-2 border-amber-500 shadow-2xl shadow-amber-500/10 scale-105' 
                     : 'hover:border-slate-600'
                 }`}
               >
                 {plan.highlighted && plan.badge && (
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                     <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 px-4 py-1">
                       {plan.badge}
                     </Badge>
                   </div>
                 )}
                 <CardContent className="p-8">
                   <div className="text-center mb-6">
                     <h3 className="text-xl font-semibold text-amber-500 mb-2">{plan.name}</h3>
                     <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                     <div className="flex items-end justify-center gap-1">
                       <span className="text-sm text-slate-400">R$</span>
                       <span className="text-4xl font-bold text-white">{plan.price}</span>
                       <span className="text-slate-400">/mês</span>
                     </div>
                   </div>
                   
                   {/* Includes */}
                   <div className="mb-6">
                     <p className="text-sm font-medium text-slate-300 mb-3">Inclui:</p>
                     <ul className="space-y-2">
                       {plan.includes.map((feature, index) => (
                         <li key={index} className="flex items-start gap-2">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                           <span className="text-sm text-slate-300">{feature}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                   
                   {/* Excludes */}
                   {plan.excludes.length > 0 && (
                     <div className="mb-6">
                       <p className="text-sm font-medium text-slate-400 mb-3">Não inclui:</p>
                       <ul className="space-y-2">
                         {plan.excludes.map((feature, index) => (
                           <li key={index} className="flex items-start gap-2">
                             <X className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                             <span className="text-sm text-slate-500">{feature}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                   
                   <Button 
                     className={`w-full ${
                       plan.highlighted 
                         ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white' 
                         : 'bg-slate-700 hover:bg-slate-600 text-white'
                     }`}
                     onClick={() => handleWhatsApp(plan.name)}
                   >
                     Começar agora
                     <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </section>
 
       {/* Implementation */}
       <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
         <div className="max-w-4xl mx-auto">
           <div className="text-center mb-10">
             <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
               Opcional
             </Badge>
             <h2 className="text-2xl md:text-3xl font-bold mb-4">
               Implementação Premium Capilar
             </h2>
             <p className="text-slate-400 max-w-2xl mx-auto">
               Você pode usar o Avivar sozinho. Mas se quiser acelerar e operar no padrão de clínicas de alta performance, nós configuramos tudo para você.
             </p>
           </div>
           
           <Card className="bg-slate-800 border-slate-700">
             <CardContent className="p-8">
               <h3 className="text-xl font-semibold text-white mb-6 text-center">
                 Implementação Avivar Capilar Done For You
               </h3>
               <div className="grid md:grid-cols-2 gap-4 mb-8">
                 {[
                   'Mapeamento do funil capilar ideal',
                   'Configuração completa do CRM',
                   'Ajuste de mensagens por tipo de procedimento',
                   'Treinamento da IA com seu contexto real',
                   'Integrações avançadas',
                   'Testes e validação final'
                 ].map((item, index) => (
                   <div key={index} className="flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                     <span className="text-slate-300 text-sm">{item}</span>
                   </div>
                 ))}
               </div>
               <div className="grid sm:grid-cols-2 gap-4">
                 {implementations.map((impl, index) => (
                   <div key={index} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 text-center">
                     <p className="font-medium text-white mb-1">{impl.name}</p>
                     <p className="text-amber-500 font-semibold">{impl.price}</p>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </div>
       </section>
 
       {/* Target Audience */}
       <section className="py-16 px-4 sm:px-6 lg:px-8">
         <div className="max-w-4xl mx-auto text-center">
           <h2 className="text-2xl md:text-3xl font-bold mb-8">Para quem é</h2>
           <div className="flex flex-wrap justify-center gap-4 mb-8">
             {targetAudience.map((item, index) => (
               <Badge key={index} variant="outline" className="border-amber-500/50 text-amber-400 px-4 py-2 text-base">
                 {item}
               </Badge>
             ))}
           </div>
           <p className="text-xl text-slate-300">
             Se você vende transplante, o <span className="text-amber-500 font-semibold">Avivar foi feito para você</span>.
           </p>
         </div>
       </section>
 
       {/* Trial */}
       <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
         <div className="max-w-4xl mx-auto">
           <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/30">
             <CardContent className="p-8 text-center">
               <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">
                 Trial Gratuito
               </Badge>
               <h2 className="text-2xl md:text-3xl font-bold mb-4">
                 Teste o Avivar CRM Capilar gratuitamente por 7 dias
               </h2>
               <div className="flex flex-wrap justify-center gap-3 mb-6">
                 {trialFeatures.map((feature, index) => (
                   <div key={index} className="flex items-center gap-2 bg-slate-800/50 rounded-full px-4 py-2">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     <span className="text-sm text-slate-300">{feature}</span>
                   </div>
                 ))}
               </div>
               <p className="text-slate-400 text-sm mb-6">
                 Cartão obrigatório para ativação do teste. Após o período, o plano escolhido é ativado automaticamente.
               </p>
               <Button 
                 size="lg"
                 className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                 onClick={() => handleWhatsApp()}
               >
                 Começar teste grátis
                 <ArrowRight className="ml-2 h-5 w-5" />
               </Button>
             </CardContent>
           </Card>
         </div>
       </section>
 
       {/* Security */}
       <section className="py-16 px-4 sm:px-6 lg:px-8">
         <div className="max-w-4xl mx-auto text-center">
           <div className="flex items-center justify-center gap-3 mb-6">
             <Shield className="w-8 h-8 text-emerald-500" />
             <h2 className="text-2xl font-bold">Segurança e Controle</h2>
           </div>
           <div className="flex flex-wrap justify-center gap-4 mb-6">
             {securityFeatures.map((feature, index) => (
               <div key={index} className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                 <span className="text-slate-300">{feature}</span>
               </div>
             ))}
           </div>
           <p className="text-amber-500 font-medium">Você tem controle total.</p>
         </div>
       </section>
 
       {/* Final CTA */}
       <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-500/10 to-orange-600/10">
         <div className="max-w-3xl mx-auto text-center">
           <h2 className="text-3xl md:text-4xl font-bold mb-4">
             Pare de perder cirurgias por falta de processo.
           </h2>
           <p className="text-xl text-slate-400 mb-8">
             Crie sua conta agora. Teste gratuitamente. E escale sua clínica capilar com IA.
           </p>
           <Button 
             size="lg"
             className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-lg px-10"
             onClick={() => handleWhatsApp()}
           >
             Criar conta grátis agora
             <ArrowRight className="ml-2 h-5 w-5" />
           </Button>
         </div>
       </section>
 
       {/* Footer */}
       <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
               <Flame className="h-5 w-5 text-white" />
             </div>
             <span className="font-semibold text-white">Avivar CRM Capilar</span>
           </div>
           <p className="text-sm text-slate-500">
             © {new Date().getFullYear()} Avivar. Todos os direitos reservados.
           </p>
           <div className="flex gap-6 text-sm text-slate-500">
             <Link to="/privacy" className="hover:text-slate-300 transition-colors">Privacidade</Link>
             <Link to="/terms" className="hover:text-slate-300 transition-colors">Termos</Link>
           </div>
         </div>
       </footer>
     </div>
   );
 }