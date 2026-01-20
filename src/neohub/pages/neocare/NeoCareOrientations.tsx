import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Pill, 
  Droplets,
  Sun,
  Moon,
  Heart,
  Scissors,
  Sparkles
} from 'lucide-react';

interface Orientation {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  items: {
    title: string;
    content: string;
  }[];
}

const preOperativeOrientations: Orientation[] = [
  {
    id: 'pre-transplant',
    title: 'Antes do Transplante Capilar',
    description: 'Orientações importantes para os dias que antecedem o procedimento',
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
    title: 'Antes do PRP Capilar',
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
  }
];

const postOperativeOrientations: Orientation[] = [
  {
    id: 'post-transplant',
    title: 'Após o Transplante Capilar',
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
    title: 'Após o PRP Capilar',
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

const generalCareOrientations: Orientation[] = [
  {
    id: 'daily-care',
    title: 'Cuidados Diários com o Cabelo',
    description: 'Práticas para manter a saúde capilar',
    icon: Sun,
    items: [
      {
        title: 'Lavagem adequada',
        content: 'Lave o cabelo com água morna (nunca quente). Use shampoo adequado ao seu tipo de cabelo. Massageie suavemente o couro cabeludo com as pontas dos dedos.'
      },
      {
        title: 'Secagem',
        content: 'Prefira secar naturalmente. Se usar secador, mantenha distância de 15cm e use temperatura média. Evite friccionar com a toalha.'
      },
      {
        title: 'Alimentação e hidratação',
        content: 'Mantenha uma dieta rica em proteínas, ferro, zinco e vitaminas do complexo B. Beba ao menos 2 litros de água por dia. A saúde capilar reflete a saúde geral.'
      }
    ]
  },
  {
    id: 'medications',
    title: 'Uso de Medicamentos',
    description: 'Orientações sobre tratamentos medicamentosos',
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
  },
  {
    id: 'sleep',
    title: 'Sono e Descanso',
    description: 'Importância do descanso para a saúde capilar',
    icon: Moon,
    items: [
      {
        title: 'Qualidade do sono',
        content: 'Durma 7-8 horas por noite. O sono é essencial para a regeneração celular e saúde dos folículos capilares.'
      },
      {
        title: 'Travesseiro',
        content: 'Prefira fronhas de seda ou cetim que causam menos atrito. Mantenha o travesseiro limpo para evitar oleosidade e acúmulo de bactérias.'
      }
    ]
  }
];

export default function NeoCareOrientations() {
  const [activeTab, setActiveTab] = useState('pre');

  const renderOrientationCard = (orientation: Orientation) => (
    <Card key={orientation.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[hsl(var(--neocare-primary))]/10 rounded-lg shrink-0">
            <orientation.icon className="h-5 w-5 text-[hsl(var(--neocare-primary))]" />
          </div>
          <div>
            <CardTitle className="text-lg">{orientation.title}</CardTitle>
            <CardDescription>{orientation.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {orientation.items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-medium">{item.title}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );

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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pre" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Pré-Procedimento</span>
            <span className="sm:hidden">Antes</span>
          </TabsTrigger>
          <TabsTrigger value="post" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Pós-Procedimento</span>
            <span className="sm:hidden">Depois</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Cuidados Gerais</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pre" className="mt-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {preOperativeOrientations.length} orientações
              </Badge>
            </div>
            {preOperativeOrientations.map(renderOrientationCard)}
          </div>
        </TabsContent>

        <TabsContent value="post" className="mt-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {postOperativeOrientations.length} orientações
              </Badge>
            </div>
            {postOperativeOrientations.map(renderOrientationCard)}
          </div>
        </TabsContent>

        <TabsContent value="general" className="mt-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {generalCareOrientations.length} orientações
              </Badge>
            </div>
            {generalCareOrientations.map(renderOrientationCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
