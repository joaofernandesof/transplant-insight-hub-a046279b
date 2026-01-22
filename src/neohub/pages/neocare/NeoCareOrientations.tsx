import { useState, useEffect } from 'react';
import { 
  Check, Circle, Droplets, Pill, Wine, Cigarette,
  FileCheck, Stethoscope, ShowerHead, Bed, Sun,
  Dumbbell, Shirt, Coffee, Waves, Cat, Phone,
  Trophy, Star, ChevronRight, Sparkles, Heart,
  Calendar, Clock, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Pre-transplant checklist
const preTransplantChecklist = [
  { 
    id: 'exames', 
    icon: FileCheck, 
    title: 'Exames solicitados', 
    description: 'Hemograma, coagulograma, glicemia',
    daysBeforeD0: 7 
  },
  { 
    id: 'consulta', 
    icon: Stethoscope, 
    title: 'Consulta pré-operatória', 
    description: 'Avaliação médica realizada',
    daysBeforeD0: 3 
  },
  { 
    id: 'minoxidil', 
    icon: Pill, 
    title: 'Parar Minoxidil', 
    description: 'Suspender 7 dias antes',
    daysBeforeD0: 7 
  },
  { 
    id: 'aspirina', 
    icon: Pill, 
    title: 'Parar AAS/Aspirina', 
    description: 'Suspender anticoagulantes',
    daysBeforeD0: 7 
  },
  { 
    id: 'vitaminas', 
    icon: Pill, 
    title: 'Parar vitamina E', 
    description: 'Pode aumentar sangramento',
    daysBeforeD0: 7 
  },
  { 
    id: 'alcool', 
    icon: Wine, 
    title: 'Evitar álcool', 
    description: 'Não beber por 5 dias',
    daysBeforeD0: 5 
  },
  { 
    id: 'cigarro', 
    icon: Cigarette, 
    title: 'Parar de fumar', 
    description: 'Afeta cicatrização',
    daysBeforeD0: 7 
  },
  { 
    id: 'cabelo', 
    icon: ShowerHead, 
    title: 'Lavar o cabelo', 
    description: 'Lavagem na manhã do procedimento',
    daysBeforeD0: 0 
  },
];

// Post-transplant checklist by day
const postTransplantChecklist = [
  {
    day: 1,
    label: 'D1',
    tasks: [
      { id: 'd1_soro', icon: Droplets, title: 'Borrifar soro 1h/1h', done: false },
      { id: 'd1_dormir', icon: Bed, title: 'Dormir de barriga para cima', done: false },
      { id: 'd1_gelo', icon: Heart, title: 'Aplicar gelo na testa', done: false },
    ]
  },
  {
    day: 2,
    label: 'D2',
    tasks: [
      { id: 'd2_soro', icon: Droplets, title: 'Continuar soro 1h/1h', done: false },
      { id: 'd2_medicacao', icon: Pill, title: 'Tomar medicação prescrita', done: false },
      { id: 'd2_repouso', icon: Bed, title: 'Manter repouso', done: false },
    ]
  },
  {
    day: 3,
    label: 'D3',
    tasks: [
      { id: 'd3_lavar', icon: ShowerHead, title: 'Primeira lavagem suave', done: false },
      { id: 'd3_doadora', icon: Droplets, title: 'Esfregar só área doadora', done: false },
      { id: 'd3_secar', icon: Sun, title: 'Secar ao vento', done: false },
    ]
  },
  {
    day: 5,
    label: 'D5',
    tasks: [
      { id: 'd5_lavagem', icon: ShowerHead, title: 'Lavagem cuidadosa', done: false },
      { id: 'd5_espuma', icon: Droplets, title: 'Aplicar espuma suavemente', done: false },
      { id: 'd5_cafe', icon: Coffee, title: 'Pode voltar café moderado', done: false },
    ]
  },
  {
    day: 8,
    label: 'D8',
    tasks: [
      { id: 'd8_circular', icon: ShowerHead, title: 'Movimentos circulares leves', done: false },
      { id: 'd8_lado', icon: Bed, title: 'Pode dormir de lado', done: false },
      { id: 'd8_camisa', icon: Shirt, title: 'Ainda usar camisas com botão', done: false },
    ]
  },
  {
    day: 10,
    label: 'D10',
    tasks: [
      { id: 'd10_oleo', icon: Sparkles, title: 'Iniciar óleo de girassol', done: false },
      { id: 'd10_academia', icon: Dumbbell, title: 'Academia leve liberada', done: false },
      { id: 'd10_crostas', icon: Heart, title: 'Crostas soltando naturalmente', done: false },
    ]
  },
  {
    day: 15,
    label: 'D15',
    tasks: [
      { id: 'd15_chuveiro', icon: ShowerHead, title: 'Chuveiro normal liberado', done: false },
      { id: 'd15_shampoo', icon: Droplets, title: 'Shampoo regular permitido', done: false },
      { id: 'd15_massagem', icon: Heart, title: 'Massagens liberadas', done: false },
    ]
  },
];

// Restrictions timeline
const restrictions = [
  { icon: Bed, title: 'Dormir de barriga ↑', until: 8 },
  { icon: Coffee, title: 'Evitar café', until: 5 },
  { icon: Wine, title: 'Sem álcool', until: 5 },
  { icon: Dumbbell, title: 'Sem academia', until: 10 },
  { icon: Shirt, title: 'Camisas com botão', until: 14 },
  { icon: Sun, title: 'Evitar sol', until: 60 },
  { icon: Waves, title: 'Sem piscina/mar', until: 60 },
  { icon: Cat, title: 'Pets afastados', until: 5 },
];

export default function NeoCareOrientations() {
  // Simulate current day (-3 = 3 days before D0, 5 = 5 days after D0)
  const [currentDay, setCurrentDay] = useState(5);
  
  // Checklist states
  const [preChecked, setPreChecked] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('neocare_pre_checklist');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [postChecked, setPostChecked] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('neocare_post_checklist');
    return saved ? JSON.parse(saved) : {};
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('neocare_pre_checklist', JSON.stringify(preChecked));
  }, [preChecked]);

  useEffect(() => {
    localStorage.setItem('neocare_post_checklist', JSON.stringify(postChecked));
  }, [postChecked]);

  // Toggle handlers
  const togglePre = (id: string) => {
    const newState = !preChecked[id];
    setPreChecked(prev => ({ ...prev, [id]: newState }));
    if (newState) {
      toast.success('Item concluído! 🎉');
    }
  };

  const togglePost = (id: string) => {
    const newState = !postChecked[id];
    setPostChecked(prev => ({ ...prev, [id]: newState }));
    if (newState) {
      toast.success('Ótimo trabalho! Continue assim! 💪');
    }
  };

  // Calculate progress
  const preProgress = Math.round(
    (Object.values(preChecked).filter(Boolean).length / preTransplantChecklist.length) * 100
  );
  
  const relevantPostTasks = postTransplantChecklist
    .filter(day => day.day <= Math.max(currentDay, 1))
    .flatMap(day => day.tasks);
  
  const postProgress = relevantPostTasks.length > 0 
    ? Math.round((Object.values(postChecked).filter(Boolean).length / relevantPostTasks.length) * 100)
    : 0;

  const isPrePhase = currentDay < 0;
  const totalProgress = isPrePhase ? preProgress : postProgress;

  return (
    <div className="space-y-4 pb-6 max-w-2xl mx-auto">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold">Sua Jornada</h1>
            <p className="text-emerald-100 text-sm">
              {currentDay < 0 
                ? `${Math.abs(currentDay)} dias para o transplante` 
                : currentDay === 0 
                  ? 'Hoje é o grande dia!' 
                  : `Dia ${currentDay} pós-transplante`}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            <Trophy className="h-4 w-4" />
            <span className="font-bold text-sm">{totalProgress}%</span>
          </div>
        </div>
        <Progress value={totalProgress} className="h-2 bg-white/20" />
      </div>

      {/* Timeline Navigation */}
      <div className="flex items-center justify-center gap-1 py-2 overflow-x-auto">
        <button
          onClick={() => setCurrentDay(-3)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            currentDay < 0 
              ? "bg-amber-500 text-white" 
              : "bg-muted hover:bg-muted/80"
          )}
        >
          PRÉ
        </button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setCurrentDay(0)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
            currentDay === 0 
              ? "bg-emerald-500 text-white ring-2 ring-emerald-300" 
              : "bg-muted hover:bg-muted/80"
          )}
        >
          D0
        </button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setCurrentDay(5)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            currentDay > 0 
              ? "bg-blue-500 text-white" 
              : "bg-muted hover:bg-muted/80"
          )}
        >
          PÓS
        </button>
      </div>

      {/* Pre-Transplant Phase */}
      {currentDay < 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            <h2 className="font-semibold text-sm">Checklist Pré-Transplante</h2>
            <Badge variant="secondary" className="ml-auto text-xs">
              {Object.values(preChecked).filter(Boolean).length}/{preTransplantChecklist.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {preTransplantChecklist.map((item) => {
              const Icon = item.icon;
              const isChecked = preChecked[item.id];
              return (
                <Card 
                  key={item.id}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-[1.01]",
                    isChecked && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                  )}
                  onClick={() => togglePre(item.id)}
                >
                  <CardContent className="py-3 flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      isChecked 
                        ? "bg-emerald-500 text-white" 
                        : "bg-muted"
                    )}>
                      {isChecked ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm",
                        isChecked && "line-through text-muted-foreground"
                      )}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    {isChecked && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {preProgress === 100 && (
            <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200">
              <CardContent className="py-4 text-center">
                <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="font-bold text-amber-700 dark:text-amber-400">
                  Preparação completa! 🎉
                </p>
                <p className="text-xs text-muted-foreground">
                  Você está pronto para o transplante
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* D0 - Transplant Day */}
      {currentDay === 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200">
          <CardContent className="py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white mx-auto mb-3 flex items-center justify-center">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">
              Dia do Transplante
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Relaxe e confie na equipe médica
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Duração média: 6-8 horas</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-Transplant Phase */}
      {currentDay > 0 && (
        <div className="space-y-4">
          {/* Today's Tasks */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <h2 className="font-semibold text-sm">Tarefas de Hoje (D{currentDay})</h2>
            </div>

            {postTransplantChecklist
              .filter(day => day.day <= currentDay)
              .slice(-1)
              .map(day => (
                <div key={day.day} className="space-y-2">
                  {day.tasks.map((task) => {
                    const Icon = task.icon;
                    const isChecked = postChecked[task.id];
                    return (
                      <Card 
                        key={task.id}
                        className={cn(
                          "cursor-pointer transition-all hover:scale-[1.01]",
                          isChecked && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                        )}
                        onClick={() => togglePost(task.id)}
                      >
                        <CardContent className="py-3 flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            isChecked 
                              ? "bg-blue-500 text-white" 
                              : "bg-muted"
                          )}>
                            {isChecked ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                          </div>
                          <p className={cn(
                            "font-medium text-sm flex-1",
                            isChecked && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>
                          {isChecked && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ))}
          </div>

          {/* Active Restrictions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Restrições Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {restrictions
                  .filter(r => currentDay < r.until)
                  .map((r, idx) => {
                    const Icon = r.icon;
                    const daysLeft = r.until - currentDay;
                    return (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground">{daysLeft}d restantes</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Progress Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Linha do Tempo Pós</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 overflow-x-auto pb-2">
                {postTransplantChecklist.map((day) => {
                  const dayTasks = day.tasks;
                  const completedCount = dayTasks.filter(t => postChecked[t.id]).length;
                  const isComplete = completedCount === dayTasks.length;
                  const isCurrent = day.day === currentDay || 
                    (day.day < currentDay && postTransplantChecklist.find(d => d.day > day.day && d.day <= currentDay) === undefined);
                  const isFuture = day.day > currentDay;

                  return (
                    <button
                      key={day.day}
                      onClick={() => setCurrentDay(day.day)}
                      className={cn(
                        "flex flex-col items-center px-3 py-2 rounded-lg min-w-[60px] transition-all",
                        isCurrent && "bg-blue-100 dark:bg-blue-950/50",
                        isFuture && "opacity-40"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1",
                        isComplete ? "bg-emerald-500 text-white" :
                        isCurrent ? "bg-blue-500 text-white" :
                        "bg-muted"
                      )}>
                        {isComplete ? <Check className="h-4 w-4" /> : day.label}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {completedCount}/{dayTasks.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact */}
      <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Dúvidas?</p>
              <p className="text-xs text-muted-foreground">(85) 98118-1212</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
