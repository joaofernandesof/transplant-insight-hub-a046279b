 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
 import { Progress } from "@/components/ui/progress";
 import { 
   CheckCircle2, 
   ArrowRight, 
   ArrowLeft,
   Phone,
   MapPin,
   Shield,
   Award,
   Users,
   Star,
   Clock,
   Stethoscope,
   Sparkles,
   BadgeCheck,
   HeartHandshake
 } from "lucide-react";
 import { toast } from "sonner";
 import { supabase } from "@/integrations/supabase/client";
 
 interface QuizAnswer {
   hairLoss: string;
   duration: string;
   treatment: string;
   priority: string;
 }
 
 interface LeadData {
   name: string;
   phone: string;
   city: string;
   email: string;
 }
 
 export default function TransplanteLanding() {
   const [showQuiz, setShowQuiz] = useState(false);
   const [quizStep, setQuizStep] = useState(0);
   const [quizAnswers, setQuizAnswers] = useState<QuizAnswer>({
     hairLoss: "",
     duration: "",
     treatment: "",
     priority: ""
   });
   const [leadData, setLeadData] = useState<LeadData>({
     name: "",
     phone: "",
     city: "",
     email: ""
   });
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitted, setSubmitted] = useState(false);
 
   const quizQuestions = [
     {
       id: "hairLoss",
       question: "Qual é o seu nível atual de queda de cabelo?",
       options: [
         { value: "inicial", label: "Inicial", description: "Entradas ou coroa começando a ficar rala" },
         { value: "moderado", label: "Moderado", description: "Áreas visivelmente mais finas ou calvas" },
         { value: "avancado", label: "Avançado", description: "Grande área sem cabelo ou calvície extensa" },
         { value: "nao-sei", label: "Não tenho certeza", description: "Gostaria de uma avaliação profissional" }
       ]
     },
     {
       id: "duration",
       question: "Há quanto tempo você percebe a queda de cabelo?",
       options: [
         { value: "menos-1", label: "Menos de 1 ano", description: "Percebi recentemente" },
         { value: "1-3", label: "1 a 3 anos", description: "Já faz algum tempo" },
         { value: "3-5", label: "3 a 5 anos", description: "Vem acontecendo há anos" },
         { value: "mais-5", label: "Mais de 5 anos", description: "Problema antigo" }
       ]
     },
     {
       id: "treatment",
       question: "Você já fez algum tratamento para queda de cabelo?",
       options: [
         { value: "nenhum", label: "Nunca fiz", description: "Esta seria minha primeira vez" },
         { value: "medicamentos", label: "Medicamentos", description: "Minoxidil, finasterida ou outros" },
         { value: "procedimentos", label: "Procedimentos", description: "Laser, microagulhamento, etc." },
         { value: "transplante", label: "Transplante anterior", description: "Já fiz transplante capilar" }
       ]
     },
     {
       id: "priority",
       question: "O que é mais importante para você?",
       options: [
         { value: "resultado", label: "Resultado natural", description: "Fios que pareçam naturais" },
         { value: "rapidez", label: "Rapidez", description: "Resolver o mais rápido possível" },
         { value: "custo", label: "Custo-benefício", description: "Melhor resultado pelo investimento" },
         { value: "seguranca", label: "Segurança", description: "Procedimento seguro e confiável" }
       ]
     }
   ];
 
   const totalSteps = quizQuestions.length + 1; // +1 for contact form
   const progress = ((quizStep + 1) / totalSteps) * 100;
 
   const handleQuizAnswer = (questionId: string, value: string) => {
     setQuizAnswers(prev => ({ ...prev, [questionId]: value }));
   };
 
   const nextStep = () => {
     if (quizStep < quizQuestions.length) {
       setQuizStep(prev => prev + 1);
     }
   };
 
   const prevStep = () => {
     if (quizStep > 0) {
       setQuizStep(prev => prev - 1);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!leadData.name || !leadData.phone || !leadData.city) {
       toast.error("Por favor, preencha todos os campos obrigatórios");
       return;
     }
 
     setIsSubmitting(true);
 
     try {
        // Save to hotleads_captures table
        const { error } = await supabase
          .from('hotleads_captures' as any)
          .insert([{
           name: leadData.name,
           phone: leadData.phone,
           city: leadData.city,
           email: leadData.email || null,
           quiz_answers: quizAnswers,
           source: 'transplante-landing',
           status: 'new'
          }]);
 
       if (error) throw error;
 
       setSubmitted(true);
       toast.success("Cadastro realizado com sucesso!");
     } catch (error) {
       console.error('Error submitting lead:', error);
       toast.error("Erro ao enviar. Tente novamente.");
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const benefits = [
     {
       icon: Shield,
       title: "Clínicas Certificadas",
       description: "Apenas clínicas com médicos especialistas e estrutura adequada"
     },
     {
       icon: Award,
       title: "Técnica FUE",
       description: "Procedimento minimamente invasivo com resultados naturais"
     },
     {
       icon: Users,
       title: "Atendimento Humanizado",
       description: "Equipe preparada para tirar todas as suas dúvidas"
     },
     {
       icon: HeartHandshake,
       title: "Acompanhamento Completo",
       description: "Suporte do pré ao pós-operatório"
     }
   ];
 
   const stats = [
     { value: "200+", label: "Clínicas parceiras" },
     { value: "15.000+", label: "Pacientes atendidos" },
     { value: "98%", label: "Satisfação" },
     { value: "10+", label: "Anos de experiência" }
   ];
 
   const testimonials = [
     {
       name: "Carlos M.",
       age: 42,
       city: "São Paulo",
       content: "Depois de anos sofrendo com a calvície, finalmente tomei a decisão. O resultado superou todas as minhas expectativas. Me sinto 10 anos mais jovem!",
       rating: 5
     },
     {
       name: "Roberto S.",
       age: 35,
       city: "Rio de Janeiro",
       content: "O processo foi muito tranquilo. A equipe me deixou super confortável e o resultado ficou completamente natural. Ninguém acredita que fiz transplante.",
       rating: 5
     },
     {
       name: "Fernando L.",
       age: 48,
       city: "Belo Horizonte",
       content: "Pesquisei muito antes de escolher. Através desta rede encontrei a clínica perfeita perto de mim. Atendimento impecável do início ao fim.",
       rating: 5
     }
   ];
 
   // Success Screen
   if (submitted) {
     return (
       <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
         <Card className="max-w-lg w-full border-teal-200 shadow-xl">
           <CardContent className="p-8 text-center space-y-6">
             <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
               <CheckCircle2 className="w-10 h-10 text-teal-600" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900">Cadastro Realizado!</h2>
             <p className="text-slate-600">
               Em breve, uma clínica especializada da sua região entrará em contato 
               para agendar sua avaliação gratuita.
             </p>
             <div className="bg-teal-50 rounded-xl p-4 text-left space-y-2">
               <p className="text-sm font-medium text-teal-800">Próximos passos:</p>
               <ul className="text-sm text-teal-700 space-y-1">
                 <li className="flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" />
                   Aguarde o contato da clínica (até 24h)
                 </li>
                 <li className="flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" />
                   Avaliação gratuita e sem compromisso
                 </li>
                 <li className="flex items-center gap-2">
                   <CheckCircle2 className="w-4 h-4" />
                   Orçamento personalizado para seu caso
                 </li>
               </ul>
             </div>
             <Button 
               variant="outline" 
               onClick={() => window.location.reload()}
               className="border-teal-300 text-teal-700 hover:bg-teal-50"
             >
               Voltar ao início
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   // Quiz Modal
   if (showQuiz) {
     const currentQuestion = quizQuestions[quizStep];
     const isLastQuizStep = quizStep === quizQuestions.length;
 
     return (
       <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
         <Card className="max-w-2xl w-full border-teal-200 shadow-xl">
           <CardContent className="p-6 sm:p-8">
             {/* Progress */}
             <div className="mb-8">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm text-slate-500">
                   Passo {quizStep + 1} de {totalSteps}
                 </span>
                 <span className="text-sm font-medium text-teal-600">
                   {Math.round(progress)}%
                 </span>
               </div>
               <Progress value={progress} className="h-2" />
             </div>
 
             {/* Quiz Questions */}
             {!isLastQuizStep ? (
               <div className="space-y-6">
                 <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                   {currentQuestion.question}
                 </h2>
                 
                 <RadioGroup
                   value={quizAnswers[currentQuestion.id as keyof QuizAnswer]}
                   onValueChange={(value) => handleQuizAnswer(currentQuestion.id, value)}
                   className="space-y-3"
                 >
                   {currentQuestion.options.map((option) => (
                     <label
                       key={option.value}
                       className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                         quizAnswers[currentQuestion.id as keyof QuizAnswer] === option.value
                           ? 'border-teal-500 bg-teal-50'
                           : 'border-slate-200 hover:border-teal-200 hover:bg-slate-50'
                       }`}
                     >
                       <RadioGroupItem value={option.value} className="mt-1" />
                       <div>
                         <p className="font-medium text-slate-900">{option.label}</p>
                         <p className="text-sm text-slate-500">{option.description}</p>
                       </div>
                     </label>
                   ))}
                 </RadioGroup>
 
                 <div className="flex gap-3 pt-4">
                   {quizStep > 0 && (
                     <Button 
                       variant="outline" 
                       onClick={prevStep}
                       className="flex-1"
                     >
                       <ArrowLeft className="w-4 h-4 mr-2" />
                       Voltar
                     </Button>
                   )}
                   <Button 
                     onClick={nextStep}
                     disabled={!quizAnswers[currentQuestion.id as keyof QuizAnswer]}
                     className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                   >
                     Continuar
                     <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </div>
               </div>
             ) : (
               /* Contact Form */
               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="text-center mb-6">
                   <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Sparkles className="w-8 h-8 text-teal-600" />
                   </div>
                   <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                     Quase lá! Receba sua avaliação gratuita
                   </h2>
                   <p className="text-slate-600 mt-2">
                     Preencha seus dados para uma clínica especializada entrar em contato
                   </p>
                 </div>
 
                 <div className="space-y-4">
                   <div>
                     <Label htmlFor="name">Nome completo *</Label>
                     <Input
                       id="name"
                       placeholder="Digite seu nome"
                       value={leadData.name}
                       onChange={(e) => setLeadData(prev => ({ ...prev, name: e.target.value }))}
                       className="mt-1"
                       required
                     />
                   </div>
                   <div>
                     <Label htmlFor="phone">WhatsApp *</Label>
                     <Input
                       id="phone"
                       type="tel"
                       placeholder="(00) 00000-0000"
                       value={leadData.phone}
                       onChange={(e) => setLeadData(prev => ({ ...prev, phone: e.target.value }))}
                       className="mt-1"
                       required
                     />
                   </div>
                   <div>
                     <Label htmlFor="city">Cidade *</Label>
                     <Input
                       id="city"
                       placeholder="Sua cidade"
                       value={leadData.city}
                       onChange={(e) => setLeadData(prev => ({ ...prev, city: e.target.value }))}
                       className="mt-1"
                       required
                     />
                   </div>
                   <div>
                     <Label htmlFor="email">E-mail (opcional)</Label>
                     <Input
                       id="email"
                       type="email"
                       placeholder="seu@email.com"
                       value={leadData.email}
                       onChange={(e) => setLeadData(prev => ({ ...prev, email: e.target.value }))}
                       className="mt-1"
                     />
                   </div>
                 </div>
 
                 <div className="flex gap-3 pt-4">
                   <Button 
                     type="button"
                     variant="outline" 
                     onClick={prevStep}
                     className="flex-1"
                   >
                     <ArrowLeft className="w-4 h-4 mr-2" />
                     Voltar
                   </Button>
                   <Button 
                     type="submit"
                     disabled={isSubmitting}
                     className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                   >
                     {isSubmitting ? "Enviando..." : "Receber avaliação gratuita"}
                   </Button>
                 </div>
 
                 <p className="text-xs text-center text-slate-500">
                   Seus dados estão protegidos. Não compartilhamos com terceiros.
                 </p>
               </form>
             )}
           </CardContent>
         </Card>
       </div>
     );
   }
 
   // Main Landing Page
   return (
     <div className="min-h-screen bg-white">
       {/* Header */}
       <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between h-16">
             <div className="flex items-center gap-2">
               <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
                 <Stethoscope className="w-5 h-5 text-white" />
               </div>
               <div>
                 <span className="text-lg font-bold text-slate-900">Clínicas Parceiras</span>
                 <p className="text-[10px] text-slate-500 -mt-1">Rede de Transplante Capilar</p>
               </div>
             </div>
             <Button 
               onClick={() => setShowQuiz(true)}
               className="bg-teal-600 hover:bg-teal-700 text-white hidden sm:flex"
             >
               Avaliação Gratuita
             </Button>
           </div>
         </div>
       </header>
 
       {/* Hero Section */}
       <section className="pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50 to-white">
         <div className="max-w-7xl mx-auto">
           <div className="grid lg:grid-cols-2 gap-12 items-center">
             <div className="space-y-8">
               <Badge className="bg-teal-100 text-teal-700 border-0">
                 <BadgeCheck className="w-3 h-3 mr-1" />
                 Rede certificada de clínicas
               </Badge>
               <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                 Recupere sua{" "}
                 <span className="text-teal-600">
                   autoestima
                 </span>{" "}
                 com transplante capilar
               </h1>
               <p className="text-lg text-slate-600 leading-relaxed">
                 Conectamos você com as melhores clínicas especializadas em 
                 transplante capilar da sua região. Avaliação gratuita e 
                 sem compromisso.
               </p>
               <div className="flex flex-col sm:flex-row gap-4">
                 <Button 
                   onClick={() => setShowQuiz(true)}
                   size="lg"
                   className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8"
                 >
                   Fazer diagnóstico gratuito
                   <ArrowRight className="ml-2 w-5 h-5" />
                 </Button>
               </div>
               <div className="flex items-center gap-4 pt-4">
                 <div className="flex -space-x-2">
                   {[1, 2, 3, 4, 5].map((i) => (
                     <div
                       key={i}
                       className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 border-2 border-white"
                     />
                   ))}
                 </div>
                 <div className="text-sm text-slate-600">
                   <div className="flex gap-0.5 text-yellow-400 mb-0.5">
                     {[1, 2, 3, 4, 5].map((i) => (
                       <Star key={i} className="w-4 h-4 fill-current" />
                     ))}
                   </div>
                   <span className="font-semibold text-slate-900">+15.000</span> pacientes satisfeitos
                 </div>
               </div>
             </div>
             <div className="relative hidden lg:block">
               <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-teal-700/20 rounded-3xl blur-3xl" />
               <Card className="relative bg-white border-slate-200 shadow-2xl overflow-hidden">
                 <div className="h-80 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
                   <div className="text-center space-y-4">
                     <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                       <Sparkles className="w-12 h-12 text-teal-600" />
                     </div>
                     <p className="text-teal-700 font-medium">Resultados naturais</p>
                     <p className="text-teal-600 text-sm">Técnica FUE avançada</p>
                   </div>
                 </div>
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="font-semibold text-slate-900">Avaliação Gratuita</p>
                       <p className="text-sm text-slate-500">Descubra se você é candidato</p>
                     </div>
                     <Button 
                       onClick={() => setShowQuiz(true)}
                       className="bg-teal-600 hover:bg-teal-700"
                     >
                       Começar
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             </div>
           </div>
         </div>
       </section>
 
       {/* Stats */}
       <section className="py-12 px-4 sm:px-6 lg:px-8 bg-teal-700">
         <div className="max-w-7xl mx-auto">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
             {stats.map((stat, index) => (
               <div key={index} className="text-center">
                 <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</p>
                 <p className="text-teal-100 text-sm">{stat.label}</p>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* How it Works */}
       <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-12">
             <Badge className="bg-teal-100 text-teal-700 border-0 mb-4">
               Processo simples
             </Badge>
             <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
               Como funciona?
             </h2>
             <p className="text-slate-600 max-w-2xl mx-auto">
               Em poucos passos você será conectado com uma clínica especializada
             </p>
           </div>
           <div className="grid md:grid-cols-3 gap-8">
             {[
               {
                 step: "1",
                 title: "Faça o diagnóstico",
                 description: "Responda algumas perguntas sobre seu caso. Leva menos de 2 minutos."
               },
               {
                 step: "2",
                 title: "Receba contato",
                 description: "Uma clínica especializada da sua região entrará em contato em até 24h."
               },
               {
                 step: "3",
                 title: "Avaliação gratuita",
                 description: "Receba uma avaliação completa e um orçamento personalizado sem compromisso."
               }
             ].map((item, index) => (
               <div key={index} className="text-center">
                 <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <span className="text-2xl font-bold text-teal-700">{item.step}</span>
                 </div>
                 <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                 <p className="text-slate-600">{item.description}</p>
               </div>
             ))}
           </div>
           <div className="text-center mt-12">
             <Button 
               onClick={() => setShowQuiz(true)}
               size="lg"
               className="bg-teal-600 hover:bg-teal-700 text-white"
             >
               Iniciar diagnóstico gratuito
               <ArrowRight className="ml-2 w-5 h-5" />
             </Button>
           </div>
         </div>
       </section>
 
       {/* Benefits */}
       <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-12">
             <Badge className="bg-teal-100 text-teal-700 border-0 mb-4">
               Por que escolher nossa rede
             </Badge>
             <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
               Clínicas de confiança
             </h2>
           </div>
           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {benefits.map((benefit, index) => (
               <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
                 <CardContent className="p-6 text-center">
                   <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                     <benefit.icon className="w-7 h-7 text-teal-600" />
                   </div>
                   <h3 className="font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                   <p className="text-sm text-slate-600">{benefit.description}</p>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </section>
 
       {/* Testimonials */}
       <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-12">
             <Badge className="bg-teal-100 text-teal-700 border-0 mb-4">
               Histórias reais
             </Badge>
             <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
               Pacientes que transformaram suas vidas
             </h2>
           </div>
           <div className="grid md:grid-cols-3 gap-6">
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
                       <p className="font-semibold text-slate-900">{testimonial.name}, {testimonial.age}</p>
                       <p className="text-sm text-slate-500 flex items-center gap-1">
                         <MapPin className="w-3 h-3" />
                         {testimonial.city}
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </section>
 
       {/* FAQ */}
       <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
         <div className="max-w-3xl mx-auto">
           <div className="text-center mb-12">
             <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
               Dúvidas frequentes
             </h2>
           </div>
           <div className="space-y-4">
             {[
               {
                 q: "O transplante capilar dói?",
                 a: "O procedimento é feito com anestesia local, então você não sente dor durante a cirurgia. Após o procedimento, pode haver um leve desconforto que é controlado com medicação."
               },
               {
                 q: "Quanto tempo dura o resultado?",
                 a: "O resultado do transplante capilar é permanente. Os folículos transplantados são geneticamente resistentes à queda e continuam crescendo naturalmente pelo resto da vida."
               },
               {
                 q: "Qualquer pessoa pode fazer?",
                 a: "A maioria das pessoas com calvície pode ser candidata. Na avaliação gratuita, o médico analisará sua área doadora e determinará se você é um bom candidato."
               },
               {
                 q: "Quanto tempo leva para ver os resultados?",
                 a: "Os primeiros resultados começam a aparecer entre 3 e 4 meses. O resultado final é visível entre 12 e 18 meses após o procedimento."
               }
             ].map((faq, index) => (
               <Card key={index} className="border-slate-200">
                 <CardContent className="p-6">
                   <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                   <p className="text-slate-600 text-sm">{faq.a}</p>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </section>
 
       {/* Final CTA */}
       <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-700 to-teal-800">
         <div className="max-w-3xl mx-auto text-center">
           <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
             Pronto para dar o primeiro passo?
           </h2>
           <p className="text-teal-100 text-lg mb-8">
             Faça seu diagnóstico gratuito e descubra como podemos ajudá-lo 
             a recuperar sua autoestima
           </p>
           <Button 
             onClick={() => setShowQuiz(true)}
             size="lg"
             className="bg-white text-teal-700 hover:bg-teal-50 text-lg px-10"
           >
             Começar diagnóstico gratuito
             <ArrowRight className="ml-2 w-5 h-5" />
           </Button>
           <p className="text-teal-200 text-sm mt-6 flex items-center justify-center gap-2">
             <Clock className="w-4 h-4" />
             Leva menos de 2 minutos
           </p>
         </div>
       </section>
 
       {/* Footer */}
       <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-slate-900">
         <div className="max-w-7xl mx-auto">
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
                 <Stethoscope className="w-4 h-4 text-white" />
               </div>
               <span className="text-white font-semibold">Clínicas Parceiras</span>
             </div>
             <div className="flex items-center gap-6 text-slate-400 text-sm">
               <a href="#" className="hover:text-white transition-colors">Privacidade</a>
               <a href="#" className="hover:text-white transition-colors">Termos</a>
             </div>
             <p className="text-slate-500 text-sm">
               © 2026 Todos os direitos reservados
             </p>
           </div>
         </div>
       </footer>
 
       {/* Mobile CTA */}
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 sm:hidden z-50">
         <Button 
           onClick={() => setShowQuiz(true)}
           className="w-full bg-teal-600 hover:bg-teal-700 text-white"
           size="lg"
         >
           Diagnóstico Gratuito
           <ArrowRight className="ml-2 w-5 h-5" />
         </Button>
       </div>
     </div>
   );
 }