/**
 * CPG Advocacia Médica Legal Hub - Atividades e Times (Kanban)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  Plus,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Calendar,
  User,
  FileText,
  Gavel,
  MessageSquare,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description?: string;
  taskType: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 1 | 2 | 3 | 4 | 5;
  dueDate?: Date;
  assignedTo: string;
  assignedToInitials: string;
  relatedTo?: { type: 'case' | 'contract' | 'request'; title: string };
  estimatedHours?: number;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Elaborar petição inicial',
    description: 'Preparar petição para o processo 0001234-56',
    taskType: 'Petição',
    status: 'todo',
    priority: 1,
    dueDate: new Date('2024-02-15'),
    assignedTo: 'Dr. Carlos',
    assignedToInitials: 'CM',
    relatedTo: { type: 'case', title: 'Ação de Indenização' },
    estimatedHours: 4,
  },
  {
    id: '2',
    title: 'Revisar contrato de prestação',
    taskType: 'Revisão',
    status: 'todo',
    priority: 2,
    dueDate: new Date('2024-02-10'),
    assignedTo: 'Dra. Ana',
    assignedToInitials: 'AP',
    relatedTo: { type: 'contract', title: 'CTR-2024-001' },
    estimatedHours: 2,
  },
  {
    id: '3',
    title: 'Responder consulta RH',
    taskType: 'Parecer',
    status: 'in_progress',
    priority: 2,
    assignedTo: 'Dra. Marina',
    assignedToInitials: 'MC',
    relatedTo: { type: 'request', title: 'REQ-20240124-0003' },
    estimatedHours: 1,
  },
  {
    id: '4',
    title: 'Acompanhar audiência TJ-SP',
    taskType: 'Audiência',
    status: 'in_progress',
    priority: 1,
    dueDate: new Date('2024-02-08'),
    assignedTo: 'Dr. Carlos',
    assignedToInitials: 'CM',
    relatedTo: { type: 'case', title: 'Rescisão Contratual' },
  },
  {
    id: '5',
    title: 'Validar cláusulas de confidencialidade',
    taskType: 'Revisão',
    status: 'review',
    priority: 3,
    assignedTo: 'Dr. Roberto',
    assignedToInitials: 'RA',
    relatedTo: { type: 'contract', title: 'Parceria Avivar' },
    estimatedHours: 1,
  },
  {
    id: '6',
    title: 'Enviar parecer final LGPD',
    taskType: 'Parecer',
    status: 'done',
    priority: 3,
    assignedTo: 'Dr. Roberto',
    assignedToInitials: 'RA',
    relatedTo: { type: 'request', title: 'REQ-20240124-0002' },
  },
];

const columns = [
  { id: 'todo', title: 'A Fazer', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in_progress', title: 'Em Andamento', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'review', title: 'Em Revisão', color: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'done', title: 'Concluído', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
];

const getPriorityColor = (priority: number) => {
  const colors: Record<number, string> = {
    1: 'border-l-rose-500',
    2: 'border-l-orange-500',
    3: 'border-l-amber-500',
    4: 'border-l-blue-500',
    5: 'border-l-gray-400',
  };
  return colors[priority];
};

const getRelatedIcon = (type?: 'case' | 'contract' | 'request') => {
  switch (type) {
    case 'case': return Gavel;
    case 'contract': return FileText;
    case 'request': return MessageSquare;
    default: return FileText;
  }
};

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const RelatedIcon = getRelatedIcon(task.relatedTo?.type);
  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== 'done';
  
  return (
    <Card className={`border-l-4 ${getPriorityColor(task.priority)} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm line-clamp-2">{task.title}</p>
            {task.relatedTo && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <RelatedIcon className="h-3 w-3" />
                <span className="truncate">{task.relatedTo.title}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {task.taskType}
            </Badge>
            {task.dueDate && (
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-rose-600' : 'text-muted-foreground'}`}>
                {isOverdue && <AlertTriangle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                {format(task.dueDate, 'dd/MM', { locale: ptBR })}
              </div>
            )}
          </div>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10">{task.assignedToInitials}</AvatarFallback>
          </Avatar>
        </div>
      </CardContent>
    </Card>
  );
};

export default function LegalTasksKanban() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const getTasksByStatus = (status: string) => mockTasks.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-purple-600" />
            Atividades e Times
          </h2>
          <p className="text-muted-foreground">Kanban de tarefas jurídicas</p>
        </div>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="Título da tarefa" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peticao">Petição</SelectItem>
                      <SelectItem value="parecer">Parecer</SelectItem>
                      <SelectItem value="revisao">Revisão</SelectItem>
                      <SelectItem value="audiencia">Audiência</SelectItem>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Crítica</SelectItem>
                      <SelectItem value="2">Alta</SelectItem>
                      <SelectItem value="3">Média</SelectItem>
                      <SelectItem value="4">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carlos">Dr. Carlos Mendes</SelectItem>
                      <SelectItem value="ana">Dra. Ana Paula</SelectItem>
                      <SelectItem value="marina">Dra. Marina Costa</SelectItem>
                      <SelectItem value="roberto">Dr. Roberto Alves</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Detalhes da tarefa..." />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewTaskOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsNewTaskOpen(false)}>Criar Tarefa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const tasks = getTasksByStatus(column.id);
          return (
            <div key={column.id} className="space-y-3">
              <div className={`p-3 rounded-lg ${column.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {tasks.length}
                  </Badge>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-3 pr-2">
                  {tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma tarefa
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}
