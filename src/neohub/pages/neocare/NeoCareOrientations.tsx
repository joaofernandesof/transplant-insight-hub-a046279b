import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BookOpen, 
  AlertTriangle, 
  Clock,
  CheckCircle2,
  Pill, 
  Droplets,
  Heart,
  Scissors,
  Sparkles
} from 'lucide-react';

interface OrientationItem {
  title: string;
  content: string;
}

interface Orientation {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  items: OrientationItem[];
}

const beforeOrientations: Orientation[] = [
  {
    id: 'pre-transplant',
    title: 'Transplante Capilar',
    description: 'Orientações para os dias que antecedem o procedimento',
    icon: Scissors,
    items: [
      {
        title: 'Medicamentos a evitar',
        content: 'Suspenda o uso de aspirina, anti-inflamatórios e suplementos vitamínicos (especialmente vitamina E e ômega 3) pelo menos 7 dias antes do procedimento. Esses medicamentos podem aumentar o sangramento durante a cirurgia.'
      },
      {
        title: 'Álcool e tabaco',
        content: 'Evite consumo de bebidas alcoólicas por 72 horas antes do procedimento. Se você fuma, reduza significativamente ou suspenda o consumo por pelo menos 1 semana antes, pois o tabaco prejudica a cicatrização.'
      },
      {
        title: 'Alimentação',
        content: 'Na noite anterior e no dia do procedimento, faça refeições leves. Evite cafeína em excesso. Tome um café da manhã nutritivo, pois o procedimento pode durar várias horas.'
      },
      {
        title: 'Vestimenta',
        content: 'Use roupas confortáveis, preferencialmente com abertura frontal (botões ou zíper) para não precisar passar pela cabeça após o procedimento.'
      },
      {
        title: 'Cabelo',
        content: 'Lave bem o cabelo no dia do procedimento. Não aplique gel, pomada ou qualquer produto capilar. Venha com o cabelo limpo e seco.'
      }
    ]
  },
  {
    id: 'pre-prp',
    title: 'PRP Capilar',
    description: 'Preparação para a sessão de PRP',
    icon: Droplets,
    items: [
      {
        title: 'Hidratação',
        content: 'Beba bastante água nos dias anteriores ao procedimento. Uma boa hidratação melhora a qualidade do plasma e facilita a coleta de sangue.'
      },
      {
        title: 'Medicamentos',
        content: 'Evite anti-inflamatórios por 3 dias antes do procedimento. Mantenha seus medicamentos de uso contínuo normalmente, comunicando à equipe médica.'
      },
      {
        title: 'Alimentação',
        content: 'Não venha em jejum. Faça uma refeição leve antes do procedimento para evitar mal-estar durante a coleta de sangue.'
      }
    ]
  },
  {
    id: 'pre-meds',
    title: 'Medicamentos',
    description: 'Orientações sobre medicamentos de uso contínuo',
    icon: Pill,
    items: [
      {
        title: 'Minoxidil',
        content: 'Aplique na dose e frequência prescritas. Resultados aparecem após 3-6 meses de uso contínuo. Não interrompa sem orientação médica.'
      },
      {
        title: 'Finasterida/Dutasterida',
        content: 'Tome sempre no mesmo horário. Os resultados são progressivos e mantidos com uso contínuo. Comunique qualquer efeito colateral ao seu médico.'
      },
      {
        title: 'Suplementos',
        content: 'Use apenas os suplementos prescritos. Biotina, ferro e outros nutrientes podem ser indicados conforme avaliação individual.'
      }
    ]
  }
];

const afterOrientations: Orientation[] = [
  {
    id: 'post-transplant',
    title: 'Transplante Capilar',
    description: 'Cuidados essenciais para os primeiros dias e semanas',
    icon: Heart,
    items: [
      {
        title: 'Primeiras 48 horas',
        content: 'Mantenha a cabeça elevada ao dormir (use 2-3 travesseiros). Evite qualquer contato com a área transplantada. Não lave o cabelo nas primeiras 48 horas. Aplique o spray de soro fisiológico conforme orientado.'
      },
      {
        title: 'Lavagem do cabelo',
        content: 'A partir do 3º dia, inicie a lavagem suave com o shampoo prescrito. Use água morna e movimentos delicados, sem esfregar. Seque com toalha macia, apenas pressionando levemente.'
      },
      {
        title: 'Crostas e cascas',
        content: 'As crostas são normais e devem cair naturalmente em 7-14 dias. NÃO coce, arranhe ou tente removê-las manualmente. Isso pode danificar os folículos transplantados.'
      },
      {
        title: 'Atividades físicas',
        content: 'Evite exercícios físicos intensos por 30 dias. Caminhadas leves são permitidas após 7 dias. Evite piscina, sauna e mar por 30 dias.'
      },
      {
        title: 'Exposição solar',
        content: 'Evite exposição direta ao sol por 30 dias. Após este período, use sempre protetor solar ou boné. A radiação UV pode danificar os folículos em recuperação.'
      },
      {
        title: 'Queda temporária',
        content: 'Entre 2-6 semanas, os fios transplantados podem cair. Isso é NORMAL e esperado (shock loss). Os folículos permanecem e novos fios nascerão em 3-4 meses.'
      }
    ]
  },
  {
    id: 'post-prp',
    title: 'PRP Capilar',
    description: 'Cuidados para potencializar os resultados',
    icon: Sparkles,
    items: [
      {
        title: 'Primeiras horas',
        content: 'Você pode sentir leve desconforto ou sensibilidade no couro cabeludo. Isso é normal e passa em poucas horas. Evite tocar ou coçar a região tratada.'
      },
      {
        title: 'Lavagem',
        content: 'Evite lavar o cabelo nas primeiras 4-6 horas após o procedimento. Depois, pode lavar normalmente com seu shampoo habitual.'
      },
      {
        title: 'Atividades',
        content: 'Evite exercícios intensos e sauna por 24-48 horas. Atividades leves podem ser retomadas no mesmo dia.'
      },
      {
        title: 'Resultados',
        content: 'Os resultados do PRP são progressivos. A melhora começa a ser notada após 2-3 sessões, com resultados mais expressivos após o protocolo completo (geralmente 3-6 sessões).'
      }
    ]
  }
];

