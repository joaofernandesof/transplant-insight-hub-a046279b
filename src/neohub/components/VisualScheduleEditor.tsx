import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Coffee,
  Utensils,
  Stethoscope,
  BookOpen,
  Clock,
  MapPin,
  User,
  Presentation,
  MessageSquare,
  PartyPopper,
  Briefcase,
  List,
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Save,
  GripVertical,
  X,
  Move,
  Maximize2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useScheduleManagement, ScheduleDay, ScheduleItem } from "@/neohub/hooks/useScheduleManagement";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VisualScheduleEditorProps {
  classId: string | null;
}

// Activity type to color/icon mapping (same as student view)
function getActivityStyle(activity: string): { 
  icon: React.ReactNode; 
  bgColor: string; 
  borderColor: string;
  textColor: string;
} {
  const lower = activity.toLowerCase();
  
  if (lower.includes('coffee') || lower.includes('break') || lower.includes('welcome')) {
    return {
      icon: <Coffee className="h-4 w-4" />,
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      borderColor: 'border-amber-300 dark:border-amber-700',
      textColor: 'text-amber-700 dark:text-amber-300'
    };
  }
  if (lower.includes('almoço') || lower.includes('almoco')) {
    return {
      icon: <Utensils className="h-4 w-4" />,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      borderColor: 'border-orange-300 dark:border-orange-700',
      textColor: 'text-orange-700 dark:text-orange-300'
    };
  }
  if (lower.includes('prática') || lower.includes('cirúrgico') || lower.includes('cirurgico') || lower.includes('hands-on')) {
    return {
      icon: <Stethoscope className="h-4 w-4" />,
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
      textColor: 'text-emerald-700 dark:text-emerald-300'
    };
  }
  if (lower.includes('aula') || lower.includes('teórica') || lower.includes('teorica') || lower.includes('fundamento')) {
    return {
      icon: <BookOpen className="h-4 w-4" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      borderColor: 'border-blue-300 dark:border-blue-700',
      textColor: 'text-blue-700 dark:text-blue-300'
    };
  }
  if (lower.includes('workshop') || lower.includes('apresentação') || lower.includes('apresentacao')) {
    return {
      icon: <Presentation className="h-4 w-4" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      borderColor: 'border-purple-300 dark:border-purple-700',
      textColor: 'text-purple-700 dark:text-purple-300'
    };
  }
  if (lower.includes('neoconnect') || lower.includes('confraternização') || lower.includes('networking')) {
    return {
      icon: <PartyPopper className="h-4 w-4" />,
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      borderColor: 'border-pink-300 dark:border-pink-700',
      textColor: 'text-pink-700 dark:text-pink-300'
    };
  }
  if (lower.includes('mentoria') || lower.includes('discussão') || lower.includes('discussao')) {
    return {
      icon: <MessageSquare className="h-4 w-4" />,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      borderColor: 'border-indigo-300 dark:border-indigo-700',
      textColor: 'text-indigo-700 dark:text-indigo-300'
    };
  }
  if (lower.includes('abertura') || lower.includes('orientações') || lower.includes('orientacoes')) {
    return {
      icon: <Briefcase className="h-4 w-4" />,
      bgColor: 'bg-slate-100 dark:bg-slate-800/50',
      borderColor: 'border-slate-300 dark:border-slate-600',
      textColor: 'text-slate-700 dark:text-slate-300'
    };
  }
  
  return {
    icon: <Clock className="h-4 w-4" />,
    bgColor: 'bg-gray-100 dark:bg-gray-800/50',
    borderColor: 'border-gray-300 dark:border-gray-600',
    textColor: 'text-gray-700 dark:text-gray-300'
  };
}

function parseTimeToHours(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60;
}

function formatTime(time: string): string {
  return time.substring(0, 5);
}

function getHourRange(items: ScheduleItem[]): { start: number; end: number } {
  if (items.length === 0) return { start: 8, end: 18 };
  
  let minHour = 24;
  let maxHour = 0;
  
  items.forEach(item => {
    const startHour = parseTimeToHours(item.start_time);
    const endHour = parseTimeToHours(item.end_time);
    minHour = Math.min(minHour, Math.floor(startHour));
    maxHour = Math.max(maxHour, Math.ceil(endHour));
  });
  
  return { start: Math.max(6, minHour), end: Math.min(23, maxHour) };
}

