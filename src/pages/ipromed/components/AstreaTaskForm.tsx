/**
 * IPROMED - Astrea-style Task Form
 * Formulário de tarefa inspirado no Astrea
 */

import { useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Tag, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface AstreaTaskFormProps {
  onClose: () => void;
  initialData?: {
    description?: string;
    caseTitle?: string;
  };
}

export default function AstreaTaskForm({ onClose, initialData }: AstreaTaskFormProps) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState<Date>();
  const [taskList, setTaskList] = useState('');
  const [responsible, setResponsible] = useState('Mariana');
  const [priority, setPriority] = useState('low');

  const handleSave = () => {
    if (!description.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }
    toast.success('Tarefa adicionada com sucesso!');
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* Case Title (if from andamento) */}
      {initialData?.caseTitle && (
        <div className="text-sm text-muted-foreground mb-2">
          {initialData.caseTitle}
        </div>
      )}

      {/* Tag Button */}
      <div className="flex justify-end">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Tag className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm">
          Descrição da tarefa<span className="text-rose-500">*</span>
        </Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva a tarefa..."
          className="min-h-[100px] resize-none"
        />
      </div>

      {/* Date and Task List */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Digite a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">
            Lista de tarefas<span className="text-rose-500">*</span>
          </Label>
          <Select value={taskList} onValueChange={setTaskList}>
            <SelectTrigger>
              <SelectValue placeholder="Lista de tarefas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Lista de tarefas</SelectItem>
              <SelectItem value="urgent">Urgentes</SelectItem>
              <SelectItem value="cases">Processos</SelectItem>
            </SelectContent>
          </Select>
          <a href="#" className="text-xs text-[#0066CC] hover:underline">
            Criar nova lista
          </a>
        </div>
      </div>

      {/* Responsible and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">
            Responsável<span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Input
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Buscar responsável"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <a href="#" className="text-xs text-[#0066CC] hover:underline">
            Envolver mais pessoas
          </a>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">
            Prioridade<span className="text-rose-500">*</span>
          </Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onClose}>
          CANCELAR
        </Button>
        <Button onClick={handleSave} className="bg-[#0066CC]">
          SALVAR
        </Button>
      </div>
    </div>
  );
}
