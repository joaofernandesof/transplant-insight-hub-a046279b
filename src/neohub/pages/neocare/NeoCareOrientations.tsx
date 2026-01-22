import { useState } from 'react';
import { 
  Check, Droplets, Pill, Wine, Cigarette,
  FileCheck, Stethoscope, ShowerHead, Bed, Sun,
  Dumbbell, Shirt, Coffee, Waves, Cat,
  Trophy, ChevronRight, Sparkles, Heart,
  Calendar, Clock, AlertCircle, Bell,
  AlertTriangle, Loader2, MessageSquare, CalendarDays
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format, addDays, isBefore, startOfDay, isToday as isDateToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePatientSurgeryDate } from '@/neohub/hooks/usePatientSurgeryDate';
import { usePatientOrientationProgress } from '@/neohub/hooks/usePatientOrientationProgress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

// Pre-transplant checklist grouped by day before D0
const preTransplantByDay = [
  { 
    daysBeforeD0: 7, 
    label: 'D-7',
    tasks: [
      { id: 'exames', icon: FileCheck, title: 'Exames solicitados', desc: 'Hemograma, coagulograma, glicemia' },
      { id: 'minoxidil', icon: Pill, title: 'Parar Minoxidil', desc: 'Suspender uso' },
      { id: 'aspirina', icon: Pill, title: 'Parar AAS/Aspirina', desc: 'Suspender uso' },
      { id: 'vitaminas', icon: Pill, title: 'Parar vitamina E', desc: 'Suspender uso' },
      { id: 'cigarro', icon: Cigarette, title: 'Parar de fumar', desc: 'Iniciar abstinência' },
    ]
  },
  { 
    daysBeforeD0: 5, 
    label: 'D-5',
    tasks: [
      { id: 'alcool', icon: Wine, title: 'Evitar álcool', desc: 'Abstinência total' },
    ]
  },
  { 
    daysBeforeD0: 3, 
    label: 'D-3',
    tasks: [
      { id: 'consulta', icon: Stethoscope, title: 'Consulta pré-operatória', desc: 'Avaliação médica' },
    ]
  },
  { 
    daysBeforeD0: 0, 
    label: 'D0',
    tasks: [
      { id: 'cabelo', icon: ShowerHead, title: 'Lavar o cabelo', desc: 'Manhã do procedimento' },
    ]
  },
];

