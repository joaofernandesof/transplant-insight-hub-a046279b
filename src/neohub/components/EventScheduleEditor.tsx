import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  Calendar,
  Save,
  User,
  GripVertical,
} from "lucide-react";
import { useScheduleManagement, ScheduleDay, ScheduleItem } from "@/neohub/hooks/useScheduleManagement";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventScheduleEditorProps {
  classId: string | null;
}

export function EventScheduleEditor({ classId }: EventScheduleEditorProps) {
  const { schedule, isLoading, updateScheduleItem, createScheduleItem, deleteScheduleItem, updateScheduleDay, deleteScheduleDay } = useScheduleManagement(classId);
  
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [editingDay, setEditingDay] = useState<ScheduleDay | null>(null);
  const [isAddingItem, setIsAddingItem] = useState<string | null>(null);
  
  // Form state
  const [itemForm, setItemForm] = useState({
    activity: "",
    start_time: "",
    end_time: "",
    location: "",
    instructor: "",
    notes: "",
  });

  const [dayForm, setDayForm] = useState({
    day_title: "",
    day_theme: "",
    day_date: "",
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const handleEditItem = (item: ScheduleItem) => {
    setEditingItem(item);
    setItemForm({
      activity: item.activity,
      start_time: item.start_time.substring(0, 5),
      end_time: item.end_time.substring(0, 5),
      location: item.location || "",
      instructor: item.instructor || "",
      notes: item.notes || "",
    });
  };

  const handleSaveItem = () => {
    if (editingItem) {
      updateScheduleItem.mutate({
        id: editingItem.id,
        activity: itemForm.activity,
        start_time: itemForm.start_time + ":00",
        end_time: itemForm.end_time + ":00",
        location: itemForm.location || null,
        instructor: itemForm.instructor || null,
        notes: itemForm.notes || null,
      });
      setEditingItem(null);
    }
  };

  const handleAddItem = (scheduleId: string) => {
    if (!itemForm.activity || !itemForm.start_time || !itemForm.end_time) return;
    
    createScheduleItem.mutate({
      schedule_id: scheduleId,
      activity: itemForm.activity,
      start_time: itemForm.start_time + ":00",
      end_time: itemForm.end_time + ":00",
      location: itemForm.location || null,
      instructor: itemForm.instructor || null,
      notes: itemForm.notes || null,
      order_index: null,
    });
    
    setIsAddingItem(null);
    setItemForm({ activity: "", start_time: "", end_time: "", location: "", instructor: "", notes: "" });
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

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Tem certeza que deseja remover esta atividade?")) {
      deleteScheduleItem.mutate(itemId);
    }
  };

  const handleDeleteDay = (dayId: string) => {
    if (confirm("Tem certeza que deseja remover este dia e todas suas atividades?")) {
      deleteScheduleDay.mutate(dayId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cronograma do Evento</h3>
          <p className="text-sm text-muted-foreground">
            Edite o cronograma - as alterações serão refletidas na visualização dos alunos
          </p>
        </div>
      </div>

      {/* Schedule Days */}
      {schedule && schedule.length > 0 ? (
        <Accordion type="multiple" defaultValue={schedule.map(d => d.id)} className="space-y-4">
          {schedule.map((day) => (
            <AccordionItem key={day.id} value={day.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-bold">Dia {day.day_number}</Badge>
                    <div className="text-left">
                      <p className="font-semibold">{day.day_title}</p>
                      {day.day_date && (
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(day.day_date), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="secondary">{day.items.length} atividades</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditDay(day)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar Dia
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteDay(day.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover Dia
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {day.day_theme && (
                  <p className="text-sm text-muted-foreground italic mb-4 pl-2 border-l-2 border-primary/30">
                    Tema: {day.day_theme}
                  </p>
                )}
                
                <div className="space-y-2">
                  {day.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                          </Badge>
                          {item.location && (
                            <Badge variant="secondary" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {item.location}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium mt-1">{item.activity}</p>
                        {item.instructor && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {item.instructor}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Item Button */}
                {isAddingItem === day.id ? (
                  <Card className="mt-4">
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Início</Label>
                          <Input
                            type="time"
                            value={itemForm.start_time}
                            onChange={(e) => setItemForm(prev => ({ ...prev, start_time: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fim</Label>
                          <Input
                            type="time"
                            value={itemForm.end_time}
                            onChange={(e) => setItemForm(prev => ({ ...prev, end_time: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Atividade *</Label>
                        <Input
                          value={itemForm.activity}
                          onChange={(e) => setItemForm(prev => ({ ...prev, activity: e.target.value }))}
                          placeholder="Ex: Aula Teórica - Fundamentos"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Local</Label>
                          <Input
                            value={itemForm.location}
                            onChange={(e) => setItemForm(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Ex: 5º Andar"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Instrutor</Label>
                          <Input
                            value={itemForm.instructor}
                            onChange={(e) => setItemForm(prev => ({ ...prev, instructor: e.target.value }))}
                            placeholder="Nome do instrutor"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingItem(null);
                            setItemForm({ activity: "", start_time: "", end_time: "", location: "", instructor: "", notes: "" });
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={() => handleAddItem(day.id)}>
                          <Save className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-dashed"
                    onClick={() => setIsAddingItem(day.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Atividade
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum cronograma cadastrado</p>
            <p className="text-sm text-muted-foreground">O cronograma deve ser configurado no banco de dados</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Atividade</DialogTitle>
            <DialogDescription>
              Altere os dados da atividade. As mudanças serão refletidas imediatamente para os alunos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={itemForm.start_time}
                  onChange={(e) => setItemForm(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input
                  type="time"
                  value={itemForm.end_time}
                  onChange={(e) => setItemForm(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Atividade *</Label>
              <Input
                value={itemForm.activity}
                onChange={(e) => setItemForm(prev => ({ ...prev, activity: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={itemForm.location}
                  onChange={(e) => setItemForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Instrutor</Label>
                <Input
                  value={itemForm.instructor}
                  onChange={(e) => setItemForm(prev => ({ ...prev, instructor: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Day Dialog */}
      <Dialog open={!!editingDay} onOpenChange={() => setEditingDay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Dia</DialogTitle>
            <DialogDescription>
              Altere as informações do dia
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Dia *</Label>
              <Input
                value={dayForm.day_title}
                onChange={(e) => setDayForm(prev => ({ ...prev, day_title: e.target.value }))}
                placeholder="Ex: Dia 1 - Fundamentos"
              />
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <Input
                value={dayForm.day_theme}
                onChange={(e) => setDayForm(prev => ({ ...prev, day_theme: e.target.value }))}
                placeholder="Ex: Introdução e Diagnóstico"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={dayForm.day_date}
                onChange={(e) => setDayForm(prev => ({ ...prev, day_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDay(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDay}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
