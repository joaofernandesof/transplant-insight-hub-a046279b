import { useState } from 'react';
import { 
  Droplets, Bed, Shirt, Sun, Dumbbell, 
  Coffee, CheckCircle2, ShowerHead,
  Phone, ChevronRight, Wine, Waves, Cat,
  Calendar, Sparkles, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Restrictions data
const restrictions = [
  { icon: Bed, title: 'Dormir de barriga para cima', days: 8, color: 'text-indigo-500' },
  { icon: Coffee, title: 'Evitar café e estimulantes', days: 5, color: 'text-amber-600' },
  { icon: Wine, title: 'Álcool proibido', days: 5, color: 'text-red-500' },
  { icon: Dumbbell, title: 'Academia proibida', days: 10, color: 'text-orange-500' },
  { icon: Shirt, title: 'Usar camisas com botão', days: 14, color: 'text-blue-500' },
  { icon: Sun, title: 'Evitar exposição solar', days: 60, color: 'text-yellow-500' },
  { icon: Waves, title: 'Piscina e mar proibidos', days: 60, color: 'text-cyan-500' },
  { icon: Cat, title: 'Manter pets afastados', days: 5, color: 'text-pink-500' },
];

// Washing protocol phases
const washingPhases = [
  {
    days: 'D1-2',
    title: 'Apenas Soro',
    instructions: [
      'Borrifar soro fisiológico a cada hora',
      'Não lavar com água',
      'Não tocar na área receptora',
    ],
    active: true,
  },
  {
    days: 'D3-4',
    title: 'Espuma Suave',
    instructions: [
      'Esfregar só área doadora',
      'Aplicar espuma com a mão na área receptora',
      'Usar caneca para enxaguar',
    ],
    active: false,
  },
  {
    days: 'D5-7',
    title: 'Lavagem Cuidadosa',
    instructions: [
      'Aplicar espuma suavemente',
      'Usar apenas água morna ou fria',
      'Secar ao vento (sem toalha)',
    ],
    active: false,
  },
  {
    days: 'D8-15',
    title: 'Toque Circular',
    instructions: [
      'Movimentos circulares leves',
      'Óleo de girassol a partir do dia 10',
      'Deixar crostas soltarem naturalmente',
    ],
    active: false,
  },
  {
    days: 'D15+',
    title: 'Lavagem Normal',
    instructions: [
      'Chuveiro normal liberado',
      'Shampoo regular ou prescrito',
      'Massagens liberadas',
    ],
    active: false,
  },
];

// FAQ items
const faqItems = [
  { q: 'O cabelo caiu. É normal?', a: 'Sim! Os fios transplantados caem e voltam em aproximadamente 90 dias.' },
  { q: 'O que é essa massinha branca?', a: 'É mucina, uma secreção natural. Não é o bulbo capilar.' },
  { q: 'Estou com foliculite. O que fazer?', a: 'Use shampoo medicinal + pomada prescrita. Nunca esprema!' },
  { q: 'A área está dormente. É normal?', a: 'Sim, pode durar até 8 meses. A sensibilidade volta gradualmente.' },
  { q: 'Tenho medo de lavar o cabelo.', a: 'Siga o protocolo de lavagem. Lavar é essencial para a recuperação!' },
];

export default function NeoCareOrientations() {
  const [activeTab, setActiveTab] = useState('hoje');
  
  // Simulate current day (would come from surgery date in real app)
  const currentDay = 5;
  
  // Find current washing phase
  const getCurrentPhase = () => {
    if (currentDay <= 2) return 0;
    if (currentDay <= 4) return 1;
    if (currentDay <= 7) return 2;
    if (currentDay <= 15) return 3;
    return 4;
  };
  
  const currentPhaseIndex = getCurrentPhase();

  return (
    <div className="space-y-4 pb-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Dia {currentDay} pós-transplante</h1>
            <p className="text-emerald-100 text-sm">Siga as orientações abaixo</p>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1.5">
            <span className="font-bold text-sm">{washingPhases[currentPhaseIndex].title}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10">
          <TabsTrigger value="hoje" className="text-xs">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            Hoje
          </TabsTrigger>
          <TabsTrigger value="lavagem" className="text-xs">
            <ShowerHead className="h-3.5 w-3.5 mr-1" />
            Lavagem
          </TabsTrigger>
          <TabsTrigger value="duvidas" className="text-xs">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Dúvidas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Hoje */}
        <TabsContent value="hoje" className="space-y-4 mt-4">
          {/* Current Phase Card */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4 text-emerald-500" />
                O que fazer hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {washingPhases[currentPhaseIndex].instructions.map((instruction, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{instruction}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Restrictions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Restrições ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {restrictions
                  .filter(r => currentDay <= r.days)
                  .map((restriction, idx) => {
                    const Icon = restriction.icon;
                    const daysLeft = restriction.days - currentDay;
                    return (
                      <div key={idx} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", restriction.color)} />
                          <span className="text-sm">{restriction.title}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {daysLeft > 0 ? `${daysLeft}d restantes` : 'Hoje'}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Next unlocks */}
          <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span className="text-sm">
                  <strong>Próximo desbloqueio:</strong>{' '}
                  {currentDay < 3 ? 'Trabalho (D3)' :
                   currentDay < 5 ? 'Caminhada leve (D5)' :
                   currentDay < 8 ? 'Dormir de lado (D8)' :
                   currentDay < 10 ? 'Academia leve (D10)' :
                   currentDay < 15 ? 'Chuveiro normal (D15)' :
                   'Todas atividades liberadas!'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Lavagem */}
        <TabsContent value="lavagem" className="space-y-3 mt-4">
          {washingPhases.map((phase, idx) => {
            const isCurrent = idx === currentPhaseIndex;
            const isPast = idx < currentPhaseIndex;
            
            return (
              <Card 
                key={phase.days}
                className={cn(
                  "transition-all",
                  isCurrent && "ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30",
                  isPast && "opacity-50"
                )}
              >
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      isCurrent ? "bg-emerald-500 text-white" : "bg-muted"
                    )}>
                      <span className="font-bold text-xs">{phase.days}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{phase.title}</h3>
                        {isCurrent && (
                          <Badge className="bg-emerald-500 text-xs">Atual</Badge>
                        )}
                      </div>
                      <ul className="space-y-1">
                        {phase.instructions.map((instruction, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" />
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab: Dúvidas */}
        <TabsContent value="duvidas" className="space-y-3 mt-4">
          {faqItems.map((faq, idx) => (
            <Card key={idx}>
              <CardContent className="py-3">
                <h3 className="font-semibold text-sm mb-1">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
          
          {/* Contact */}
          <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Ainda tem dúvidas?</p>
                  <p className="text-xs text-muted-foreground">
                    Ligue para (85) 98118-1212
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
