import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  Sparkles,
  HeartHandshake,
  BadgeCheck,
  Leaf,
  Stethoscope,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QuizAnswer {
  concern: string;
  duration: string;
  treatment: string;
  goal: string;
}

interface LeadData {
  name: string;
  phone: string;
  city: string;
  state: string;
  email: string;
}

export default function ConsultaCapilarLanding() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer>({
    concern: "",
    duration: "",
    treatment: "",
    goal: "",
  });
  const [leadData, setLeadData] = useState<LeadData>({
    name: "",
    phone: "",
    city: "",
    state: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const quizQuestions = [
    {
      id: "concern",
      question: "Qual é a sua principal preocupação capilar?",
      options: [
        { value: "queda", label: "Queda de cabelo", description: "Estou perdendo mais cabelo que o normal" },
        { value: "falhas", label: "Falhas e rarefação", description: "Áreas com falhas ou cabelo ralo" },
        { value: "calvicie", label: "Calvície avançada", description: "Perda significativa de cabelo" },
        { value: "saude", label: "Saúde capilar", description: "Quero fortalecer e prevenir" },
      ],
    },
    {
      id: "duration",
      question: "Há quanto tempo percebe o problema?",
      options: [
        { value: "recente", label: "Menos de 6 meses", description: "Percebi recentemente" },
        { value: "1ano", label: "6 meses a 1 ano", description: "Já faz algum tempo" },
        { value: "1-3", label: "1 a 3 anos", description: "Problema recorrente" },
        { value: "mais3", label: "Mais de 3 anos", description: "Convivo com isso há muito tempo" },
      ],
    },
    {
      id: "treatment",
      question: "Já realizou algum tratamento capilar?",
      options: [
        { value: "nenhum", label: "Nunca tratei", description: "Esta seria a minha primeira consulta" },
        { value: "caseiro", label: "Tratamentos caseiros", description: "Shampoos, vitaminas, etc." },
        { value: "clinico", label: "Tratamento clínico", description: "Acompanhamento médico anterior" },
        { value: "cirurgico", label: "Procedimento cirúrgico", description: "Transplante ou similar" },
      ],
    },
    {
      id: "goal",
      question: "O que espera da consulta?",
      options: [
        { value: "diagnostico", label: "Diagnóstico preciso", description: "Entender a causa do problema" },
        { value: "tratamento", label: "Plano de tratamento", description: "Saber as opções disponíveis" },
        { value: "transplante", label: "Avaliação para transplante", description: "Verificar se sou candidato" },
        { value: "prevencao", label: "Prevenção", description: "Evitar que o problema piore" },
      ],
    },
  ];

  const totalSteps = quizQuestions.length + 1;
  const progress = ((quizStep + 1) / totalSteps) * 100;

  const handleQuizAnswer = (questionId: string, value: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const nextStep = () => {
    if (quizStep < quizQuestions.length) {
      setQuizStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (quizStep > 0) {
      setQuizStep((prev) => prev - 1);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leadData.name || !leadData.phone || !leadData.city || !leadData.state) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("hotleads_captures" as any).insert([
        {
          name: leadData.name,
          phone: leadData.phone.replace(/\D/g, ""),
          city: `${leadData.city} - ${leadData.state}`,
          email: leadData.email || null,
          quiz_answers: quizAnswers,
          source: "consulta-capilar-landing",
          status: "new",
        },
      ]);

      if (error) throw error;

      setSubmitted(true);
      toast.success("Cadastro realizado com sucesso!");
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Shield,
      title: "Clínicas Licenciadas",
      description: "Apenas clínicas certificadas pela rede ByNeoFolic com profissionais qualificados",
    },
    {
      icon: Award,
      title: "Tecnologia de Ponta",
      description: "Protocolos exclusivos com os melhores equipamentos e técnicas do mercado",
    },
    {
      icon: HeartHandshake,
      title: "Atendimento Humanizado",
      description: "Equipe especializada que entende sua história e cria um plano personalizado",
    },
    {
      icon: MapPin,
      title: "Presente no Brasil Todo",
      description: "Rede de clínicas licenciadas em todas as regiões do país",
    },
  ];

  const steps = [
    {
      num: "1",
      title: "Preencha o formulário",
      description: "Responda algumas perguntas rápidas sobre sua saúde capilar",
    },
    {
      num: "2",
      title: "Receba o contato",
      description: "Uma clínica ByNeoFolic da sua região entrará em contato em até 24h",
    },
    {
      num: "3",
      title: "Agende sua consulta",
      description: "Escolha o melhor dia e horário para sua avaliação capilar completa",
    },
    {
      num: "4",
      title: "Transforme seus cabelos",
      description: "Inicie o tratamento personalizado e veja os resultados",
    },
  ];

  const stats = [
    { value: "50.000+", label: "Pacientes atendidos" },
    { value: "98%", label: "Satisfação" },
    { value: "150+", label: "Clínicas no Brasil" },
    { value: "15+", label: "Anos de experiência" },
  ];

  const testimonials = [
    {
      name: "Carlos M.",
      city: "São Paulo, SP",
      text: "Achei que não tinha solução pro meu caso. Depois de 6 meses de tratamento, estou com meu cabelo de volta. Só tenho a agradecer à equipe!",
      rating: 5,
    },
    {
      name: "Fernanda L.",
      city: "Belo Horizonte, MG",
      text: "Fui super bem atendida desde o primeiro contato. A clínica da minha cidade é incrível e o resultado superou minhas expectativas.",
      rating: 5,
    },
    {
      name: "Roberto A.",
      city: "Curitiba, PR",
      text: "Sofria com calvície há 10 anos. Fiz o tratamento e o transplante na ByNeoFolic e hoje me sinto outra pessoa. Recomendo demais!",
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: "A consulta é paga?",
      a: "O agendamento é gratuito e sem compromisso. Na consulta, o médico fará uma avaliação completa e apresentará as opções de tratamento com os respectivos valores.",
    },
    {
      q: "Quanto tempo demora para entrar em contato?",
      a: "Uma clínica ByNeoFolic da sua região entrará em contato em até 24 horas úteis após o preenchimento do formulário.",
    },
    {
      q: "Tem clínica na minha cidade?",
      a: "A rede ByNeoFolic possui clínicas licenciadas em todas as regiões do Brasil. Ao preencher o formulário, direcionamos você para a clínica mais próxima.",
    },
    {
      q: "Quais tratamentos estão disponíveis?",
      a: "Oferecemos desde tratamentos clínicos (medicamentosos, laser, microagulhamento) até procedimentos cirúrgicos como transplante capilar FUE.",
    },
    {
      q: "Os resultados são garantidos?",
      a: "Cada caso é único. Na consulta, o médico avaliará seu quadro e apresentará expectativas realistas de resultado baseadas na sua condição específica.",
    },
  ];

  const brazilStates = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
    "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
  ];

  // ---- QUIZ / FORM OVERLAY ----
  if (showQuiz) {
    // Success screen
    if (submitted) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-teal-950 via-teal-900 to-slate-900 flex items-center justify-center px-4">
          <Card className="max-w-lg w-full bg-slate-800/80 border-teal-700/50 shadow-2xl">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Cadastro Realizado!</h2>
              <p className="text-slate-300 leading-relaxed">
                Obrigado, <span className="text-teal-400 font-semibold">{leadData.name}</span>!
                <br /><br />
                Uma clínica licenciada <span className="text-teal-400 font-semibold">ByNeoFolic</span> da sua
                região entrará em contato em até <strong className="text-white">24 horas</strong> para agendar
                sua consulta capilar.
              </p>
              <div className="bg-teal-900/50 border border-teal-700/50 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm text-slate-400">Seus dados:</p>
                <p className="text-white text-sm">📞 {leadData.phone}</p>
                <p className="text-white text-sm">📍 {leadData.city} - {leadData.state}</p>
                {leadData.email && <p className="text-white text-sm">✉️ {leadData.email}</p>}
              </div>
              <p className="text-xs text-slate-500">
                Fique atento(a) ao seu telefone. O contato será feito por WhatsApp ou ligação.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Quiz / Form steps
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-950 via-teal-900 to-slate-900 flex items-center justify-center px-4 py-8">
        <Card className="max-w-xl w-full bg-slate-800/80 border-teal-700/50 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Etapa {quizStep + 1} de {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-slate-700" />
            </div>

            {quizStep < quizQuestions.length ? (
              // Quiz question
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {quizQuestions[quizStep].question}
                </h2>
                <RadioGroup
                  value={quizAnswers[quizQuestions[quizStep].id as keyof QuizAnswer]}
                  onValueChange={(v) => handleQuizAnswer(quizQuestions[quizStep].id, v)}
                  className="space-y-3"
                >
                  {quizQuestions[quizStep].options.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        quizAnswers[quizQuestions[quizStep].id as keyof QuizAnswer] === opt.value
                          ? "border-teal-500 bg-teal-900/30"
                          : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} className="mt-0.5 border-slate-500 text-teal-500" />
                      <div>
                        <p className="font-medium text-white">{opt.label}</p>
                        <p className="text-sm text-slate-400">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
                <div className="flex gap-3">
                  {quizStep > 0 && (
                    <Button variant="outline" onClick={prevStep} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                    </Button>
                  )}
                  <Button
                    onClick={nextStep}
                    disabled={!quizAnswers[quizQuestions[quizStep].id as keyof QuizAnswer]}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
                  >
                    Próximo <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              // Contact form
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-center mb-4">
                  <Sparkles className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Quase lá!</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Preencha seus dados para receber o contato da clínica mais próxima
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Nome completo *</Label>
                    <Input
                      value={leadData.name}
                      onChange={(e) => setLeadData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Seu nome completo"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">WhatsApp / Celular *</Label>
                    <Input
                      value={leadData.phone}
                      onChange={(e) => setLeadData((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                      placeholder="(11) 99999-9999"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 mt-1"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label className="text-slate-300">Cidade *</Label>
                      <Input
                        value={leadData.city}
                        onChange={(e) => setLeadData((p) => ({ ...p, city: e.target.value }))}
                        placeholder="Sua cidade"
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Estado *</Label>
                      <select
                        value={leadData.state}
                        onChange={(e) => setLeadData((p) => ({ ...p, state: e.target.value }))}
                        className="w-full h-10 rounded-md bg-slate-700/50 border border-slate-600 text-white px-3 text-sm mt-1"
                        required
                      >
                        <option value="">UF</option>
                        {brazilStates.map((uf) => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">E-mail (opcional)</Label>
                    <Input
                      type="email"
                      value={leadData.email}
                      onChange={(e) => setLeadData((p) => ({ ...p, email: e.target.value }))}
                      placeholder="seu@email.com"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={prevStep} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-lg py-6"
                  >
                    {isSubmitting ? "Enviando..." : "Agendar minha consulta"}
                    {!isSubmitting && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  🔒 Seus dados estão seguros e não serão compartilhados com terceiros.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- LANDING PAGE ----
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900">ByNeo<span className="text-teal-600">Folic</span></span>
                <p className="text-[10px] text-slate-400 -mt-1">Saúde Capilar Avançada</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm">
              <a href="#como-funciona" className="text-slate-600 hover:text-teal-600 transition-colors">Como funciona</a>
              <a href="#beneficios" className="text-slate-600 hover:text-teal-600 transition-colors">Benefícios</a>
              <a href="#depoimentos" className="text-slate-600 hover:text-teal-600 transition-colors">Depoimentos</a>
              <a href="#faq" className="text-slate-600 hover:text-teal-600 transition-colors">Dúvidas</a>
            </nav>
            <Button
              onClick={() => setShowQuiz(true)}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white"
            >
              Agendar consulta
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-0 text-sm">
                ✨ Consulta com especialista — para todo o Brasil
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Recupere a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">
                  confiança
                </span>{" "}
                nos seus cabelos
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                Preencha o formulário e uma clínica licenciada{" "}
                <strong className="text-teal-700">ByNeoFolic</strong> da sua região entrará em contato para
                agendar sua avaliação capilar completa.{" "}
                <strong>Sem compromisso.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setShowQuiz(true)}
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-lg px-8 shadow-lg shadow-teal-500/20"
                >
                  Quero agendar minha consulta
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex -space-x-2">
                  {["CM", "FL", "RA", "JS", "AP"].map((initials, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-100 to-emerald-200 border-2 border-white flex items-center justify-center text-xs font-semibold text-teal-700"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <span>
                  <strong className="text-slate-900">+50.000</strong> pacientes atendidos
                </span>
              </div>
            </div>

            {/* Right side — visual card */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-emerald-500/20 rounded-3xl blur-3xl" />
              <Card className="relative bg-gradient-to-br from-teal-900 to-slate-900 border-teal-700/50 shadow-2xl overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-lg">Avaliação Capilar</p>
                      <p className="text-teal-300 text-sm">Diagnóstico personalizado</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Análise do couro cabeludo", done: true },
                      { label: "Identificação da causa", done: true },
                      { label: "Plano de tratamento personalizado", done: true },
                      { label: "Acompanhamento contínuo", done: false },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <CheckCircle2 className={`w-5 h-5 ${item.done ? "text-emerald-400" : "text-slate-600"}`} />
                        <span className={item.done ? "text-white" : "text-slate-500"}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-teal-800/50 rounded-xl p-4 border border-teal-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-teal-400" />
                      <span className="text-teal-300 text-sm font-medium">Clínicas em todo o Brasil</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["SP", "RJ", "MG", "PR", "SC", "BA", "PE", "DF", "GO", "CE"].map((uf) => (
                        <span key={uf} className="px-2 py-0.5 bg-teal-700/50 rounded text-xs text-teal-200 font-medium">
                          {uf}
                        </span>
                      ))}
                      <span className="px-2 py-0.5 bg-teal-700/50 rounded text-xs text-teal-200 font-medium">+17</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-700 to-emerald-700">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-teal-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-0 mb-4">Como funciona</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              4 passos simples para sua consulta
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Nós conectamos você à clínica ByNeoFolic mais próxima da sua região
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold shadow-lg shadow-teal-500/20">
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-teal-300 to-teal-100" />
                )}
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-0 mb-4">Benefícios</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Por que escolher a ByNeoFolic?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <Card key={i} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <b.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{b.title}</h3>
                  <p className="text-slate-500 text-sm">{b.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA mid-page */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-700 to-emerald-700">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Sua transformação capilar começa agora
          </h2>
          <p className="text-teal-100 text-lg">
            Preencha o formulário e uma clínica ByNeoFolic da sua região entrará em contato para agendar sua consulta. É rápido, gratuito e sem compromisso.
          </p>
          <Button
            onClick={() => setShowQuiz(true)}
            size="lg"
            className="bg-white text-teal-700 hover:bg-teal-50 text-lg px-10 shadow-lg font-semibold"
          >
            Agendar minha consulta gratuita
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-0 mb-4">Depoimentos</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Histórias reais de transformação
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-slate-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-emerald-200 flex items-center justify-center text-sm font-semibold text-teal-700">
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-0 mb-4">Dúvidas frequentes</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Perguntas e Respostas
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <span className="font-medium text-slate-900">{faq.q}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-900 to-slate-900">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Leaf className="w-12 h-12 text-teal-400 mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Não espere mais para cuidar dos seus cabelos
          </h2>
          <p className="text-teal-200 text-lg">
            Uma clínica licenciada ByNeoFolic está pronta para te atender.
            Agende sua consulta agora mesmo — é rápido e gratuito.
          </p>
          <Button
            onClick={() => setShowQuiz(true)}
            size="lg"
            className="bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white text-lg px-10 shadow-lg shadow-teal-500/30"
          >
            Agendar consulta gratuita
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <div className="flex items-center justify-center gap-6 text-sm text-teal-300">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Sem compromisso</span>
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Dados protegidos</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Contato em 24h</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-teal-500" />
            <span>© {new Date().getFullYear()} ByNeoFolic. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://neohub.ibramec.com/privacy-policy" className="hover:text-slate-700 transition-colors">Privacidade</a>
            <a href="https://neohub.ibramec.com/terms" className="hover:text-slate-700 transition-colors">Termos</a>
          </div>
        </div>
      </footer>

      {/* Floating CTA mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t border-slate-200 lg:hidden">
        <Button
          onClick={() => setShowQuiz(true)}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-lg py-6"
        >
          Agendar consulta gratuita
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
