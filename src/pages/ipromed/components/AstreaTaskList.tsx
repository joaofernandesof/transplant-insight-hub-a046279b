/**
 * IPROMED - Astrea-style Task List
 * Lista de tarefas com checkbox, estrelas e dropdown inspirada no Astrea
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  ChevronDown,
  Star,
  Check,
  Tag,
  Filter,
  Printer,
} from "lucide-react";
import AstreaTaskForm from "./AstreaTaskForm";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueDateLabel: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  isImportant: boolean;
  caseNumber?: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Marcar reunião com cliente',
    dueDate: '2026-01-28',
    dueDateLabel: 'Amanhã',
    assignee: 'EU',
    priority: 'high',
    isCompleted: false,
    isImportant: true,
  },
  {
    id: '2',
    title: 'Escrever petição inicial',
    dueDate: '2026-01-27',
    dueDateLabel: 'Hoje',
    assignee: 'EU',
    priority: 'medium',
    isCompleted: false,
    isImportant: true,
  },
  {
    id: '3',
    title: 'Revisar contrato preventivo',
    dueDate: '2026-01-29',
    dueDateLabel: '29/01/2026',
    assignee: 'EU',
    priority: 'low',
    isCompleted: true,
    isImportant: false,
  },
];

const priorityColors = {
  low: 'text-gray-500',
  medium: 'text-amber-500',
  high: 'text-rose-500',
};

export default function AstreaTaskList() {
  const [tasks, setTasks] = useState(mockTasks);
  const [selectedList, setSelectedList] = useState('Lista de tarefas');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  const toggleImportant = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, isImportant: !task.isImportant } : task
      )
    );
  };

  const pendingTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  return (
    <>
      <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">Área de trabalho</CardTitle>
            <div className="flex items-center gap-2">
              <Button className="gap-2 bg-[#0066CC] hover:bg-[#0055AA]" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4" />
                ADICIONAR TAREFA
              </Button>
              <Button variant="outline" size="icon">
                <Tag className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {/* List Selector */}
          <div className="mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {selectedList}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedList('Lista de tarefas')}>
                  Lista de tarefas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedList('Urgentes')}>
                  Urgentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedList('Processos')}>
                  Processos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Task List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {pendingTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="h-5 w-5"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <a 
                      href="#" 
                      className="text-sm text-[#0066CC] hover:underline font-medium"
                    >
                      {task.title}
                    </a>
                    {task.caseNumber && (
                      <span className="text-xs text-muted-foreground ml-2">
                        • {task.caseNumber}
                      </span>
                    )}
                    <span className={`ml-2 text-sm ${
                      task.dueDateLabel === 'Hoje' ? 'text-rose-600' : 
                      task.dueDateLabel === 'Amanhã' ? 'text-amber-600' : 
                      'text-muted-foreground'
                    }`}>
                      - {task.dueDateLabel}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleImportant(task.id)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <Star 
                      className={`h-4 w-4 ${
                        task.isImportant 
                          ? 'text-amber-500 fill-amber-500' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </button>

                  <Badge variant="outline" className="text-xs">
                    {task.assignee}
                  </Badge>
                </div>
              ))}

              {completedTasks.length > 0 && (
                <>
                  <div className="pt-4 pb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Concluídas ({completedTasks.length})
                    </span>
                  </div>
                  {completedTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors opacity-60"
                    >
                      <Checkbox
                        checked={task.isCompleted}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="h-5 w-5"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <span className="text-sm line-through text-muted-foreground">
                          {task.title}
                        </span>
                      </div>

                      <Badge variant="outline" className="text-xs">
                        {task.assignee}
                      </Badge>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-muted-foreground uppercase">
              Adicionar Tarefa
            </DialogTitle>
          </DialogHeader>
          <AstreaTaskForm onClose={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
