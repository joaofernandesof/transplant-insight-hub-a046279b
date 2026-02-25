/**
 * Task Form Dialog
 */

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, X, Loader2, Flag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import type { Task } from "../../IpromedTasks";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSuccess: () => void;
}

const defaultCategories = [
  "Petição",
  "Parecer",
  "Contrato",
  "Audiência",
  "Revisão",
  "Pesquisa",
  "Administrativo",
  "Reunião",
  "Outro",
];

const defaultStatuses = [
  { value: "todo", label: "A Fazer" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "in_review", label: "Em Revisão" },
  { value: "done", label: "Concluído" },
];

const defaultPriorities = [
  { value: 1, label: "Baixa", color: "text-slate-500" },
  { value: 2, label: "Média", color: "text-amber-500" },
  { value: 3, label: "Alta", color: "text-rose-500" },
];

const defaultAssignees = [
  "Dra. Caroline Parahyba",
  "Isabele Cartaxo",
  "Dra. Larissa Guerreiro",
];

// Inline add input component
function InlineAddInput({
  onAdd,
  onCancel,
  placeholder,
}: {
  onAdd: (value: string) => void;
  onCancel: () => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
    }
  };
  return (
    <div className="flex gap-2 mt-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button type="button" size="sm" onClick={handleAdd}>
        Adicionar
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: TaskFormDialogProps) {
  const { user } = useUnifiedAuth();
  const isEditing = !!task;

  // Custom options state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customStatuses, setCustomStatuses] = useState<{ value: string; label: string }[]>([]);
  const [customPriorities, setCustomPriorities] = useState<{ value: number; label: string; color: string }[]>([]);
  const [customAssignees, setCustomAssignees] = useState<string[]>([]);

  // Show inline input toggles
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [showAddPriority, setShowAddPriority] = useState(false);
  const [showAddAssignee, setShowAddAssignee] = useState(false);

  const allCategories = [...defaultCategories, ...customCategories];
  const allStatuses = [...defaultStatuses, ...customStatuses];
  const allPriorities = [...defaultPriorities, ...customPriorities];
  const allAssignees = [...defaultAssignees, ...customAssignees];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: 2,
    due_date: null as Date | null,
    category: "",
    assigned_to_name: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority || 2,
        due_date: task.due_date ? new Date(task.due_date) : null,
        category: task.category || "",
        assigned_to_name: task.assigned_to_name || "",
        tags: task.tags || [],
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: 2,
        due_date: null,
        category: "",
        assigned_to_name: "",
        tags: [],
      });
    }
  }, [task, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date?.toISOString() || null,
        category: formData.category || null,
        assigned_to: null,
        assigned_to_name: formData.assigned_to_name || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error } = await supabase
          .from("ipromed_legal_tasks")
          .update(payload)
          .eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ipromed_legal_tasks").insert({
          ...payload,
          created_by: user?.authUserId || user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Tarefa atualizada!" : "Tarefa criada!");
      onSuccess();
    },
    onError: () => {
      toast.error("Erro ao salvar tarefa");
    },
  });

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Elaborar petição inicial"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes da tarefa..."
              rows={3}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                  <div
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent text-primary"
                    onClick={() => setShowAddStatus(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Cadastrar novo
                  </div>
                </SelectContent>
              </Select>
              {showAddStatus && (
                <InlineAddInput
                  placeholder="Nome do status"
                  onCancel={() => setShowAddStatus(false)}
                  onAdd={(val) => {
                    const key = val.toLowerCase().replace(/\s+/g, "_");
                    setCustomStatuses((prev) => [...prev, { value: key, label: val }]);
                    setFormData((prev) => ({ ...prev, status: key }));
                    setShowAddStatus(false);
                    toast.success(`Status "${val}" adicionado`);
                  }}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={String(formData.priority)}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, priority: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allPriorities.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)}>
                      <div className="flex items-center gap-2">
                        <Flag className={cn("h-3.5 w-3.5", p.color)} /> {p.label}
                      </div>
                    </SelectItem>
                  ))}
                  <div
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent text-primary"
                    onClick={() => setShowAddPriority(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Cadastrar nova
                  </div>
                </SelectContent>
              </Select>
              {showAddPriority && (
                <InlineAddInput
                  placeholder="Nome da prioridade"
                  onCancel={() => setShowAddPriority(false)}
                  onAdd={(val) => {
                    const nextValue = Math.max(...allPriorities.map((p) => p.value)) + 1;
                    setCustomPriorities((prev) => [...prev, { value: nextValue, label: val, color: "text-purple-500" }]);
                    setFormData((prev) => ({ ...prev, priority: nextValue }));
                    setShowAddPriority(false);
                    toast.success(`Prioridade "${val}" adicionada`);
                  }}
                />
              )}
            </div>
          </div>

          {/* Due Date & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date
                      ? format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date || undefined}
                    onSelect={(date) => setFormData((prev) => ({ ...prev, due_date: date || null }))}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <div
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent text-primary"
                    onClick={() => setShowAddCategory(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Cadastrar nova
                  </div>
                </SelectContent>
              </Select>
              {showAddCategory && (
                <InlineAddInput
                  placeholder="Nome da categoria"
                  onCancel={() => setShowAddCategory(false)}
                  onAdd={(val) => {
                    setCustomCategories((prev) => [...prev, val]);
                    setFormData((prev) => ({ ...prev, category: val }));
                    setShowAddCategory(false);
                    toast.success(`Categoria "${val}" adicionada`);
                  }}
                />
              )}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select
              value={formData.assigned_to_name}
              onValueChange={(v) => {
                setFormData((prev) => ({ ...prev, assigned_to_name: v }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar responsável..." />
              </SelectTrigger>
              <SelectContent>
                {allAssignees.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
                <div
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent text-primary"
                  onClick={() => setShowAddAssignee(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Cadastrar novo
                </div>
              </SelectContent>
            </Select>
            {showAddAssignee && (
              <InlineAddInput
                placeholder="Nome do responsável"
                onCancel={() => setShowAddAssignee(false)}
                onAdd={(val) => {
                  setCustomAssignees((prev) => [...prev, val]);
                  setFormData((prev) => ({ ...prev, assigned_to_name: val }));
                  setShowAddAssignee(false);
                  toast.success(`Responsável "${val}" adicionado`);
                }}
              />
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Adicionar tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Salvar" : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