function isAllDayActivity(activity: string): boolean {
  const lower = activity.toLowerCase();
  return lower.includes('mentoria') || lower.includes('estúdio') || lower.includes('estudio');
}

function groupParallelActivities(items: ScheduleItem[]): { item: ScheduleItem; column: number; totalColumns: number }[] {
  if (items.length === 0) return [];
  
  const sorted = [...items].sort((a, b) => parseTimeToHours(a.start_time) - parseTimeToHours(b.start_time));
  
  const result: { item: ScheduleItem; column: number; totalColumns: number }[] = [];
  let currentGroup: ScheduleItem[] = [];
  let groupEndTime = 0;
  
  for (const item of sorted) {
    const itemStart = parseTimeToHours(item.start_time);
    const itemEnd = parseTimeToHours(item.end_time);
    
    if (currentGroup.length === 0 || itemStart < groupEndTime) {
      currentGroup.push(item);
      groupEndTime = Math.max(groupEndTime, itemEnd);
    } else {
      currentGroup.forEach((groupItem, idx) => {
        result.push({ item: groupItem, column: idx, totalColumns: currentGroup.length });
      });
      currentGroup = [item];
      groupEndTime = itemEnd;
    }
  }
  
  currentGroup.forEach((groupItem, idx) => {
    result.push({ item: groupItem, column: idx, totalColumns: currentGroup.length });
  });
  
  return result;
}

function getGroupBadgeColors(groupName: string): { bg: string; border: string; text: string } {
  const lower = groupName.toLowerCase();
  
  if (lower.includes('verde')) {
    return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' };
  }
  if (lower.includes('preto')) {
    return { bg: 'bg-gray-700 dark:bg-gray-800', border: 'border-gray-600', text: 'text-white' };
  }
  if (lower.includes('azul')) {
    return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' };
  }
  if (lower.includes('branco')) {
    return { bg: 'bg-white', border: 'border-gray-300', text: 'text-gray-600' };
  }
  
  return { bg: 'bg-muted', border: 'border-border', text: 'text-foreground' };
}