// Post-transplant checklist by day with times
const postTransplantByDay = [
  {
    day: 1,
    label: 'D+1',
    tasks: [
      { id: 'd1_soro', icon: Droplets, title: 'Borrifar soro', time: 'A cada 1h' },
      { id: 'd1_dormir', icon: Bed, title: 'Dormir de barriga para cima', time: 'Noite toda' },
      { id: 'd1_gelo', icon: Heart, title: 'Aplicar gelo na testa', time: '20min 3x/dia' },
    ]
  },
  {
    day: 2,
    label: 'D+2',
    tasks: [
      { id: 'd2_soro', icon: Droplets, title: 'Continuar soro', time: 'A cada 1h' },
      { id: 'd2_medicacao', icon: Pill, title: 'Tomar medicação', time: '8h e 20h' },
      { id: 'd2_repouso', icon: Bed, title: 'Manter repouso', time: 'Dia todo' },
    ]
  },
  {
    day: 3,
    label: 'D+3',
    tasks: [
      { id: 'd3_lavar', icon: ShowerHead, title: 'Primeira lavagem suave', time: 'Manhã' },
      { id: 'd3_doadora', icon: Droplets, title: 'Esfregar área doadora', time: 'Durante banho' },
      { id: 'd3_secar', icon: Sun, title: 'Secar ao vento', time: 'Após lavar' },
    ]
  },
  {
    day: 5,
    label: 'D+5',
    tasks: [
      { id: 'd5_lavagem', icon: ShowerHead, title: 'Lavagem cuidadosa', time: 'Manhã' },
      { id: 'd5_espuma', icon: Droplets, title: 'Aplicar espuma suave', time: 'Durante lavagem' },
      { id: 'd5_cafe', icon: Coffee, title: 'Pode voltar café moderado', time: '1-2 xícaras' },
    ]
  },
  {
    day: 8,
    label: 'D+8',
    tasks: [
      { id: 'd8_circular', icon: ShowerHead, title: 'Movimentos circulares', time: 'Durante lavagem' },
      { id: 'd8_lado', icon: Bed, title: 'Pode dormir de lado', time: 'Liberado' },
      { id: 'd8_camisa', icon: Shirt, title: 'Camisas com botão', time: 'Até D+14' },
    ]
  },
  {
    day: 10,
    label: 'D+10',
    tasks: [
      { id: 'd10_oleo', icon: Sparkles, title: 'Iniciar óleo de girassol', time: 'Noite' },
      { id: 'd10_academia', icon: Dumbbell, title: 'Academia leve liberada', time: 'Sem esforço' },
      { id: 'd10_crostas', icon: Heart, title: 'Crostas soltando', time: 'Naturalmente' },
    ]
  },
  {
    day: 15,
    label: 'D+15',
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

type Phase = 'pre' | 'd0' | 'pos';

export default function NeoCareOrientations() {
  // Fetch real surgery date from database
  const { surgeryDate: dbSurgeryDate, isLoading: surgeryLoading } = usePatientSurgeryDate();
  
  // Fetch orientation progress from database
  const { 
    isTaskCompleted, 
    getCompletedAt, 
    toggleTask, 
  } = usePatientOrientationProgress();
  
  // Use database date if available, otherwise fallback
  const surgeryDate = dbSurgeryDate || addDays(new Date(), -5);
  
  // Calculate current day relative to surgery
  const today = startOfDay(new Date());
  const surgeryDay = startOfDay(surgeryDate);
  const currentDay = Math.floor((today.getTime() - surgeryDay.getTime()) / (1000 * 60 * 60 * 24));
  
  // Determine initial phase based on current day
  const getInitialPhase = (): Phase => {
    if (currentDay < 0) return 'pre';
    if (currentDay === 0) return 'd0';
    return 'pos';
  };
  
  const [selectedPhase, setSelectedPhase] = useState<Phase>(getInitialPhase());
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  
  // Helper functions
  const togglePre = (id: string, daysBeforeD0: number) => {
    toggleTask({ taskId: id, taskType: 'pre', taskDay: -daysBeforeD0 });
  };

  const togglePost = (id: string, taskDay: number) => {
    toggleTask({ taskId: id, taskType: 'post', taskDay });
  };

  // Get real date for a day offset
  const getRealDate = (dayOffset: number) => {
    return addDays(surgeryDate, dayOffset);
  };

  // Progress calculations
  const allPreTasks = preTransplantByDay.flatMap(d => d.tasks);
  const completedPreCount = allPreTasks.filter(t => isTaskCompleted(t.id)).length;
  const preProgress = Math.round((completedPreCount / allPreTasks.length) * 100);
  
  const allPostTasks = postTransplantByDay.flatMap(d => d.tasks);
  const completedPostCount = allPostTasks.filter(t => isTaskCompleted(t.id)).length;
  const postProgress = Math.round((completedPostCount / allPostTasks.length) * 100);
  
  const totalProgress = selectedPhase === 'pre' ? preProgress : selectedPhase === 'pos' ? postProgress : 100;

  const activeRestrictions = restrictions.filter(r => currentDay < r.until);

  // Phase definitions - Custom hair follicle SVG for surgery
  const HairFollicleIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="18" rx="4" ry="3" />
      <path d="M12 15 C12 10, 8 6, 12 2" />
      <path d="M12 15 C12 10, 16 6, 12 2" />
      <path d="M10 14 C8 12, 7 8, 9 4" />
      <path d="M14 14 C16 12, 17 8, 15 4" />
    </svg>
  );

  const phases = [
    { key: 'pre' as Phase, label: 'Pré-operatório', icon: Calendar },
    { key: 'd0' as Phase, label: 'Cirurgia', icon: null, customIcon: HairFollicleIcon },
    { key: 'pos' as Phase, label: 'Cuidados Contínuos', icon: Droplets },
  ];

  // Loading state
  if (surgeryLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No surgery date configured
  if (!dbSurgeryDate) {
    return (
      <div className="space-y-4 pb-6 max-w-2xl mx-auto">
        <div className="bg-card border rounded-xl p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Calendar className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Data da Cirurgia Não Definida</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sua data de cirurgia ainda não foi cadastrada no sistema.
            </p>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-support-chat'))}
            className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 mt-4 w-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Dúvidas?</p>
              <p className="text-xs text-muted-foreground">Fale com nosso assistente IA</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // Filter timeline data based on selected date
  const getFilteredPreData = () => {
    if (!filterDate) return preTransplantByDay;
    const filterDayOffset = Math.floor((filterDate.getTime() - surgeryDay.getTime()) / (1000 * 60 * 60 * 24));
    return preTransplantByDay.filter(d => -d.daysBeforeD0 === filterDayOffset);
  };

  const getFilteredPostData = () => {
    if (!filterDate) return postTransplantByDay;
    const filterDayOffset = Math.floor((filterDate.getTime() - surgeryDay.getTime()) / (1000 * 60 * 60 * 24));
    return postTransplantByDay.filter(d => d.day === filterDayOffset);
  };

  return (
    <div className="space-y-4 pb-6 max-w-2xl mx-auto">
      {/* Header Card */}
      <div className="bg-card border rounded-xl p-4 space-y-4">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Suas Orientações</h1>
            <p className="text-muted-foreground text-sm">
              {currentDay < 0 
                ? `Faltam ${Math.abs(currentDay)} dias para o transplante` 
                : currentDay === 0 
                  ? '🎉 Hoje é o grande dia!' 
                  : `Dia ${currentDay} pós-transplante`}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full px-3 py-1.5">
            <Trophy className="h-4 w-4" />
            <span className="font-bold text-sm">{totalProgress}%</span>
          </div>
        </div>
        
        {/* Phase Selector - Clickable */}
        <div className="flex items-stretch gap-1">
          {phases.map((p, idx) => {
            const PhaseIcon = p.icon;
            const isActive = selectedPhase === p.key;
            const isPast = phases.findIndex(x => x.key === selectedPhase) > idx;
            const isCurrentPhase = (p.key === 'pre' && currentDay < 0) || 
                                   (p.key === 'd0' && currentDay === 0) || 
                                   (p.key === 'pos' && currentDay > 0);
            
            return (
              <button
                key={p.key}
                onClick={() => {
                  setSelectedPhase(p.key);
                  setFilterDate(undefined);
                }}
                className={cn(
                  "flex-1 flex flex-col items-center py-3 px-2 rounded-lg transition-all border-2",
                  isActive 
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500" 
                    : "bg-background border-transparent hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-full h-1.5 rounded-full mb-2",
                  isActive ? "bg-emerald-500" : isPast ? "bg-emerald-300 dark:bg-emerald-700" : "bg-muted"
                )} />
                {p.customIcon ? (
                  <p.customIcon className={cn(
                    "h-5 w-5 mb-1",
                    isActive ? "text-emerald-500" : "text-muted-foreground"
                  )} />
                ) : (
                  <PhaseIcon className={cn(
                    "h-5 w-5 mb-1",
                    isActive ? "text-emerald-500" : "text-muted-foreground"
                  )} />
                )}
                <span className={cn(
                  "text-xs font-medium text-center leading-tight",
                  isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}>
                  {p.label}
                </span>
                {isCurrentPhase && (
                  <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                    Atual
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Row */}
      {selectedPhase !== 'd0' && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm text-muted-foreground">Filtrar por dia:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                {filterDate ? format(filterDate, "dd/MM", { locale: ptBR }) : "Todos"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                mode="single"
                selected={filterDate}
                onSelect={(date) => setFilterDate(date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {filterDate && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilterDate(undefined)}
              className="text-xs"
            >
              Limpar
            </Button>
          )}
        </div>
      )}

      <Separator />

      {/* PRE-OPERATÓRIO - Vertical Timeline */}
      {selectedPhase === 'pre' && (
        <div className="space-y-0 relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border" />
          
          {getFilteredPreData().map((dayGroup, idx) => {
            const realDate = getRealDate(-dayGroup.daysBeforeD0);
            const isDayToday = isDateToday(realDate);
            const isPast = isBefore(realDate, today);
            const allCompleted = dayGroup.tasks.every(t => isTaskCompleted(t.id));
            
            return (
              <div key={dayGroup.label} className="relative pl-12 pb-6">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-3 top-1 w-4 h-4 rounded-full border-2 bg-background z-10",
                  allCompleted 
                    ? "border-emerald-500 bg-emerald-500" 
                    : isDayToday 
                      ? "border-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900" 
                      : isPast && !allCompleted
                        ? "border-red-400"
                        : "border-muted-foreground"
                )}>
                  {allCompleted && <Check className="h-2.5 w-2.5 text-white absolute top-0.5 left-0.5" />}
                </div>
                
                {/* Day header */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={isDayToday ? "default" : "outline"} className={cn(
                    "font-semibold",
                    isDayToday && "bg-emerald-500"
                  )}>
                    {dayGroup.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(realDate, "EEEE, dd 'de' MMM", { locale: ptBR })}
                  </span>
                  {isDayToday && (
                    <Badge variant="secondary" className="text-[10px]">HOJE</Badge>
                  )}
                </div>
                
                {/* Tasks */}
                <div className="space-y-2">
                  {dayGroup.tasks.map((task) => {
                    const Icon = task.icon;
                    const isChecked = isTaskCompleted(task.id);
                    const isOverdue = !isChecked && isPast && !isDayToday;
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => togglePre(task.id, dayGroup.daysBeforeD0)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                          isChecked 
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
                            : isOverdue
                              ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                              : "bg-background border-border hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => togglePre(task.id, dayGroup.daysBeforeD0)}
                          className={cn(
                            "h-5 w-5 shrink-0 border-2",
                            isChecked 
                              ? "border-emerald-500 bg-emerald-500 data-[state=checked]:bg-emerald-500" 
                              : isOverdue 
                                ? "border-red-400" 
                                : "border-muted-foreground/50"
                          )}
                        />
                        {isOverdue && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 rounded text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-[10px] font-semibold uppercase">Atrasado</span>
                          </div>
                        )}
                        <Icon className={cn(
                          "h-4 w-4 shrink-0",
                          isChecked ? "text-emerald-500" : isOverdue ? "text-red-500" : "text-muted-foreground"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            isChecked && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{task.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* D0 - CIRURGIA */}
      {selectedPhase === 'd0' && (
        <div className="text-center py-12">
          <div className="w-24 h-24 rounded-full bg-emerald-500 text-white mx-auto mb-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12">
              <ellipse cx="12" cy="18" rx="4" ry="3" />
              <path d="M12 15 C12 10, 8 6, 12 2" />
              <path d="M12 15 C12 10, 16 6, 12 2" />
              <path d="M10 14 C8 12, 7 8, 9 4" />
              <path d="M14 14 C16 12, 17 8, 15 4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-3">
            Dia do Transplante
          </h2>
          <p className="text-muted-foreground text-lg mb-2">
            {format(surgeryDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Relaxe e confie na nossa equipe. Sua transformação será incrível! 🌟
          </p>
          
          {currentDay === 0 && (
            <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 max-w-sm mx-auto">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                🎉 Hoje é o grande dia!
              </p>
            </div>
          )}
        </div>
      )}

      {/* PÓS-OPERATÓRIO - Vertical Timeline */}
      {selectedPhase === 'pos' && (
        <div className="space-y-0 relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border" />
          
          {getFilteredPostData().map((dayGroup) => {
            const realDate = getRealDate(dayGroup.day);
            const isDayToday = isDateToday(realDate);
            const isPast = isBefore(realDate, today);
            const allCompleted = dayGroup.tasks.every(t => isTaskCompleted(t.id));
            
            return (
              <div key={dayGroup.label} className="relative pl-12 pb-6">
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-3 top-1 w-4 h-4 rounded-full border-2 bg-background z-10",
                  allCompleted 
                    ? "border-emerald-500 bg-emerald-500" 
                    : isDayToday 
                      ? "border-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900" 
                      : isPast && !allCompleted
                        ? "border-red-400"
                        : "border-muted-foreground"
                )}>
                  {allCompleted && <Check className="h-2.5 w-2.5 text-white absolute top-0.5 left-0.5" />}
                </div>
                
                {/* Day header */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={isDayToday ? "default" : "outline"} className={cn(
                    "font-semibold",
                    isDayToday && "bg-emerald-500"
                  )}>
                    {dayGroup.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(realDate, "EEEE, dd 'de' MMM", { locale: ptBR })}
                  </span>
                  {isDayToday && (
                    <Badge variant="secondary" className="text-[10px]">HOJE</Badge>
                  )}
                </div>
                
                {/* Tasks */}
                <div className="space-y-2">
                  {dayGroup.tasks.map((task) => {
                    const Icon = task.icon;
                    const isChecked = isTaskCompleted(task.id);
                    const completedAt = getCompletedAt(task.id);
                    const isOverdue = !isChecked && isPast && !isDayToday;
                    
                    return (
                      <div
                        key={task.id}
                        onClick={() => togglePost(task.id, dayGroup.day)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                          isChecked 
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
                            : isOverdue
                              ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                              : "bg-background border-border hover:bg-muted/50"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => togglePost(task.id, dayGroup.day)}
                          className={cn(
                            "h-5 w-5 shrink-0 border-2",
                            isChecked 
                              ? "border-emerald-500 bg-emerald-500 data-[state=checked]:bg-emerald-500" 
                              : isOverdue 
                                ? "border-red-400" 
                                : "border-muted-foreground/50"
                          )}
                        />
                        {isOverdue && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 rounded text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-[10px] font-semibold uppercase">Atrasado</span>
                          </div>
                        )}
                        <Icon className={cn(
                          "h-4 w-4 shrink-0",
                          isChecked ? "text-emerald-500" : isOverdue ? "text-red-500" : "text-muted-foreground"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-medium",
                            isChecked && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>
                          {completedAt && (
                            <p className="text-xs text-muted-foreground">
                              ✓ {format(new Date(completedAt), "dd/MM 'às' HH:mm")}
                            </p>
                          )}
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
            );
          })}

          {/* Restrictions - only show in pos phase */}
          {activeRestrictions.length > 0 && !filterDate && (
            <>
              <Separator className="my-4" />
              <div className="pl-12 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <h2 className="font-semibold text-sm">Restrições Ativas</h2>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {activeRestrictions.slice(0, 4).map((r, idx) => {
                    const Icon = r.icon;
                    const daysLeft = r.until - currentDay;
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-2 rounded-lg border bg-background"
                      >
                        <Icon className="h-4 w-4 text-orange-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground">{daysLeft}d</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <Separator />

      {/* Notification Settings Teaser */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Ative as notificações</p>
          <p className="text-xs text-muted-foreground">Receba lembretes por WhatsApp</p>
        </div>
        <Button size="sm" variant="outline">
          Configurar
        </Button>
      </div>

      {/* Contact - AI Support */}
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('open-support-chat'))}
        className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 w-full hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Dúvidas?</p>
          <p className="text-xs text-muted-foreground">Fale com nosso assistente IA</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
