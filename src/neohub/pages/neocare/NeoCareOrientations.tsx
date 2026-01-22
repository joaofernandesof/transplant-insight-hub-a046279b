import { useState, useEffect } from 'react';
import { 
  Check, Square, CheckSquare, Droplets, Pill, Wine, Cigarette,
  FileCheck, Stethoscope, ShowerHead, Bed, Sun,
  Dumbbell, Shirt, Coffee, Waves, Cat, Phone,
  Trophy, ChevronRight, Sparkles, Heart,
  Calendar, Clock, AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Pre-transplant checklist
const preTransplantChecklist = [
  { id: 'exames', icon: FileCheck, title: 'Exames solicitados', desc: 'Hemograma, coagulograma, glicemia' },
  { id: 'consulta', icon: Stethoscope, title: 'Consulta pré-operatória', desc: 'Avaliação médica' },
  { id: 'minoxidil', icon: Pill, title: 'Parar Minoxidil', desc: '7 dias antes' },
  { id: 'aspirina', icon: Pill, title: 'Parar AAS/Aspirina', desc: '7 dias antes' },
  { id: 'vitaminas', icon: Pill, title: 'Parar vitamina E', desc: '7 dias antes' },
  { id: 'alcool', icon: Wine, title: 'Evitar álcool', desc: '5 dias antes' },
  { id: 'cigarro', icon: Cigarette, title: 'Parar de fumar', desc: '7 dias antes' },
  { id: 'cabelo', icon: ShowerHead, title: 'Lavar o cabelo', desc: 'Manhã do procedimento' },
];

// Post-transplant checklist by day with times
const postTransplantChecklist = [
  {
    day: 1,
    label: 'D1',
    tasks: [
      { id: 'd1_soro', icon: Droplets, title: 'Borrifar soro', time: 'A cada 1h' },
      { id: 'd1_dormir', icon: Bed, title: 'Dormir de barriga para cima', time: 'Noite toda' },
      { id: 'd1_gelo', icon: Heart, title: 'Aplicar gelo na testa', time: '20min 3x/dia' },
    ]
  },
  {
    day: 2,
    label: 'D2',
    tasks: [
      { id: 'd2_soro', icon: Droplets, title: 'Continuar soro', time: 'A cada 1h' },
      { id: 'd2_medicacao', icon: Pill, title: 'Tomar medicação', time: '8h e 20h' },
      { id: 'd2_repouso', icon: Bed, title: 'Manter repouso', time: 'Dia todo' },
    ]
  },
  {
    day: 3,
    label: 'D3',
    tasks: [
      { id: 'd3_lavar', icon: ShowerHead, title: 'Primeira lavagem suave', time: 'Manhã' },
      { id: 'd3_doadora', icon: Droplets, title: 'Esfregar área doadora', time: 'Durante banho' },
      { id: 'd3_secar', icon: Sun, title: 'Secar ao vento', time: 'Após lavar' },
    ]
  },
  {
    day: 5,
    label: 'D5',
    tasks: [
      { id: 'd5_lavagem', icon: ShowerHead, title: 'Lavagem cuidadosa', time: 'Manhã' },
      { id: 'd5_espuma', icon: Droplets, title: 'Aplicar espuma suave', time: 'Durante lavagem' },
      { id: 'd5_cafe', icon: Coffee, title: 'Pode voltar café moderado', time: '1-2 xícaras' },
    ]
  },
  {
    day: 8,
    label: 'D8',
    tasks: [
      { id: 'd8_circular', icon: ShowerHead, title: 'Movimentos circulares', time: 'Durante lavagem' },
      { id: 'd8_lado', icon: Bed, title: 'Pode dormir de lado', time: 'Liberado' },
      { id: 'd8_camisa', icon: Shirt, title: 'Camisas com botão', time: 'Até D14' },
    ]
  },
  {
    day: 10,
    label: 'D10',
    tasks: [
      { id: 'd10_oleo', icon: Sparkles, title: 'Iniciar óleo de girassol', time: 'Noite' },
      { id: 'd10_academia', icon: Dumbbell, title: 'Academia leve liberada', time: 'Sem esforço' },
      { id: 'd10_crostas', icon: Heart, title: 'Crostas soltando', time: 'Naturalmente' },
    ]
  },
  {
    day: 15,
    label: 'D15',
    tasks: [
      { id: 'd15_chuveiro', icon: ShowerHead, title: 'Chuveiro normal liberado', time: 'Liberado' },
      { id: 'd15_shampoo', icon: Droplets, title: 'Shampoo regular', time: 'Liberado' },
      { id: 'd15_massagem', icon: Heart, title: 'Massagens liberadas', time: 'Liberado' },
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
  const [currentDay, setCurrentDay] = useState(5);
  
  const [preChecked, setPreChecked] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('neocare_pre_checklist');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [postChecked, setPostChecked] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('neocare_post_checklist');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('neocare_pre_checklist', JSON.stringify(preChecked));
  }, [preChecked]);

  useEffect(() => {
    localStorage.setItem('neocare_post_checklist', JSON.stringify(postChecked));
  }, [postChecked]);

  const togglePre = (id: string) => {
    const newState = !preChecked[id];
    setPreChecked(prev => ({ ...prev, [id]: newState }));
    if (newState) toast.success('Item concluído! 🎉');
  };

  const togglePost = (id: string) => {
    const newState = !postChecked[id];
    setPostChecked(prev => ({ ...prev, [id]: newState }));
    if (newState) toast.success('Ótimo trabalho! 💪');
  };

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

  const activeRestrictions = restrictions.filter(r => currentDay < r.until);

  return (
    <div className="space-y-6 pb-6 max-w-2xl mx-auto">
      {/* Header */}
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
      <div className="flex items-center justify-center gap-1 py-2">
        <button
          onClick={() => setCurrentDay(-3)}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
            currentDay < 0 ? "bg-amber-500 text-white" : "bg-muted hover:bg-muted/80"
          )}
        >
          PRÉ
        </button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setCurrentDay(0)}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
            currentDay === 0 ? "bg-emerald-500 text-white" : "bg-muted hover:bg-muted/80"
          )}
        >
          D0
        </button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setCurrentDay(5)}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
            currentDay > 0 ? "bg-blue-500 text-white" : "bg-muted hover:bg-muted/80"
          )}
        >
          PÓS
        </button>
      </div>

      {/* PRE-TRANSPLANT */}
      {currentDay < 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            <h2 className="font-semibold text-sm">Checklist Pré-Transplante</h2>
            <Badge variant="secondary" className="ml-auto text-xs">
              {Object.values(preChecked).filter(Boolean).length}/{preTransplantChecklist.length}
            </Badge>
          </div>

          <div className="space-y-1">
            {preTransplantChecklist.map((item) => {
              const Icon = item.icon;
              const isChecked = preChecked[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => togglePre(item.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                    isChecked 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
                      : "bg-background border-border hover:bg-muted/50"
                  )}
                >
                  {isChecked ? (
                    <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <Icon className={cn(
                    "h-4 w-4 shrink-0",
                    isChecked ? "text-emerald-500" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      isChecked && "line-through text-muted-foreground"
                    )}>
                      {item.title}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* D0 - TRANSPLANT DAY */}
      {currentDay === 0 && (
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-white mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            Dia do Transplante
          </h2>
          <p className="text-muted-foreground mb-4">
            Relaxe e confie na equipe médica
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Duração média: 6-8 horas</span>
          </div>
        </div>
      )}

      {/* POST-TRANSPLANT */}
      {currentDay > 0 && (
        <div className="space-y-6">
          {/* Today's Tasks */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <h2 className="font-semibold text-sm">Tarefas de Hoje (D{currentDay})</h2>
            </div>

            <div className="space-y-1">
              {postTransplantChecklist
                .filter(day => day.day <= currentDay)
                .slice(-1)
                .flatMap(day => day.tasks)
                .map((task) => {
                  const Icon = task.icon;
                  const isChecked = postChecked[task.id];
                  return (
                    <div
                      key={task.id}
                      onClick={() => togglePost(task.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                        isChecked 
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" 
                          : "bg-background border-border hover:bg-muted/50"
                      )}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-5 w-5 text-blue-500 shrink-0" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <Icon className={cn(
                        "h-4 w-4 shrink-0",
                        isChecked ? "text-blue-500" : "text-muted-foreground"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          isChecked && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {task.time}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </div>

          <Separator />

          {/* Active Restrictions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <h2 className="font-semibold text-sm">Restrições Ativas</h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {activeRestrictions.map((r, idx) => {
                const Icon = r.icon;
                const daysLeft = r.until - currentDay;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 p-3 rounded-lg border bg-background"
                  >
                    <Icon className="h-4 w-4 text-orange-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground">{daysLeft}d restantes</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Day Timeline */}
          <div className="space-y-3">
            <h2 className="font-semibold text-sm">Linha do Tempo Pós</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {postTransplantChecklist.map((day) => {
                const completedCount = day.tasks.filter(t => postChecked[t.id]).length;
                const isCurrent = day.day === currentDay;
                const isFuture = day.day > currentDay;

                return (
                  <button
                    key={day.day}
                    onClick={() => setCurrentDay(day.day)}
                    className={cn(
                      "flex flex-col items-center px-3 py-2 rounded-lg min-w-[56px] transition-all border",
                      isCurrent && "bg-blue-50 dark:bg-blue-950/30 border-blue-300",
                      !isCurrent && !isFuture && "border-border",
                      isFuture && "opacity-50 border-border"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-bold",
                      isCurrent && "text-blue-600 dark:text-blue-400"
                    )}>
                      {day.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {completedCount}/{day.tasks.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Dúvidas?</p>
              <p className="text-xs text-muted-foreground">(85) 98118-1212</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