function parseGroupBadges(notes: string): React.ReactNode[] {
  const groupColors = ['verde', 'preto', 'azul', 'branco'];
  const foundGroups: string[] = [];
  
  const lower = notes.toLowerCase();
  
  for (const color of groupColors) {
    if (lower.includes(color)) {
      foundGroups.push(color);
    }
  }
  
  if (foundGroups.length === 0) {
    return [];
  }
  
  return foundGroups.map((color, index) => {
    const groupName = `Grupo ${color.charAt(0).toUpperCase() + color.slice(1)}`;
    const colors = getGroupBadgeColors(groupName);
    return (
      <span
        key={index}
        className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${colors.bg} ${colors.border} ${colors.text}`}
        title={groupName}
      >
        {groupName}
      </span>
    );
  });
}

// Editable Activity Block Component
function EditableActivityBlock({
  item,
  top,
  height,
  leftPercent,
  widthPercent,
  style,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onResize,
  hourHeight,
}: {
  item: ScheduleItem;
  top: number;
  height: number;
  leftPercent: number;
  widthPercent: number;
  style: ReturnType<typeof getActivityStyle>;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ScheduleItem>) => void;
  onDelete: () => void;
  onResize: (deltaMinutes: number, handle: 'top' | 'bottom') => void;
  hourHeight: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    activity: item.activity,
    location: item.location || '',
    instructor: item.instructor || '',
    notes: item.notes || '',
  });
  
  const groupBadges = item.notes ? parseGroupBadges(item.notes) : null;
  
  const handleSave = () => {
    onUpdate({
      activity: editForm.activity,
      location: editForm.location || null,
      instructor: editForm.instructor || null,
      notes: editForm.notes || null,
    });
    setIsEditing(false);
  };

  return (
    <>
      <div
        className={cn(
          "absolute rounded-lg border-2 overflow-visible cursor-pointer transition-all group",
          style.bgColor,
          style.borderColor,
          isSelected ? "ring-2 ring-primary ring-offset-2 z-20" : "hover:ring-1 hover:ring-primary/50"
        )}
        style={{
          top,
          height: Math.max(height, 50),
          left: `${leftPercent}%`,
          width: `calc(${widthPercent}% - 4px)`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onDoubleClick={() => setIsEditing(true)}
      >
        {/* Resize handles - only show when selected */}
        {isSelected && (
          <>
            <div 
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-primary/80 rounded cursor-ns-resize hover:bg-primary flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                const startY = e.clientY;
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaY = moveEvent.clientY - startY;
                  const deltaMinutes = Math.round((deltaY / hourHeight) * 60);
                  if (deltaMinutes !== 0) {
                    onResize(deltaMinutes, 'top');
                  }
                };
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <GripVertical className="h-2 w-2 text-white rotate-90" />
            </div>
            <div 
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-primary/80 rounded cursor-ns-resize hover:bg-primary flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                const startY = e.clientY;
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaY = moveEvent.clientY - startY;
                  const deltaMinutes = Math.round((deltaY / hourHeight) * 60);
                  if (deltaMinutes !== 0) {
                    onResize(deltaMinutes, 'bottom');
                  }
                };
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <GripVertical className="h-2 w-2 text-white rotate-90" />
            </div>
          </>
        )}
        
        {/* Action buttons - show on hover */}
        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <Button
            variant="secondary"
            size="icon"
            className="h-6 w-6 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        <div className="h-full flex flex-col min-h-0 p-1.5 sm:p-2">
          {/* Header with icon */}
          <div className="flex items-start gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 flex-shrink-0">
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${style.bgColor} ${style.borderColor} border flex items-center justify-center ${style.textColor} flex-shrink-0`}>
              {style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2">{item.activity}</p>
            </div>
          </div>
          
          {/* Details */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {(item.location || groupBadges) && height >= 55 && (
              <div className="flex flex-wrap items-center gap-1">
                {item.location && (
                  <span className={`inline-flex text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full border ${style.bgColor} ${style.borderColor} ${style.textColor} font-medium`}>
                    {item.location}
                  </span>
                )}
                {groupBadges}
              </div>
            )}
            
            {item.instructor && height >= 85 && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                <User className="h-3 w-3 flex-shrink-0" />
                <span>{item.instructor}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Atividade</DialogTitle>
            <DialogDescription>
              Edite os detalhes da atividade. Clique duas vezes em qualquer bloco para editar rapidamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Atividade</label>
              <Input
                value={editForm.activity}
                onChange={(e) => setEditForm(prev => ({ ...prev, activity: e.target.value }))}
                placeholder="Nome da atividade"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Local</label>
                <Input
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: 5º Andar"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Instrutor</label>
                <Input
                  value={editForm.instructor}
                  onChange={(e) => setEditForm(prev => ({ ...prev, instructor: e.target.value }))}
                  placeholder="Nome do instrutor"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas / Grupos</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Grupo Verde, Grupo Preto"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Use palavras como "Verde", "Preto", "Azul", "Branco" para badges de grupos
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Main Component
export function VisualScheduleEditor({ classId }: VisualScheduleEditorProps) {
  const { 
    schedule, 
    isLoading, 
    updateScheduleItem, 
    createScheduleItem, 
    deleteScheduleItem,
    updateScheduleDay,
    deleteScheduleDay 
  } = useScheduleManagement(classId);
  
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [hourHeight, setHourHeight] = useState(80);
  const [editingDay, setEditingDay] = useState<ScheduleDay | null>(null);
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [dayForm, setDayForm] = useState({
    day_title: "",
    day_theme: "",
    day_date: "",
  });
  const [newItemForm, setNewItemForm] = useState({
    activity: "",
    start_time: "",
    end_time: "",
    location: "",
    instructor: "",
    notes: "",
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const handleUpdateItem = (itemId: string, updates: Partial<ScheduleItem>) => {
    updateScheduleItem.mutate({ id: itemId, ...updates });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Tem certeza que deseja remover esta atividade?")) {
      deleteScheduleItem.mutate(itemId);
      setSelectedItem(null);
    }
  };

  const handleResizeItem = (item: ScheduleItem, deltaMinutes: number, handle: 'top' | 'bottom') => {
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const minutesToTime = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
    };

    let newStartMins = timeToMinutes(item.start_time);
    let newEndMins = timeToMinutes(item.end_time);

    if (handle === 'top') {
      newStartMins = Math.max(0, newStartMins + deltaMinutes);
    } else {
      newEndMins = Math.min(24 * 60, newEndMins + deltaMinutes);
    }

    // Ensure minimum 15 minutes duration
    if (newEndMins - newStartMins >= 15) {
      updateScheduleItem.mutate({
        id: item.id,
        start_time: minutesToTime(newStartMins),
        end_time: minutesToTime(newEndMins),
      });
    }
  };

  const handleEditDay = (day: ScheduleDay) => {
    setEditingDay(day);
    setDayForm({
      day_title: day.day_title,
      day_theme: day.day_theme || "",
      day_date: day.day_date || "",
    });
  };

  const handleSaveDay = () => {
    if (editingDay) {
      updateScheduleDay.mutate({
        id: editingDay.id,
        day_title: dayForm.day_title,
        day_theme: dayForm.day_theme || null,
        day_date: dayForm.day_date || null,
      });
      setEditingDay(null);
    }
  };

  const handleDeleteDay = (dayId: string) => {
    if (confirm("Tem certeza que deseja remover este dia e todas suas atividades?")) {
      deleteScheduleDay.mutate(dayId);
    }
  };

  const handleAddItem = () => {
    if (!addingToDay || !newItemForm.activity || !newItemForm.start_time || !newItemForm.end_time) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    createScheduleItem.mutate({
      schedule_id: addingToDay,
      activity: newItemForm.activity,
      start_time: newItemForm.start_time + ":00",
      end_time: newItemForm.end_time + ":00",
      location: newItemForm.location || null,
      instructor: newItemForm.instructor || null,
      notes: newItemForm.notes || null,
      order_index: null,
    });

    setAddingToDay(null);
    setNewItemForm({ activity: "", start_time: "", end_time: "", location: "", instructor: "", notes: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">Editor Visual do Cronograma</h3>
          <p className="text-sm text-muted-foreground">
            Clique duas vezes para editar • Arraste as bordas para redimensionar • Visualização idêntica ao portal do aluno
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Zoom control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Zoom:</span>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 rounded-none"
                onClick={() => setHourHeight(Math.max(40, hourHeight - 20))}
              >
                -
              </Button>
              <span className="text-xs px-2 min-w-[40px] text-center">{Math.round((hourHeight / 80) * 100)}%</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 rounded-none"
                onClick={() => setHourHeight(Math.min(160, hourHeight + 20))}
              >
                +
              </Button>
            </div>
          </div>
          
          {/* View mode toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as 'timeline' | 'list')}
            className="bg-muted rounded-lg p-1"
          >
            <ToggleGroupItem value="timeline" aria-label="Ver como timeline" className="gap-1.5 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
              <CalendarClock className="h-4 w-4" />
              <span className="text-xs">Timeline</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Ver como lista" className="gap-1.5 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
              <List className="h-4 w-4" />
              <span className="text-xs">Lista</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Schedule Days */}
      {schedule && schedule.length > 0 ? (
        <div className="space-y-6">
          {schedule.map((day) => (
            <DayEditor 
              key={day.id}
              day={day}
              viewMode={viewMode}
              hourHeight={hourHeight}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onResizeItem={(item, delta, handle) => handleResizeItem(item, delta, handle)}
              onEditDay={() => handleEditDay(day)}
              onDeleteDay={() => handleDeleteDay(day.id)}
              onAddItem={() => setAddingToDay(day.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum cronograma cadastrado</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Day Dialog */}
      <Dialog open={!!editingDay} onOpenChange={() => setEditingDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dia</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título do Dia</label>
              <Input
                value={dayForm.day_title}
                onChange={(e) => setDayForm(prev => ({ ...prev, day_title: e.target.value }))}
                placeholder="Ex: Dia 1 - Fundamentos"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tema</label>
              <Input
                value={dayForm.day_theme}
                onChange={(e) => setDayForm(prev => ({ ...prev, day_theme: e.target.value }))}
                placeholder="Ex: Introdução e Diagnóstico"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={dayForm.day_date}
                onChange={(e) => setDayForm(prev => ({ ...prev, day_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDay(null)}>Cancelar</Button>
            <Button onClick={handleSaveDay}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={!!addingToDay} onOpenChange={() => setAddingToDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Atividade</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Início *</label>
                <Input
                  type="time"
                  value={newItemForm.start_time}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fim *</label>
                <Input
                  type="time"
                  value={newItemForm.end_time}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Atividade *</label>
              <Input
                value={newItemForm.activity}
                onChange={(e) => setNewItemForm(prev => ({ ...prev, activity: e.target.value }))}
                placeholder="Ex: Aula Teórica - Fundamentos"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Local</label>
                <Input
                  value={newItemForm.location}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: 5º Andar"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Instrutor</label>
                <Input
                  value={newItemForm.instructor}
                  onChange={(e) => setNewItemForm(prev => ({ ...prev, instructor: e.target.value }))}
                  placeholder="Nome do instrutor"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={newItemForm.notes}
                onChange={(e) => setNewItemForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Grupo Verde, Grupo Preto"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingToDay(null)}>Cancelar</Button>
            <Button onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Day Editor Component
function DayEditor({
  day,
  viewMode,
  hourHeight,
  selectedItem,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onResizeItem,
  onEditDay,
  onDeleteDay,
  onAddItem,
}: {
  day: ScheduleDay;
  viewMode: 'timeline' | 'list';
  hourHeight: number;
  selectedItem: string | null;
  onSelectItem: (id: string | null) => void;
  onUpdateItem: (id: string, updates: Partial<ScheduleItem>) => void;
  onDeleteItem: (id: string) => void;
  onResizeItem: (item: ScheduleItem, deltaMinutes: number, handle: 'top' | 'bottom') => void;
  onEditDay: () => void;
  onDeleteDay: () => void;
  onAddItem: () => void;
}) {
  const { allDayItems, regularItems } = useMemo(() => {
    const allDay: ScheduleItem[] = [];
    const regular: ScheduleItem[] = [];
    
    day.items.forEach(item => {
      if (isAllDayActivity(item.activity)) {
        allDay.push(item);
      } else {
        regular.push(item);
      }
    });
    
    return { allDayItems: allDay, regularItems: regular };
  }, [day.items]);

  const hourRange = useMemo(() => getHourRange(regularItems), [regularItems]);
  const hours = useMemo(() => {
    const arr = [];
    for (let h = hourRange.start; h <= hourRange.end; h++) {
      arr.push(h);
    }
    return arr;
  }, [hourRange]);
  
  const groupedItems = useMemo(() => groupParallelActivities(regularItems), [regularItems]);
  const totalHeight = (hourRange.end - hourRange.start) * hourHeight;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{day.day_title}</CardTitle>
            {day.day_date && (
              <CardDescription>
                {format(parseISO(day.day_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-semibold">Dia {day.day_number}</Badge>
            <Badge variant="secondary">{day.items.length} atividades</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Atividade
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEditDay}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Dia
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={onDeleteDay}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Dia
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {day.day_theme && (
          <p className="text-sm text-muted-foreground mt-2 italic">{day.day_theme}</p>
        )}
      </CardHeader>
      <CardContent className="pb-6 space-y-4">
        {/* All-Day Activities */}
        {allDayItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Atividades do dia inteiro</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allDayItems.map((item) => {
                const style = getActivityStyle(item.activity);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all group relative",
                      style.bgColor, 
                      style.borderColor,
                      selectedItem === item.id ? "ring-2 ring-primary ring-offset-2" : "hover:ring-1 hover:ring-primary/50"
                    )}
                    onClick={() => onSelectItem(item.id === selectedItem ? null : item.id)}
                  >
                    {/* Action buttons */}
                    <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-5 w-5 rounded-full shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className={`w-7 h-7 rounded-md ${style.bgColor} ${style.borderColor} border flex items-center justify-center ${style.textColor} flex-shrink-0`}>
                      {style.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight">{item.activity}</p>
                      {item.location && (
                        <span className={`text-[10px] ${style.textColor} font-medium`}>
                          {item.location}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline Grid */}
        {viewMode === 'timeline' ? (
          <div 
            className="relative" 
            style={{ minHeight: totalHeight }}
            onClick={() => onSelectItem(null)}
          >
            <div className="relative" style={{ height: totalHeight }}>
              {/* Hour lines */}
              {hours.map((hour, index) => (
                <div 
                  key={hour}
                  className="absolute left-0 right-0 flex items-start"
                  style={{ top: index * hourHeight }}
                >
                  <div className="w-14 flex-shrink-0 text-xs text-muted-foreground font-medium pr-2 text-right -mt-2">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 border-t border-dashed border-muted-foreground/20" />
                </div>
              ))}

              {/* Activity blocks */}
              <div className="absolute left-14 right-0 top-0" style={{ height: totalHeight }}>
                {groupedItems.map(({ item, column, totalColumns }) => {
                  const startHour = parseTimeToHours(item.start_time);
                  const endHour = parseTimeToHours(item.end_time);
                  const top = (startHour - hourRange.start) * hourHeight;
                  const height = (endHour - startHour) * hourHeight;
                  
                  const style = getActivityStyle(item.activity);
                  
                  const widthPercent = 100 / totalColumns;
                  const leftPercent = column * widthPercent;

                  return (
                    <EditableActivityBlock
                      key={item.id}
                      item={item}
                      top={top}
                      height={height}
                      leftPercent={leftPercent}
                      widthPercent={widthPercent}
                      style={style}
                      isSelected={selectedItem === item.id}
                      onSelect={() => onSelectItem(item.id === selectedItem ? null : item.id)}
                      onUpdate={(updates) => onUpdateItem(item.id, updates)}
                      onDelete={() => onDeleteItem(item.id)}
                      onResize={(delta, handle) => onResizeItem(item, delta, handle)}
                      hourHeight={hourHeight}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {[...regularItems]
              .sort((a, b) => parseTimeToHours(a.start_time) - parseTimeToHours(b.start_time))
              .map((item) => {
                const style = getActivityStyle(item.activity);
                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer group relative",
                      style.bgColor, 
                      style.borderColor,
                      selectedItem === item.id ? "ring-2 ring-primary ring-offset-2" : "hover:ring-1 hover:ring-primary/50"
                    )}
                    onClick={() => onSelectItem(item.id === selectedItem ? null : item.id)}
                  >
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6 rounded-full shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg border ${style.bgColor} ${style.borderColor} flex items-center justify-center ${style.textColor}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-sm font-semibold ${style.textColor}`}>
                          {formatTime(item.start_time)} - {formatTime(item.end_time)}
                        </span>
                        {item.location && (
                          <Badge variant="secondary" className="text-xs">
                            {item.location}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">{item.activity}</p>
                      {item.instructor && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          {item.instructor}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Add Button */}
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={onAddItem}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Atividade
        </Button>

        {/* Legend */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Legenda:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Coffee Break', style: getActivityStyle('coffee') },
              { label: 'Refeição', style: getActivityStyle('almoço') },
              { label: 'Prática', style: getActivityStyle('prática') },
              { label: 'Aula Teórica', style: getActivityStyle('aula') },
              { label: 'Workshop', style: getActivityStyle('workshop') },
              { label: 'Social', style: getActivityStyle('neoconnect') },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded ${item.style.bgColor} ${item.style.borderColor} border flex items-center justify-center ${item.style.textColor}`}>
                  {item.style.icon}
                </div>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
