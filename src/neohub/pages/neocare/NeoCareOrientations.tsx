import { useState } from 'react';
import { 
  Droplets, Clock, Bed, Shirt, Sun, Dumbbell, 
  Coffee, Scissors, AlertCircle, CheckCircle2, 
  Calendar, Trophy, Star, Sparkles, ShowerHead,
  Pill, Camera, Phone, Youtube, Gift, Heart,
  ChevronDown, ChevronUp, Lock, Unlock, Award,
  Wine, Waves, Cat, Ban
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Timeline phases for gamification
const timelinePhases = [
  { day: 0, label: 'Cirurgia', icon: Scissors },
  { day: 2, label: 'Curativo', icon: Droplets },
  { day: 8, label: 'Toque leve', icon: ShowerHead },
  { day: 15, label: 'Normalizar', icon: Sparkles },
  { day: 30, label: 'Retorno', icon: Calendar },
  { day: 90, label: 'Crescimento', icon: Trophy },
];

// Day-by-day washing protocol
const washingProtocol = [
  {
    days: '1-2',
    title: 'Apenas Soro',
    icon: Droplets,
    color: 'from-blue-400 to-blue-600',
    tasks: [
      'Borrifar soro fisiológico a cada hora',
      'Não lavar com água',
      'Não tocar na área receptora',
    ]
  },
  {
    days: '3-4',
    title: 'Espuma Suave',
    icon: ShowerHead,
    color: 'from-cyan-400 to-cyan-600',
    tasks: [
      'Esfregar só área doadora',
      'Espuma na mão → área receptora',
      'Caneca para enxaguar',
    ]
  },
  {
    days: '5-7',
    title: 'Lavagem Cuidadosa',
    icon: Droplets,
    color: 'from-teal-400 to-teal-600',
    tasks: [
      'Aplicar espuma suavemente',
      'Água morna ou fria apenas',
      'Secar ao vento (sem toalha)',
    ]
  },
  {
    days: '8-15',
    title: 'Toque Circular',
    icon: ShowerHead,
    color: 'from-emerald-400 to-emerald-600',
    tasks: [
      'Movimentos circulares leves',
      'Óleo de girassol (dia 10+)',
      'Crostas devem soltar naturalmente',
    ]
  },
  {
    days: '15+',
    title: 'Normal',
    icon: Sparkles,
    color: 'from-purple-400 to-purple-600',
    tasks: [
      'Chuveiro normal liberado',
      'Shampoo regular ou prescrito',
      'Massagens liberadas',
    ]
  },
];

// Quick reference cards with icons
const quickRules = [
  { icon: Bed, title: 'Dormir', rule: 'Barriga ↑', duration: '8d', color: 'bg-indigo-500' },
  { icon: Coffee, title: 'Café', rule: 'Evitar', duration: '5d', color: 'bg-amber-600' },
  { icon: Wine, title: 'Álcool', rule: 'Proibido', duration: '5d', color: 'bg-red-500' },
  { icon: Dumbbell, title: 'Academia', rule: 'Proibido', duration: '10d', color: 'bg-orange-500' },
  { icon: Shirt, title: 'Camisas', rule: 'Botão', duration: '14d', color: 'bg-blue-500' },
  { icon: Sun, title: 'Sol', rule: 'Evitar', duration: '60d', color: 'bg-yellow-500' },
  { icon: Waves, title: 'Piscina', rule: 'Proibido', duration: '60d', color: 'bg-cyan-500' },
  { icon: Cat, title: 'Pets', rule: 'Afastar', duration: '5d', color: 'bg-pink-500' },
];

// Progress unlocks - gamification
const progressUnlocks = [
  { day: 3, label: 'Trabalho', icon: CheckCircle2 },
  { day: 5, label: 'Caminhada', icon: Dumbbell },
  { day: 5, label: 'Boné largo', icon: Shirt },
  { day: 8, label: 'Dormir lado', icon: Bed },
  { day: 10, label: 'Academia', icon: Dumbbell },
  { day: 15, label: 'Chuveiro', icon: ShowerHead },
  { day: 21, label: 'Capacete', icon: Shirt },
  { day: 30, label: 'Esportes', icon: Trophy },
  { day: 60, label: 'Mar', icon: Waves },
];

// FAQ items
const faqItems = [
  { q: 'Cabelo caiu todo?', a: 'Normal! Volta em ~90 dias.', icon: '🔄' },
  { q: 'Massinha branca?', a: 'É mucina, não o bulbo.', icon: '✅' },
  { q: 'Foliculite?', a: 'Shampoo + pomada. Não esprema!', icon: '⚠️' },
  { q: 'Área dormente?', a: 'Normal até 8 meses.', icon: '⏳' },
  { q: 'Medo de lavar?', a: 'Siga o protocolo. É essencial!', icon: '💪' },
  { q: 'Quanto tempo a medicação?', a: 'Siga receita médica.', icon: '💊' },
];

// Photo schedule
const photoSchedule = [
  { period: 'Semana 1', freq: 'Diário', emoji: '📸📸📸📸📸📸📸' },
  { period: 'Sem 2-4', freq: 'Semanal', emoji: '📸📸📸' },
  { period: 'Mês 2-12', freq: 'Mensal', emoji: '📸' },
];

// Kit essentials
const kitItems = [
  { name: 'Shampoo Neo Spa', use: 'Até dia 15', icon: Droplets },
  { name: 'Soro Fisiológico', use: 'Borrifar 1h/1h', icon: Droplets },
  { name: 'Óleo de Girassol', use: 'A partir D10', icon: Sparkles },
  { name: 'Água Termal', use: 'Alívio coceira', icon: Heart },
];

export default function NeoCareOrientations() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>('1-2');
  const [showFaq, setShowFaq] = useState(false);
  
  // Simulate current day (would come from surgery date in real app)
  const currentDay = 5;
  const progressPercent = Math.min((currentDay / 30) * 100, 100);

  return (
    <div className="space-y-4 pb-8 max-w-4xl mx-auto">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Sua Recuperação</h1>
            <p className="text-emerald-100 text-sm">Dia {currentDay} pós-transplante</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            <Trophy className="h-4 w-4" />
            <span className="font-bold text-sm">{Math.round(progressPercent)}%</span>
          </div>
        </div>
        
        {/* Timeline Progress */}
        <div className="relative">
          <Progress value={progressPercent} className="h-2 bg-white/20" />
          <div className="flex justify-between mt-2">
            {timelinePhases.map((phase, idx) => {
              const PhaseIcon = phase.icon;
              const isActive = currentDay >= phase.day;
              const isCurrent = currentDay >= phase.day && (idx === timelinePhases.length - 1 || currentDay < timelinePhases[idx + 1].day);
              return (
                <div key={phase.day} className={cn("flex flex-col items-center transition-all", isActive ? "opacity-100" : "opacity-40")}>
                  <div className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center -mt-5",
                    isCurrent ? "bg-white text-emerald-600 ring-2 ring-white/50 scale-110" : 
                    isActive ? "bg-white/90 text-emerald-600" : "bg-white/30 text-white"
                  )}>
                    <PhaseIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] mt-1 font-medium hidden sm:block">{phase.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Rules - Compact Grid */}
      <div>
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
          <Ban className="h-4 w-4 text-red-500" />
          RESTRIÇÕES
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {quickRules.map((rule) => {
            const RuleIcon = rule.icon;
            return (
              <div key={rule.title} className="text-center p-2 rounded-xl bg-card border hover:scale-105 transition-transform cursor-default">
                <div className={cn("w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-white", rule.color)}>
                  <RuleIcon className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-medium truncate">{rule.title}</p>
                <p className="text-[9px] text-muted-foreground">{rule.duration}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Washing Protocol - Horizontal Scroll */}
      <div>
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
          <ShowerHead className="h-4 w-4 text-blue-500" />
          PROTOCOLO DE LAVAGEM
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {washingProtocol.map((phase) => {
            const PhaseIcon = phase.icon;
            const dayStart = parseInt(phase.days.split('-')[0].replace('+', ''));
            const isCurrent = phase.days.includes('+') ? currentDay >= 15 : 
              currentDay >= dayStart && currentDay <= (parseInt(phase.days.split('-')[1]) || dayStart);
            
            return (
              <Card 
                key={phase.days}
                className={cn(
                  "shrink-0 w-36 sm:w-40 overflow-hidden cursor-pointer transition-all",
                  isCurrent && "ring-2 ring-emerald-500 scale-105"
                )}
                onClick={() => setExpandedPhase(expandedPhase === phase.days ? null : phase.days)}
              >
                <div className={cn("h-1 bg-gradient-to-r", phase.color)} />
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0", phase.color)}>
                      <PhaseIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <Badge variant={isCurrent ? "default" : "secondary"} className="text-[10px] px-1.5">
                        D{phase.days}
                      </Badge>
                      {isCurrent && <Star className="h-3 w-3 text-amber-500 fill-amber-500 inline ml-1" />}
                    </div>
                  </div>
                  <p className="font-semibold text-xs mb-1">{phase.title}</p>
                  <div className="space-y-0.5">
                    {phase.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-start gap-1 text-[10px] text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Unlocks - Compact Badges */}
      <div>
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
          <Award className="h-4 w-4 text-purple-500" />
          DESBLOQUEIOS
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {progressUnlocks.map((unlock) => {
            const isUnlocked = currentDay >= unlock.day;
            return (
              <Badge
                key={`${unlock.day}-${unlock.label}`}
                variant={isUnlocked ? "default" : "outline"}
                className={cn(
                  "py-1 px-2 gap-1 text-[10px]",
                  isUnlocked ? "bg-emerald-500 hover:bg-emerald-600" : "opacity-40"
                )}
              >
                {isUnlocked ? <Unlock className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                D{unlock.day} {unlock.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Kit Essentials - Horizontal */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {kitItems.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Card key={item.name} className="p-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <ItemIcon className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold truncate">{item.name}</p>
                  <p className="text-[9px] text-muted-foreground">{item.use}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* FAQ - Collapsible */}
      <div>
        <button 
          onClick={() => setShowFaq(!showFaq)}
          className="w-full flex items-center justify-between text-sm font-semibold text-muted-foreground py-2"
        >
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            DÚVIDAS FREQUENTES
          </div>
          {showFaq ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        
        {showFaq && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {faqItems.map((faq, idx) => (
              <Card key={idx} className="p-2">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{faq.icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-[11px] truncate">{faq.q}</p>
                    <p className="text-[10px] text-muted-foreground">{faq.a}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Photo Schedule - Compact */}
      <Card className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="h-4 w-4 text-pink-500" />
          <h3 className="text-sm font-semibold">Envie suas Fotos</h3>
        </div>
        <div className="flex gap-4 text-xs">
          {photoSchedule.map((item) => (
            <div key={item.period} className="text-center">
              <p className="font-medium">{item.period}</p>
              <p className="text-[10px] text-muted-foreground">{item.freq}</p>
              <p className="text-[10px]">{item.emoji}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact & Referral - Side by Side */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">Sucesso do Paciente</p>
              <p className="text-[10px] text-muted-foreground">(85) 98118-1212</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0">
              <Gift className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">Indique e Ganhe</p>
              <p className="text-[10px] text-muted-foreground">5% no PIX!</p>
            </div>
          </div>
        </Card>
      </div>

      {/* YouTube CTA */}
      <Card className="p-3 bg-gradient-to-r from-red-500 to-red-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Youtube className="h-6 w-6" />
            <div>
              <p className="text-sm font-bold">Vídeos Explicativos</p>
              <p className="text-[10px] text-red-100">Aprenda a lavar corretamente</p>
            </div>
          </div>
          <Badge className="bg-white text-red-600 hover:bg-red-50 text-xs">
            Assistir
          </Badge>
        </div>
      </Card>
    </div>
  );
}
