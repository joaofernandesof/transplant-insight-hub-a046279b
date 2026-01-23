import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Link2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CourseClass {
  id: string;
  name: string;
  code: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
}

interface NewChecklistDialogProps {
  upcomingClasses?: CourseClass[];
  onCreateChecklist: (data: {
    event_name: string;
    event_start_date: string;
    event_end_date?: string | null;
    location?: string | null;
    class_id?: string | null;
    notes?: string | null;
  }) => void;
  trigger?: React.ReactNode;
}

export function NewChecklistDialog({ upcomingClasses, onCreateChecklist, trigger }: NewChecklistDialogProps) {
  const [open, setOpen] = useState(false);
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [linkMode, setLinkMode] = useState<"new" | "link">("new");

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    const selectedClass = upcomingClasses?.find(c => c.id === classId);
    if (selectedClass) {
      setEventName(selectedClass.name);
      if (selectedClass.start_date) {
        setStartDate(new Date(selectedClass.start_date));
      }
      if (selectedClass.end_date) {
        setEndDate(new Date(selectedClass.end_date));
      }
      if (selectedClass.location) {
        setLocation(selectedClass.location);
      }
    }
  };

  const handleSubmit = () => {
    if (!eventName || !startDate) return;

    onCreateChecklist({
      event_name: eventName,
      event_start_date: format(startDate, "yyyy-MM-dd"),
      event_end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      location: location || null,
      class_id: selectedClassId || null,
      notes: notes || null,
    });

    // Reset form
    setEventName("");
    setStartDate(undefined);
    setEndDate(undefined);
    setLocation("");
    setNotes("");
    setSelectedClassId("");
    setLinkMode("new");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Checklist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Checklist</DialogTitle>
          <DialogDescription>
            Crie um checklist para organizar as tarefas do evento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode selector */}
          {upcomingClasses && upcomingClasses.length > 0 && (
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setLinkMode("new")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  linkMode === "new" ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                <Plus className="h-4 w-4 inline mr-1" />
                Novo Evento
              </button>
              <button
                onClick={() => setLinkMode("link")}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  linkMode === "link" ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                <Link2 className="h-4 w-4 inline mr-1" />
                Vincular Turma
              </button>
            </div>
          )}

          {/* Link to existing class */}
          {linkMode === "link" && upcomingClasses && upcomingClasses.length > 0 && (
            <div className="space-y-2">
              <Label>Selecionar Turma</Label>
              <Select value={selectedClassId} onValueChange={handleSelectClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma turma..." />
                </SelectTrigger>
                <SelectContent>
                  {upcomingClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      <div className="flex flex-col">
                        <span>{cls.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {cls.start_date && format(new Date(cls.start_date), "dd/MM/yyyy")}
                          {cls.location && ` • ${cls.location}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event-name">Nome do Evento *</Label>
            <Input
              id="event-name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Ex: Formação 360 - Turma 09"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={ptBR}
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Fortaleza - CE"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre o evento..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!eventName || !startDate}>
            Criar Checklist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