const OrientationCard = ({ orientation }: { orientation: Orientation }) => (
  <Card className="border-border/50 shadow-sm">
    <CardHeader className="pb-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[hsl(var(--neocare-primary))]/10 rounded-lg shrink-0">
          <orientation.icon className="h-5 w-5 text-[hsl(var(--neocare-primary))]" />
        </div>
        <div>
          <CardTitle className="text-base">{orientation.title}</CardTitle>
          <CardDescription className="text-xs">{orientation.description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <Accordion type="single" collapsible className="w-full">
        {orientation.items.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-b-0">
            <AccordionTrigger className="text-left hover:no-underline py-2 text-sm">
              <span className="font-medium">{item.title}</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-3">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </CardContent>
  </Card>
);

export default function NeoCareOrientations() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[hsl(var(--neocare-primary))]/10 rounded-xl">
          <BookOpen className="h-6 w-6 text-[hsl(var(--neocare-primary))]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Orientações</h1>
          <p className="text-muted-foreground">Informações importantes para seu tratamento</p>
        </div>
      </div>

      {/* Alert */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">Importante</p>
            <p className="text-amber-700 dark:text-amber-300">
              Estas orientações são gerais. Sempre siga as instruções específicas fornecidas pelo seu médico, 
              pois podem variar de acordo com seu caso particular.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Layout */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-[hsl(var(--neocare-primary))] to-green-500" />

        {/* ANTES Section */}
        <div className="relative mb-12">
          {/* Timeline marker */}
          <div className="absolute left-4 lg:left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Section header */}
          <div className="pl-16 lg:pl-0 lg:text-center pt-2 mb-6">
            <div className="lg:ml-auto lg:mr-auto lg:max-w-xs bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 lg:ml-[calc(50%+2rem)]">
              <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 lg:justify-center">
                <span>Antes do Procedimento</span>
              </h2>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Preparação para garantir o melhor resultado
              </p>
            </div>
          </div>

          {/* Cards grid */}
          <div className="pl-16 lg:pl-0 lg:pr-0">
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
              <div className="lg:pr-8 lg:col-start-1 space-y-4">
                {beforeOrientations.slice(0, 2).map((orientation) => (
                  <OrientationCard key={orientation.id} orientation={orientation} />
                ))}
              </div>
              <div className="lg:pl-8 lg:col-start-2 space-y-4">
                {beforeOrientations.slice(2).map((orientation) => (
                  <OrientationCard key={orientation.id} orientation={orientation} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DEPOIS Section */}
        <div className="relative">
          {/* Timeline marker */}
          <div className="absolute left-4 lg:left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full shadow-lg">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Section header */}
          <div className="pl-16 lg:pl-0 lg:text-center pt-2 mb-6">
            <div className="lg:ml-auto lg:mr-auto lg:max-w-xs bg-green-50 dark:bg-green-950/30 rounded-xl p-4 lg:ml-[calc(50%+2rem)]">
              <h2 className="text-xl font-bold text-green-700 dark:text-green-300 flex items-center gap-2 lg:justify-center">
                <span>Após o Procedimento</span>
              </h2>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Cuidados essenciais para sua recuperação
              </p>
            </div>
          </div>

          {/* Cards grid */}
          <div className="pl-16 lg:pl-0 lg:pr-0">
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
              <div className="lg:pr-8 lg:col-start-1 space-y-4">
                {afterOrientations.slice(0, 1).map((orientation) => (
                  <OrientationCard key={orientation.id} orientation={orientation} />
                ))}
              </div>
              <div className="lg:pl-8 lg:col-start-2 space-y-4">
                {afterOrientations.slice(1).map((orientation) => (
                  <OrientationCard key={orientation.id} orientation={orientation} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
