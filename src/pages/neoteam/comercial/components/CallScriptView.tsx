import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Phone, Target, DollarSign, Users, Brain, Lightbulb, TrendingUp, Award, CheckCircle2, MessageSquare, Calendar, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

interface CallScriptViewProps {
  eventSummary: string;
  eventStart?: string;
  onBack: () => void;
}

const SCRIPT_SECTIONS = [
  {
    id: 'spin-s',
    step: '1',
    title: 'SPIN – S (Situação)',
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-l-blue-500',
    objective: 'Entender o momento atual do médico.',
    lines: [
      '"Dr, antes de eu te explicar como funciona a formação, eu queria entender um pouco do seu momento."',
      '"Hoje você está atuando mais em consultório ou plantão?"',
      '"Qual é sua especialidade hoje?"',
      '"Há quanto tempo você se formou?"',
      '"Você já teve algum contato com transplante capilar ou seria algo novo para você?"',
      '"Hoje qual é a principal fonte de renda da sua medicina?"',
    ],
  },
  {
    id: 'bant-b',
    step: '2',
    title: 'BANT – B (Budget)',
    icon: DollarSign,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-l-emerald-500',
    objective: 'Entender perfil de investimento.',
    lines: [
      '"Você costuma investir em cursos de especialização?"',
      '"Qual foi o último curso médico que você fez?"',
      '"Normalmente esses cursos ficam em qual faixa de investimento?"',
      '"Quando você faz cursos, costuma parcelar ou prefere pagar à vista?"',
    ],
  },
  {
    id: 'spin-p',
    step: '3',
    title: 'SPIN – P (Problema)',
    icon: Target,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-l-amber-500',
    objective: 'Fazer o médico verbalizar insatisfação.',
    lines: [
      '"Hoje o que mais te incomoda na sua rotina médica?"',
      '"Muitos médicos relatam que o plantão limita muito a qualidade de vida. Você sente isso também?"',
      '"Você sente que a medicina está ficando cada vez mais competitiva?"',
      '"E o que te fez começar a pesquisar transplante capilar?"',
    ],
  },
  {
    id: 'bant-a',
    step: '4',
    title: 'BANT – A (Authority)',
    icon: Users,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-l-violet-500',
    objective: 'Entender se ele decide sozinho.',
    lines: [
      '"Hoje as decisões da sua carreira você toma sozinho ou tem sócio ou alguém que participa dessas decisões?"',
      '"Você já tem clínica própria ou atende em clínicas de terceiros?"',
      '"Se você decidir fazer essa formação, depende de mais alguém ou a decisão é totalmente sua?"',
    ],
  },
  {
    id: 'spin-i',
    step: '5',
    title: 'SPIN – I (Implicação)',
    icon: Brain,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-l-red-500',
    objective: 'Ampliar o problema.',
    lines: [
      '"Hoje a medicina está passando por uma mudança muito grande."',
      '"O Brasil caminha para 1 milhão de médicos até 2030."',
      '"Ou seja, a concorrência na medicina tradicional tende a aumentar muito."',
      '"Ao mesmo tempo temos um cenário completamente diferente no transplante capilar."',
      '"Hoje existem mais de 60 milhões de pessoas com calvície no Brasil."',
      '"E existem menos de 2 mil médicos atuando com transplante capilar."',
      '"Ou seja, existe uma demanda enorme e poucos especialistas."',
    ],
    extraQuestion: '"Se nada mudar na sua carreira, como você imagina sua situação profissional daqui a três ou quatro anos?"',
  },
  {
    id: 'spin-n',
    step: '6',
    title: 'SPIN – N (Need Payoff)',
    icon: Lightbulb,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-l-cyan-500',
    objective: 'Apresentar a solução.',
    lines: [
      '"Então deixa eu te explicar como funciona a Formação 360 e como a gente ajuda o médico a entrar nesse mercado."',
    ],
  },
];

