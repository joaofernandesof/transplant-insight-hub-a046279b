import { useState, useEffect } from 'react';
import { 
  Check, Square, CheckSquare, Droplets, Pill, Wine, Cigarette,
  FileCheck, Stethoscope, ShowerHead, Bed, Sun,
  Dumbbell, Shirt, Coffee, Waves, Cat, Phone,
  Trophy, ChevronRight, Sparkles, Heart,
  Calendar, Clock, AlertCircle, CalendarPlus, Bell,
  AlertTriangle, XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Pre-transplant checklist
const preTransplantChecklist = [
  { id: 'exames', icon: FileCheck, title: 'Exames solicitados', desc: 'Hemograma, coagulograma, glicemia', daysBeforeD0: 7 },
  { id: 'consulta', icon: Stethoscope, title: 'Consulta pré-operatória', desc: 'Avaliação médica', daysBeforeD0: 3 },
  { id: 'minoxidil', icon: Pill, title: 'Parar Minoxidil', desc: '7 dias antes', daysBeforeD0: 7 },
  { id: 'aspirina', icon: Pill, title: 'Parar AAS/Aspirina', desc: '7 dias antes', daysBeforeD0: 7 },
  { id: 'vitaminas', icon: Pill, title: 'Parar vitamina E', desc: '7 dias antes', daysBeforeD0: 7 },
  { id: 'alcool', icon: Wine, title: 'Evitar álcool', desc: '5 dias antes', daysBeforeD0: 5 },
  { id: 'cigarro', icon: Cigarette, title: 'Parar de fumar', desc: '7 dias antes', daysBeforeD0: 7 },
  { id: 'cabelo', icon: ShowerHead, title: 'Lavar o cabelo', desc: 'Manhã do procedimento', daysBeforeD0: 0 },
];

// Post-transplant checklist by day with times
const postTransplantChecklist = [
  {
    day: 1,
    label: 'D1',
    tasks: [
      { id: 'd1_soro', icon: Droplets, title: 'Borrifar soro', time: 'A cada 1h', startTime: '08:00', endTime: '22:00' },
      { id: 'd1_dormir', icon: Bed, title: 'Dormir de barriga para cima', time: 'Noite toda', startTime: '22:00' },
      { id: 'd1_gelo', icon: Heart, title: 'Aplicar gelo na testa', time: '20min 3x/dia', startTime: '10:00' },
    ]
  },
  {
    day: 2,
    label: 'D2',
    tasks: [
      { id: 'd2_soro', icon: Droplets, title: 'Continuar soro', time: 'A cada 1h', startTime: '08:00', endTime: '22:00' },
      { id: 'd2_medicacao', icon: Pill, title: 'Tomar medicação', time: '8h e 20h', startTime: '08:00' },
      { id: 'd2_repouso', icon: Bed, title: 'Manter repouso', time: 'Dia todo', startTime: '08:00' },
    ]
  },
  {
    day: 3,
    label: 'D3',
    tasks: [
      { id: 'd3_lavar', icon: ShowerHead, title: 'Primeira lavagem suave', time: 'Manhã', startTime: '09:00' },
      { id: 'd3_doadora', icon: Droplets, title: 'Esfregar área doadora', time: 'Durante banho', startTime: '09:00' },
      { id: 'd3_secar', icon: Sun, title: 'Secar ao vento', time: 'Após lavar', startTime: '09:30' },
    ]
  },
  {
    day: 5,
    label: 'D5',
    tasks: [
      { id: 'd5_lavagem', icon: ShowerHead, title: 'Lavagem cuidadosa', time: 'Manhã', startTime: '09:00' },
      { id: 'd5_espuma', icon: Droplets, title: 'Aplicar espuma suave', time: 'Durante lavagem', startTime: '09:00' },
      { id: 'd5_cafe', icon: Coffee, title: 'Pode voltar café moderado', time: '1-2 xícaras', startTime: '08:00' },
    ]
  },
  {
    day: 8,
    label: 'D8',
    tasks: [
      { id: 'd8_circular', icon: ShowerHead, title: 'Movimentos circulares', time: 'Durante lavagem', startTime: '09:00' },
      { id: 'd8_lado', icon: Bed, title: 'Pode dormir de lado', time: 'Liberado', startTime: '22:00' },
      { id: 'd8_camisa', icon: Shirt, title: 'Camisas com botão', time: 'Até D14', startTime: '08:00' },
    ]
  },
  {
    day: 10,
    label: 'D10',
    tasks: [
      { id: 'd10_oleo', icon: Sparkles, title: 'Iniciar óleo de girassol', time: 'Noite', startTime: '21:00' },
      { id: 'd10_academia', icon: Dumbbell, title: 'Academia leve liberada', time: 'Sem esforço', startTime: '10:00' },
      { id: 'd10_crostas', icon: Heart, title: 'Crostas soltando', time: 'Naturalmente', startTime: '08:00' },
    ]
  },
  {
    day: 15,
    label: 'D15',
    tasks: [
      { id: 'd15_chuveiro', icon: ShowerHead, title: 'Chuveiro normal liberado', time: 'Liberado', startTime: '08:00' },
      { id: 'd15_shampoo', icon: Droplets, title: 'Shampoo regular', time: 'Liberado', startTime: '08:00' },
      { id: 'd15_massagem', icon: Heart, title: 'Massagens liberadas', time: 'Liberado', startTime: '08:00' },
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

// Generate Google Calendar URL
function generateGoogleCalendarUrl(task: { title: string; time: string; startTime?: string }, date: Date) {
  const startDate = new Date(date);
  const [hours, minutes] = (task.startTime || '09:00').split(':').map(Number);
  startDate.setHours(hours, minutes, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);
  
  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, '');
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🏥 ${task.title}`,
    details: `Orientação pós-transplante: ${task.title}\nHorário: ${task.time}`,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function NeoCareOrientations() {
  // Simulate surgery date (D0) - in production this comes from patient data
  const [surgeryDate] = useState(() => {
    const stored = localStorage.getItem('neocare_surgery_date');
    return stored ? new Date(stored) : addDays(new Date(), -5); // Default: 5 days ago
  });
  
  // Calculate current day relative to surgery
  const today = startOfDay(new Date());
  const surgeryDay = startOfDay(surgeryDate);
  const currentDay = Math.floor((today.getTime() - surgeryDay.getTime()) / (1000 * 60 * 60 * 24));
  
  const [selectedDay, setSelectedDay] = useState(currentDay > 0 ? currentDay : (currentDay < 0 ? -3 : 0));
  
  const [preChecked, setPreChecked] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('neocare_pre_checklist');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [postChecked, setPostChecked] = useState<Record<string, { done: boolean; doneAt?: string }>>(() => {
    const saved = localStorage.getItem('neocare_post_checklist_v2');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('neocare_pre_checklist', JSON.stringify(preChecked));
  }, [preChecked]);

  useEffect(() => {
    localStorage.setItem('neocare_post_checklist_v2', JSON.stringify(postChecked));
  }, [postChecked]);

  const togglePre = (id: string) => {
    const newState = !preChecked[id];
    setPreChecked(prev => ({ ...prev, [id]: newState }));
    if (newState) toast.success('Item concluído! 🎉');
  };

  const togglePost = (id: string, taskDay: number) => {
    const isChecked = postChecked[id]?.done;
    const newState = !isChecked;
    
    setPostChecked(prev => ({
      ...prev,
      [id]: {
        done: newState,
        doneAt: newState ? new Date().toISOString() : undefined
      }
    }));
    
    if (newState) toast.success('Ótimo trabalho! 💪');
  };

  // Check if task is overdue (not completed and past its day)
  const isTaskOverdue = (taskId: string, taskDay: number) => {
    const taskData = postChecked[taskId];
    if (taskData?.done) return false;
    return currentDay > taskDay;
  };

  // Check if task is for today and not done
  const isTaskDueToday = (taskId: string, taskDay: number) => {
    const taskData = postChecked[taskId];
    if (taskData?.done) return false;
    return currentDay === taskDay;
  };

  // Progress calculations
  const preProgress = Math.round(
    (Object.values(preChecked).filter(Boolean).length / preTransplantChecklist.length) * 100
  );
  
  const relevantPostTasks = postTransplantChecklist
    .filter(day => day.day <= Math.max(currentDay, 1))
    .flatMap(day => day.tasks);
  
  const postProgress = relevantPostTasks.length > 0 
    ? Math.round((Object.values(postChecked).filter(t => t?.done).length / relevantPostTasks.length) * 100)
    : 0;

  const isPrePhase = selectedDay < 0;
  const isD0 = selectedDay === 0;
  const totalProgress = isPrePhase ? preProgress : postProgress;

  const activeRestrictions = restrictions.filter(r => currentDay < r.until);
  
  // Get tasks for selected day
  const selectedDayData = postTransplantChecklist.find(d => d.day === selectedDay);
  
  // Count overdue tasks
  const overdueTasks = postTransplantChecklist
    .filter(day => day.day < currentDay)
    .flatMap(day => day.tasks)
    .filter(task => !postChecked[task.id]?.done);

  // Add all tasks to Google Calendar
  const addAllToCalendar = () => {
    postTransplantChecklist.forEach(day => {
      const taskDate = addDays(surgeryDate, day.day);
      day.tasks.forEach(task => {
        const url = generateGoogleCalendarUrl(task, taskDate);
        window.open(url, '_blank');
      });
    });
    toast.success('Abrindo Google Agenda para adicionar tarefas...');
  };

  // Phase calculation
  const getCurrentPhase = () => {
    if (currentDay < 0) return 'pre';
    if (currentDay === 0) return 'd0';
    if (currentDay <= 3) return 'inicial';
    if (currentDay <= 15) return 'recuperacao';
    return 'liberado';
  };
  
  const phase = getCurrentPhase();
  const phases = [
    { key: 'pre', label: 'Pré-operatório', icon: Calendar, days: 'D-15 a D-1' },
    { key: 'd0', label: 'Cirurgia', icon: Heart, days: 'D0' },
    { key: 'inicial', label: 'Cuidado Intensivo', icon: Droplets, days: 'D1 a D3' },
    { key: 'recuperacao', label: 'Recuperação', icon: Sparkles, days: 'D4 a D15' },
    { key: 'liberado', label: 'Liberado', icon: Check, days: 'D15+' },
  ];

  return (
    <div className="space-y-4 pb-6 max-w-2xl mx-auto">
      {/* Simple Header Card */}
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
        
        {/* Phase Progress */}
        <div className="flex items-center gap-1">
          {phases.map((p, idx) => {
            const PhaseIcon = p.icon;
            const isActive = phase === p.key;
            const isPast = phases.findIndex(x => x.key === phase) > idx;
            
            return (
              <div key={p.key} className="flex-1 flex flex-col items-center">
                <div className={cn(
                  "w-full h-2 rounded-full transition-colors",
                  isActive ? "bg-emerald-500" : isPast ? "bg-emerald-300 dark:bg-emerald-700" : "bg-muted"
                )} />
                <div className={cn(
                  "flex flex-col items-center mt-2",
                  isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}>
                  <PhaseIcon className={cn("h-4 w-4", isActive && "text-emerald-500")} />
                  <span className="text-[10px] font-medium text-center leading-tight mt-0.5 hidden sm:block">{p.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-amber-700 dark:text-amber-300">{overdueTasks.length} tarefa(s) pendente(s) de dias anteriores</span>
          </div>
        )}
      </div>

      {/* Day Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Selecione o Dia</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={addAllToCalendar}
            className="h-7 text-xs gap-1"
          >
            <CalendarPlus className="h-3 w-3" />
            Google Agenda
          </Button>
        </div>
        
        <div className="flex items-center overflow-x-auto pb-1 gap-1.5">
          {/* Pre-transplant days */}
          {[
            { day: -15, label: 'D-15' },
            { day: -7, label: 'D-7' },
            { day: -5, label: 'D-5' },
            { day: -3, label: 'D-3' },
            { day: -1, label: 'D-1' },
          ].map((item) => {
            const isSelected = selectedDay === item.day;
            const isToday = currentDay === item.day;
            
            return (
              <button
                key={item.day}
                onClick={() => setSelectedDay(item.day)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  isToday 
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : isSelected 
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border hover:bg-muted text-muted-foreground"
                )}
              >
                {item.label}
              </button>
            );
          })}

          {/* D0 - Always visible as special */}
          <button
            onClick={() => setSelectedDay(0)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border-2",
              currentDay === 0
                ? "bg-emerald-500 text-white border-emerald-600"
                : selectedDay === 0
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-500"
                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
            )}
          >
            D0 (Cirurgia)
          </button>

          {/* Post-transplant days */}
          {postTransplantChecklist.map((day) => {
            const completedCount = day.tasks.filter(t => postChecked[t.id]?.done).length;
            const isComplete = completedCount === day.tasks.length;
            const isToday = day.day === currentDay;
            const isSelected = day.day === selectedDay;

            return (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border relative",
                  isToday 
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : isSelected 
                      ? "bg-foreground text-background border-foreground"
                      : isComplete
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                        : "bg-card border-border hover:bg-muted text-muted-foreground"
                )}
              >
                D{day.day}
                {isComplete && !isToday && !isSelected && (
                  <Check className="inline-block h-3 w-3 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <Separator />

      {/* PRE-TRANSPLANT */}
      {selectedDay < 0 && (
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
              const taskDate = addDays(surgeryDate, -item.daysBeforeD0);
              const isOverdue = !isChecked && isBefore(taskDate, today) && currentDay < 0;
              
              return (
                <div
                  key={item.id}
                  onClick={() => togglePre(item.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                    isChecked 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
                      : isOverdue
                        ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                        : "bg-background border-border hover:bg-muted/50"
                  )}
                >
                  {isChecked ? (
                    <CheckSquare className="h-5 w-5 text-emerald-500 shrink-0" />
                  ) : isOverdue ? (
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground shrink-0" />
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
                      {item.title}
                    </p>
                    {isOverdue && !isChecked && (
                      <p className="text-xs text-red-500 font-medium">Pendente!</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* D0 - TRANSPLANT DAY */}
      {isD0 && (
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
      {selectedDay > 0 && selectedDayData && (
        <div className="space-y-4">
          {/* Selected Day Tasks */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <h2 className="font-semibold text-sm">
                Tarefas do {selectedDayData.label}
                {selectedDay === currentDay && (
                  <Badge className="ml-2 bg-emerald-500 text-white">Hoje</Badge>
                )}
                {selectedDay < currentDay && (
                  <Badge className="ml-2" variant="outline">Passado</Badge>
                )}
              </h2>
            </div>

            <div className="space-y-1">
              {selectedDayData.tasks.map((task) => {
                const Icon = task.icon;
                const taskState = postChecked[task.id];
                const isChecked = taskState?.done;
                const isOverdue = isTaskOverdue(task.id, selectedDayData.day);
                const taskDate = addDays(surgeryDate, selectedDayData.day);
                
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all border",
                      isChecked 
                        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" 
                        : isOverdue
                          ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800"
                          : "bg-background border-border"
                    )}
                  >
                    <div
                      onClick={() => togglePost(task.id, selectedDayData.day)}
                      className="cursor-pointer"
                    >
                      {isChecked ? (
                        <CheckSquare className="h-5 w-5 text-blue-500 shrink-0" />
                      ) : isOverdue ? (
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <Icon className={cn(
                      "h-4 w-4 shrink-0",
                      isChecked ? "text-blue-500" : isOverdue ? "text-red-500" : "text-muted-foreground"
                    )} />
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => togglePost(task.id, selectedDayData.day)}
                    >
                      <p className={cn(
                        "text-sm font-medium",
                        isChecked && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      {isOverdue && !isChecked && (
                        <p className="text-xs text-red-500 font-medium">Não cumprida!</p>
                      )}
                      {taskState?.doneAt && (
                        <p className="text-xs text-muted-foreground">
                          ✓ Feito em {format(new Date(taskState.doneAt), "dd/MM 'às' HH:mm")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {task.time}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const url = generateGoogleCalendarUrl(task, taskDate);
                          window.open(url, '_blank');
                        }}
                      >
                        <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDay === currentDay && (
            <>
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
          <p className="text-xs text-muted-foreground">Receba lembretes por WhatsApp e e-mail</p>
        </div>
        <Button size="sm" variant="outline">
          Configurar
        </Button>
      </div>

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
  );
}
