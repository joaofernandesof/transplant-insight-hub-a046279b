 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { 
   Flame, 
   Target, 
   TrendingUp, 
   Shield, 
   CheckCircle2, 
   ArrowRight, 
   Phone, 
   Zap,
   BarChart3,
   Clock,
   Star,
   MessageSquare
 } from "lucide-react";
 
 export default function HotLeadsLanding() {
   const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
 
   const scrollToPlans = () => {
     document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
   };
 
   const features = [
     {
       icon: Target,
       title: "Leads Qualificados",
       description: "Captamos leads que realmente estão interessados em procedimentos estéticos e consultas médicas."
     },
     {
       icon: TrendingUp,
       title: "Alta Conversão",
       description: "Leads pré-aquecidos com interesse comprovado, aumentando sua taxa de agendamentos."
     },
     {
       icon: Clock,
       title: "Entrega Contínua",
       description: "Receba novos leads diariamente, mantendo sua agenda sempre cheia."
     },
     {
       icon: Shield,
       title: "Exclusividade Regional",
       description: "Leads segmentados por região, sem concorrência com outros licenciados na mesma área."
     },
     {
       icon: Zap,
       title: "Notificação Instantânea",
       description: "Seja avisado em tempo real quando um novo lead for captado para sua clínica."
     },
     {
       icon: BarChart3,
       title: "Dashboard Completo",
       description: "Acompanhe métricas de conversão, origem e desempenho de cada lead."
     }
   ];
 
   const plans = [
     {
       id: "starter",
       name: "Starter",
       price: "497",
       leads: "20",
       description: "Ideal para começar a testar o serviço",
       features: [
         "20 leads qualificados/mês",
         "1 região de atuação",
         "Dashboard de métricas",
         "Suporte por email",
         "Notificações via WhatsApp"
       ],
       highlighted: false
     },
     {
       id: "growth",
       name: "Growth",
       price: "997",
       leads: "50",
       description: "Para clínicas em expansão",
       features: [
         "50 leads qualificados/mês",
         "2 regiões de atuação",
         "Dashboard avançado",
         "Suporte prioritário",
         "Notificações em tempo real",
         "Relatórios semanais"
       ],
       highlighted: true
     },
     {
       id: "scale",
       name: "Scale",
       price: "1.997",
       leads: "120",
       description: "Para redes e grandes operações",
       features: [
         "120 leads qualificados/mês",
         "5 regiões de atuação",
         "Dashboard white-label",
         "Gerente de sucesso dedicado",
         "API de integração",
         "Relatórios personalizados",
         "Prioridade na captação"
       ],
       highlighted: false
     }
   ];
 
   const testimonials = [
     {
       name: "Dra. Fernanda Oliveira",
       role: "Harmonização Facial - São Paulo",
       content: "Em 3 meses, triplicamos nossos agendamentos. Os leads chegam pré-qualificados e interessados nos procedimentos.",
       rating: 5
     },
     {
       name: "Dr. Ricardo Mendes",
       role: "Cirurgião Plástico - Rio de Janeiro",
       content: "A exclusividade regional faz toda diferença. Não preciso competir por preço, os pacientes vêm diretamente para mim.",
       rating: 5
     },
     {
       name: "Clínica Estética Bella",
       role: "Rede com 4 unidades - Belo Horizonte",
       content: "O ROI é impressionante. Cada lead custa menos que um café, mas pode gerar procedimentos de milhares de reais.",
       rating: 5
     }
   ];
 
   const stats = [
     { value: "15.000+", label: "Leads entregues" },
     { value: "94%", label: "Taxa de contato" },
     { value: "47%", label: "Conversão média" },
     { value: "200+", label: "Clínicas parceiras" }
   ];
 
   return (
     <div className="min-h-screen bg-white">
       {/* Header */}
       <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between h-16">
             <div className="flex items-center gap-2">
               <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                 <Flame className="w-6 h-6 text-white" />
               </div>
               <span className="text-xl font-bold text-slate-900">HotLeads</span>
             </div>
             <nav className="hidden md:flex items-center gap-8">
               <a href="#como-funciona" className="text-slate-600 hover:text-slate-900 transition-colors">Como funciona</a>
               <a href="#beneficios" className="text-slate-600 hover:text-slate-900 transition-colors">Benefícios</a>
               <a href="#planos" className="text-slate-600 hover:text-slate-900 transition-colors">Planos</a>
               <a href="#depoimentos" className="text-slate-600 hover:text-slate-900 transition-colors">Depoimentos</a>
             </nav>
             <Button 
               onClick={scrollToPlans}
               className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
             >
               Ver planos
             </Button>
           </div>
         </div>
       </header>
 
       {/* Hero Section */}
       <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white">
         <div className="max-w-7xl mx-auto">
           <div className="grid lg:grid-cols-2 gap-12 items-center">
             <div className="space-y-8">
               <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0">
                 🔥 Exclusivo para Licenciados
               </Badge>
               <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                 Leads qualificados para sua{" "}
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                   clínica
                 </span>
               </h1>
               <p className="text-xl text-slate-600 leading-relaxed">
                 Nós captamos, você converte. Receba leads pré-qualificados de pacientes 
                 interessados em procedimentos estéticos e consultas médicas diretamente 
                 no seu painel.
               </p>
               <div className="flex flex-col sm:flex-row gap-4">
                 <Button 
                   onClick={scrollToPlans}
                   size="lg"
                   className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg px-8"
                 >
                   Ver planos e preços
                   <ArrowRight className="ml-2 w-5 h-5" />
                 </Button>
                 <Button 
                   variant="outline" 
                   size="lg"
                   className="text-lg border-slate-300"
                   onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
                 >
                   <MessageSquare className="mr-2 w-5 h-5" />
                   Falar com consultor
                 </Button>
               </div>
               <div className="flex items-center gap-6 pt-4">
                 <div className="flex -space-x-2">
                   {[1, 2, 3, 4, 5].map((i) => (
                     <div
                       key={i}
                       className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600"
                     >
                       {['FO', 'RM', 'CB', 'LM', 'AS'][i - 1]}
                     </div>
                   ))}
                 </div>
                 <div className="text-sm text-slate-600">
                   <span className="font-semibold text-slate-900">+200 clínicas</span>
                   <br />
                   já utilizam o HotLeads
                 </div>
               </div>
             </div>
             <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-3xl blur-3xl" />
               <Card className="relative bg-white border-slate-200 shadow-2xl">
                 <CardContent className="p-6 space-y-4">
                   <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                         <Flame className="w-5 h-5 text-white" />
                       </div>
                       <div>
                         <p className="font-semibold text-slate-900">Novos Leads</p>
                         <p className="text-sm text-slate-500">Hoje, 14:32</p>
                       </div>
                     </div>
                     <Badge className="bg-green-100 text-green-700 border-0">+5 novos</Badge>
                   </div>
                   {[
                     { name: "Maria Silva", interest: "Harmonização Facial", time: "há 2 min" },
                     { name: "João Santos", interest: "Botox", time: "há 15 min" },
                     { name: "Ana Costa", interest: "Preenchimento Labial", time: "há 32 min" }
                   ].map((lead, index) => (
                     <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-medium text-slate-600">
                           {lead.name.split(' ').map(n => n[0]).join('')}
                         </div>
                         <div>
                           <p className="font-medium text-slate-900">{lead.name}</p>
                           <p className="text-sm text-slate-500">{lead.interest}</p>
                         </div>
                       </div>
                       <span className="text-xs text-slate-400">{lead.time}</span>
                     </div>
                   ))}
                   <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                     Ver todos os leads
                   </Button>
                 </CardContent>
               </Card>
             </div>
           </div>
         </div>
       </section>
 
       {/* Stats Section */}
       <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900">
         <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
             {stats.map((stat, index) => (
               <div key={index} className="text-center">
                 <p className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.value}</p>
                 <p className="text-slate-400">{stat.label}</p>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* How it Works */}
       <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
             <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0 mb-4">
               Como funciona
             </Badge>
             <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
               Simples, rápido e eficiente
             </h2>
             <p className="text-xl text-slate-600 max-w-2xl mx-auto">
               Você foca no atendimento, nós cuidamos da captação
             </p>
           </div>
           <div className="grid md:grid-cols-3 gap-8">
             {[
               {
                 step: "01",
                 title: "Escolha seu plano",
                 description: "Selecione o plano que melhor atende sua demanda e defina sua região de atuação."
               },
               {
                 step: "02",
                 title: "Receba os leads",
                 description: "Nossa equipe capta leads qualificados e envia diretamente para seu painel de controle."
               },
               {
                 step: "03",
                 title: "Converta e lucre",
                 description: "Entre em contato rapidamente e converta leads em pacientes pagantes."
               }
             ].map((item, index) => (
               <div key={index} className="relative">
                 <div className="text-6xl font-bold text-slate-100 absolute -top-4 -left-2">{item.step}</div>
                 <div className="relative pt-8 pl-4">
                   <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                   <p className="text-slate-600">{item.description}</p>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* Benefits */}
       <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
             <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0 mb-4">
               Benefícios
             </Badge>
             <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
               Por que escolher o HotLeads?
             </h2>
             <p className="text-xl text-slate-600 max-w-2xl mx-auto">
               Tudo que você precisa para escalar sua captação de pacientes
             </p>
           </div>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {features.map((feature, index) => (
               <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
                 <CardContent className="p-6">
                   <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                     <feature.icon className="w-6 h-6 text-white" />
                   </div>
                   <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                   <p className="text-slate-600">{feature.description}</p>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </section>
 
       {/* Pricing - Dark cards with orange accent */}
       <section id="planos" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
             <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0 mb-4">
               Planos
             </Badge>
             <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
               Escolha o plano ideal
             </h2>
             <p className="text-xl text-slate-600 max-w-2xl mx-auto">
               Investimento que se paga no primeiro paciente convertido
             </p>
           </div>
           <div className="grid md:grid-cols-3 gap-8">
             {plans.map((plan) => (
               <Card 
                 key={plan.id} 
                 className={`relative transition-all ${
                   plan.highlighted 
                     ? 'border-2 border-orange-500 shadow-2xl scale-105 bg-slate-800' 
                     : 'border border-slate-700 bg-slate-800 hover:border-slate-600'
                 }`}
               >
                 {plan.highlighted && (
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                     <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                       Mais popular
                     </Badge>
                   </div>
                 )}
                 <CardContent className="p-8">
                   <div className="text-center mb-6">
                     <h3 className="text-xl font-semibold text-orange-500 mb-2">{plan.name}</h3>
                     <p className="text-slate-400 mb-4">{plan.description}</p>
                     <div className="flex items-end justify-center gap-1">
                       <span className="text-sm text-slate-400">R$</span>
                       <span className="text-4xl font-bold text-white">{plan.price}</span>
                       <span className="text-slate-400">/mês</span>
                     </div>
                     <p className="text-sm text-orange-500 mt-2 font-medium">
                       {plan.leads} leads/mês
                     </p>
                   </div>
                   <ul className="space-y-3 mb-8">
                     {plan.features.map((feature, index) => (
                       <li key={index} className="flex items-start gap-3">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                         <span className="text-slate-300">{feature}</span>
                       </li>
                     ))}
                   </ul>
                   <Button 
                     className={`w-full ${
                       plan.highlighted 
                         ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white' 
                         : 'bg-orange-500 hover:bg-orange-600 text-white'
                     }`}
                     onClick={() => window.open('https://wa.me/5511999999999?text=Tenho interesse no plano ' + plan.name, '_blank')}
                   >
                     Quero este plano
                   </Button>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </section>
 
       {/* Testimonials */}
       <section id="depoimentos" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
             <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-0 mb-4">
               Depoimentos
             </Badge>
             <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
               O que nossos parceiros dizem
             </h2>
           </div>
           <div className="grid md:grid-cols-3 gap-8">
             {testimonials.map((testimonial, index) => (
               <Card key={index} className="border-slate-200">
                 <CardContent className="p-6">
                   <div className="flex gap-1 mb-4">
                     {Array.from({ length: testimonial.rating }).map((_, i) => (
                       <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                     ))}
                   </div>
                   <p className="text-slate-600 mb-6 italic">"{testimonial.content}"</p>
                   <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-medium text-slate-600">
                       {testimonial.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                     </div>
                     <div>
                       <p className="font-semibold text-slate-900">{testimonial.name}</p>
                       <p className="text-sm text-slate-500">{testimonial.role}</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </section>
 
       {/* CTA Section */}
       <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-slate-800">
         <div className="max-w-4xl mx-auto text-center">
           <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
             Pronto para receber leads qualificados?
           </h2>
           <p className="text-xl text-slate-300 mb-8">
             Comece hoje e veja sua agenda lotada de pacientes interessados
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
             <Button 
               onClick={scrollToPlans}
               size="lg"
               className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg px-8"
             >
               Ver planos e preços
               <ArrowRight className="ml-2 w-5 h-5" />
             </Button>
             <Button 
               variant="outline" 
               size="lg"
               className="text-white border-white/30 hover:bg-white/10 text-lg"
               onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
             >
               <Phone className="mr-2 w-5 h-5" />
               Falar com consultor
             </Button>
           </div>
         </div>
       </section>
 
       {/* Footer */}
       <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-950">
         <div className="max-w-7xl mx-auto">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-2">
               <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                 <Flame className="w-6 h-6 text-white" />
               </div>
               <span className="text-xl font-bold text-white">HotLeads</span>
             </div>
             <div className="flex items-center gap-6 text-slate-400">
               <a href="#" className="hover:text-white transition-colors">Termos de uso</a>
               <a href="#" className="hover:text-white transition-colors">Privacidade</a>
               <a href="#" className="hover:text-white transition-colors">Contato</a>
             </div>
             <p className="text-slate-500 text-sm">
               © 2026 HotLeads. Todos os direitos reservados.
             </p>
           </div>
         </div>
       </footer>
     </div>
   );
 }