const PITCH_PILLARS = [
  {
    id: 'conhecimento',
    title: 'Pilar 1 – CONHECIMENTO',
    icon: '📚',
    lines: [
      '"O primeiro pilar da formação é o conhecimento técnico."',
      '"No curso o médico aprende toda a técnica de transplante capilar na prática."',
      '"Durante os três dias de formação acontecem 24 cirurgias reais."',
      '"Os médicos participam do procedimento e aprendem todas as etapas do transplante."',
      '"Além do transplante capilar, também são abordados transplante de barba, transplante de sobrancelha e procedimentos complementares como tricologia, mesoterapia e LEDterapia."',
      '"A ideia é que o médico saia do curso entendendo todo o processo do transplante."',
    ],
  },
  {
    id: 'local',
    title: 'Pilar 2 – LOCAL',
    icon: '🏥',
    lines: [
      '"O segundo pilar é o local da cirurgia."',
      '"Uma dúvida muito comum de quem quer começar no transplante capilar é: onde eu vou operar?"',
      '"No curso a gente entrega um checklist completo com tudo que é necessário."',
      '"Esse checklist inclui equipamentos, instrumentos, medicamentos e todos os itens necessários para montar a estrutura de transplante."',
      '"Ou seja, o médico já sai sabendo exatamente como montar o ambiente para começar a operar."',
    ],
  },
  {
    id: 'equipe',
    title: 'Pilar 3 – EQUIPE',
    icon: '👥',
    lines: [
      '"O terceiro pilar é a equipe."',
      '"O transplante capilar não é feito apenas pelo médico. Existe uma equipe de instrumentação especializada."',
      '"E hoje essa equipe é uma das maiores barreiras de entrada no mercado."',
      '"O que o IBRAMEC faz é fornecer equipe especializada para os médicos que estão começando."',
      '"Ou seja, o médico pode começar operando com uma equipe experiente enquanto monta sua própria equipe."',
      '"Isso dá muito mais segurança para quem está começando."',
    ],
  },
  {
    id: 'paciente',
    title: 'Pilar 4 – PACIENTE',
    icon: '🎯',
    lines: [
      '"O quarto pilar é o paciente."',
      '"Não adianta o médico saber operar, ter estrutura e equipe, se ele não tiver paciente."',
      '"Por isso dentro da formação também ensinamos como captar pacientes."',
      '"A gente ensina marketing médico, posicionamento digital e como converter consultas em transplantes."',
      '"Além disso, existe uma plataforma chamada Conecta Capilar."',
      '"Nessa plataforma o médico tem acesso a conteúdos, materiais de marketing e também pacientes interessados em transplante."',
      '"Ou seja, o médico não precisa começar do zero."',
    ],
  },
];

const CLOSING_SECTIONS = [
  {
    id: 'bant-n',
    step: '8',
    title: 'BANT – N (Need)',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    borderColor: 'border-l-emerald-500',
    objective: 'Confirmar necessidade.',
    lines: [
      '"Hoje você pensa em agregar transplante capilar à sua prática ou pensa em migrar mais para essa área?"',
      '"Você imagina começar a operar ainda esse ano ou seria algo mais para o futuro?"',
    ],
  },
  {
    id: 'monetizacao',
    step: '9',
    title: 'Monetização',
    icon: DollarSign,
    color: 'text-emerald-500',
    borderColor: 'border-l-emerald-500',
    lines: [
      '"Hoje um transplante capilar normalmente é vendido entre 15 e 20 mil reais."',
      '"O custo médio do procedimento costuma ficar entre 5 e 6 mil reais."',
      '"Ou seja, sobra em média 10 mil reais por cirurgia."',
      '"Com três transplantes o médico praticamente paga o investimento do curso."',
    ],
  },
  {
    id: 'prova-social',
    step: '10',
    title: 'Prova Social',
    icon: Award,
    color: 'text-amber-500',
    borderColor: 'border-l-amber-500',
    lines: [
      '"A Neo Folic hoje realiza entre 80 e 90 transplantes por mês."',
      '"Além disso temos mais de 1000 avaliações cinco estrelas no Google."',
      '"Ou seja, tudo que ensinamos vem da prática do que já funciona no mercado."',
    ],
  },
  {
    id: 'validacao',
    step: '11',
    title: 'Validação',
    icon: CheckCircle2,
    color: 'text-blue-500',
    borderColor: 'border-l-blue-500',
    lines: ['"Com tudo que eu te expliquei até aqui, faz sentido para você entrar nesse mercado?"'],
  },
  {
    id: 'convite',
    step: '12',
    title: 'Convite para a Turma',
    icon: Calendar,
    color: 'text-violet-500',
    borderColor: 'border-l-violet-500',
    lines: [
      '"A próxima turma da Formação 360 acontece nos dias X."',
      '"O treinamento acontece em São Paulo no One Day Hospital."',
      '"São três dias intensivos de prática e teoria."',
    ],
  },
  {
    id: 'investimento',
    step: '13',
    title: 'Investimento',
    icon: CreditCard,
    color: 'text-emerald-500',
    borderColor: 'border-l-emerald-500',
    lines: [
      '"O investimento da formação é R$29.900."',
      '"E pode ser parcelado em até 24 vezes."',
    ],
  },
  {
    id: 'fechamento',
    step: '14',
    title: 'Fechamento',
    icon: Target,
    color: 'text-red-500',
    borderColor: 'border-l-red-500',
    lines: [
      '"Para garantir a vaga na turma a gente pede apenas um sinal simbólico de R$1.000."',
      '"Esse valor é apenas para reservar a vaga."',
    ],
    extraQuestion: '"Você prefere fazer pelo PIX ou cartão?"',
  },
];

