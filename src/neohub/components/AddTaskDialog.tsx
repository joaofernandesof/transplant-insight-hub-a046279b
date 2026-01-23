import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddTaskDialogProps {
  checklistId: string;
  onAddTask: (task: {
    checklist_id: string;
    task_description: string;
    responsible: string;
    days_offset?: number;
    priority?: string;
    observation?: string | null;
    category?: string | null;
  }) => void;
  trigger?: React.ReactNode;
}

const commonResponsibles = [
  "WELLINGTON",
  "BRENNA", 
  "JOCELMA",
  "ALEXANDRE",
  "LUANDA",
  "JESSIKA",
  "BETTY",
  "JULIA",
  "CAMILA",
  "VALÉRIA",
  "LUCAS ARAÚJO",
  "JOÃO",
  "CIBELE",
  "MÁRCIA",
  "BRUNNA",
];

const categories = [
  { value: "logistica", label: "Logística" },
  { value: "marketing", label: "Marketing" },
  { value: "financeiro", label: "Financeiro" },
  { value: "academico", label: "Acadêmico" },
  { value: "producao", label: "Produção" },
  { value: "staff", label: "Staff" },
  { value: "outros", label: "Outros" },
];

export function AddTaskDialog({ checklistId, onAddTask, trigger }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const [responsible, setResponsible] = useState("");
  const [customResponsible, setCustomResponsible] = useState("");
  const [daysOffset, setDaysOffset] = useState("0");
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("");
  const [observation, setObservation] = useState("");

  const handleSubmit = () => {
    if (!taskDescription || (!responsible && !customResponsible)) return;

    onAddTask({
      checklist_id: checklistId,
      task_description: taskDescription.toUpperCase(),
      responsible: responsible === "outro" ? customResponsible.toUpperCase() : responsible,
      days_offset: parseInt(daysOffset) || 0,
      priority,
      observation: observation || null,
      category: category || null,
    });

    // Reset form
    setTaskDescription("");
    setResponsible("");
    setCustomResponsible("");
    setDaysOffset("0");
    setPriority("normal");
    setCategory("");
    setObservation("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1">
            <Plus className="h-4 w-4" />
            Adicionar Tarefa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Tarefa</DialogTitle>
          <DialogDescription>
            Adicione uma nova tarefa ao checklist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="task-description">Descrição da Tarefa *</Label>
            <Textarea
              id="task-description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="O que precisa ser feito..."
              rows={2}
            />
          </div>

          {/* Responsible */}
          <div className="space-y-2">
            <Label>Responsável *</Label>
            <Select value={responsible} onValueChange={setResponsible}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {commonResponsibles.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
                <SelectItem value="outro">Outro...</SelectItem>
              </SelectContent>
            </Select>
            {responsible === "outro" && (
              <Input
                value={customResponsible}
                onChange={(e) => setCustomResponsible(e.target.value)}
                placeholder="Nome do responsável"
                className="mt-2"
              />
            )}
          </div>

          {/* Days Offset and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="days-offset">Dias relativo ao evento</Label>
              <Select value={daysOffset} onValueChange={setDaysOffset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-60">D-60 (60 dias antes)</SelectItem>
                  <SelectItem value="-45">D-45 (45 dias antes)</SelectItem>
                  <SelectItem value="-30">D-30 (30 dias antes)</SelectItem>
                  <SelectItem value="-15">D-15 (15 dias antes)</SelectItem>
                  <SelectItem value="-7">D-7 (7 dias antes)</SelectItem>
                  <SelectItem value="-2">D-2 (2 dias antes)</SelectItem>
                  <SelectItem value="-1">D-1 (1 dia antes)</SelectItem>
                  <SelectItem value="0">D0 (Dia do evento)</SelectItem>
                  <SelectItem value="1">D+1 (1 dia depois)</SelectItem>
                  <SelectItem value="2">D+2 (2 dias depois)</SelectItem>
                  <SelectItem value="7">D+7 (7 dias depois)</SelectItem>
                  <SelectItem value="15">D+15 (15 dias depois)</SelectItem>
                  <SelectItem value="30">D+30 (30 dias depois)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observation */}
          <div className="space-y-2">
            <Label htmlFor="observation">Observação</Label>
            <Input
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!taskDescription || (!responsible && !customResponsible) || (responsible === "outro" && !customResponsible)}
          >
            Adicionar Tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