export function CallScriptView({ eventSummary, eventStart, onBack }: CallScriptViewProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(SCRIPT_SECTIONS.map(s => s.id)));

  const totalItems = SCRIPT_SECTIONS.reduce((acc, s) => acc + s.lines.length, 0)
    + PITCH_PILLARS.reduce((acc, p) => acc + p.lines.length, 0)
    + CLOSING_SECTIONS.reduce((acc, s) => acc + s.lines.length, 0);

  const progress = Math.round((checkedItems.size / totalItems) * 100);

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const renderLine = (line: string, key: string) => (
    <label key={key} className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${checkedItems.has(key) ? 'opacity-60' : ''}`}>
      <Checkbox
        checked={checkedItems.has(key)}
        onCheckedChange={() => toggleCheck(key)}
        className="mt-0.5 shrink-0"
      />
      <span className="text-sm leading-relaxed italic text-foreground/90">{line}</span>
    </label>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex-1">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            {eventSummary}
          </h2>
          {eventStart && (
            <p className="text-xs text-muted-foreground">
              {new Date(eventStart).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          )}
        </div>
        <Badge variant="outline" className="text-xs">{progress}% concluído</Badge>
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-2" />

      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="space-y-3 pr-3">
          {/* Title card */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="py-4">
              <h3 className="font-bold text-base">Formação 360 em Transplante Capilar</h3>
              <p className="text-xs text-muted-foreground mt-1">Estrutura SPIN + BANT com Pitch Guiado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Este roteiro foi estruturado para que o closer consiga ler e conduzir a conversa naturalmente.
              </p>
            </CardContent>
          </Card>

          {/* SPIN/BANT sections */}
          {SCRIPT_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);
            return (
              <Card key={section.id} className={`border-l-4 ${section.borderColor}`}>
                <CardHeader
                  className="py-3 px-4 cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-md ${section.bgColor}`}>
                        <Icon className={`h-4 w-4 ${section.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">
                          <Badge variant="outline" className="mr-2 text-xs">{section.step}</Badge>
                          {section.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{section.objective}</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 pb-3 px-4 space-y-1">
                    {section.lines.map((line, i) => renderLine(line, `${section.id}-${i}`))}
                    {section.extraQuestion && (
                      <>
                        <Separator className="my-2" />
                        <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="text-xs font-semibold text-amber-600 mb-1">Pergunta reflexiva:</p>
                          {renderLine(section.extraQuestion, `${section.id}-extra`)}
                        </div>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* PITCH */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader
              className="py-3 px-4 cursor-pointer"
              onClick={() => toggleSection('pitch')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-bold">PITCH DO CURSO – Os 4 Pilares</CardTitle>
                </div>
                {expandedSections.has('pitch') ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardHeader>
            {expandedSections.has('pitch') && (
              <CardContent className="pt-0 pb-3 px-4 space-y-4">
                {PITCH_PILLARS.map((pillar) => (
                  <div key={pillar.id} className="space-y-1">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span>{pillar.icon}</span> {pillar.title}
                    </h4>
                    {pillar.lines.map((line, i) => renderLine(line, `pitch-${pillar.id}-${i}`))}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Closing sections */}
          {CLOSING_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections.has(section.id);
            return (
              <Card key={section.id} className={`border-l-4 ${section.borderColor}`}>
                <CardHeader
                  className="py-3 px-4 cursor-pointer"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${section.color}`} />
                      <CardTitle className="text-sm font-bold">
                        <Badge variant="outline" className="mr-2 text-xs">{section.step}</Badge>
                        {section.title}
                      </CardTitle>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 pb-3 px-4 space-y-1">
                    {section.lines.map((line, i) => renderLine(line, `${section.id}-${i}`))}
                    {section.extraQuestion && (
                      <>
                        <Separator className="my-2" />
                        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-xs font-semibold text-primary mb-1">Pergunta final:</p>
                          {renderLine(section.extraQuestion, `${section.id}-extra`)}
                        </div>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* Flow summary */}
          <Card className="border-l-4 border-l-primary/50">
            <CardContent className="py-4">
              <h4 className="font-bold text-sm mb-3">Fluxo da Call</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[
                  '1 – SPIN S', '2 – BANT B', '3 – SPIN P', '4 – BANT A',
                  '5 – SPIN I', '6 – SPIN N', '7 – Pitch', '8 – BANT N',
                  '9 – Monetização', '10 – Prova Social', '11 – Validação', '12 – Convite',
                  '13 – Investimento', '14 – Fechamento',
                ].map((item, i) => (
                  <Badge key={i} variant="outline" className="justify-center text-xs py-1.5">{item}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
