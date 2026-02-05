 /**
  * AvivarTaskCard - Card de tarefa individual do Avivar
  */
 
 import { format, isPast, isToday } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { Check, Clock, AlertTriangle, MoreVertical, Trash2, RotateCcw, User } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Card } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { AvivarTask } from '@/hooks/useAvivarTasks';
 
 interface AvivarTaskCardProps {
   task: AvivarTask;
   onComplete: (taskId: string) => void;
   onDelete: (taskId: string) => void;
   onReopen?: (taskId: string) => void;
   compact?: boolean;
 }
 
 const priorityConfig = {
   low: { label: 'Baixa', className: 'bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]' },
   medium: { label: 'Média', className: 'bg-amber-500/20 text-amber-400' },
   high: { label: 'Alta', className: 'bg-red-500/20 text-red-400' },
 };
 
 export function AvivarTaskCard({ task, onComplete, onDelete, onReopen, compact = false }: AvivarTaskCardProps) {
   const isCompleted = !!task.completed_at;
   const isOverdue = task.due_at && isPast(new Date(task.due_at)) && !isCompleted;
   const isDueToday = task.due_at && isToday(new Date(task.due_at));
 
   if (compact) {
     return (
       <div 
         className={cn(
           "flex items-center gap-2 p-2 rounded-md border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted))]",
           isCompleted && "opacity-50"
         )}
       >
         {isCompleted && onReopen ? (
           <Button
             variant="ghost"
             size="icon"
             className="h-6 w-6 shrink-0"
             onClick={() => onReopen(task.id)}
             title="Reabrir tarefa"
           >
             <RotateCcw className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
           </Button>
         ) : (
           <Button
             variant="ghost"
             size="icon"
             className="h-6 w-6 shrink-0"
             onClick={() => onComplete(task.id)}
             disabled={isCompleted}
           >
             <Check className={cn("h-4 w-4", isCompleted && "text-emerald-500")} />
           </Button>
         )}
         
         <div className="flex-1 min-w-0">
           <p className={cn("text-sm truncate text-[hsl(var(--avivar-foreground))]", isCompleted && "line-through")}>
             {task.title}
           </p>
           {task.lead_name && (
             <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] truncate">
               {task.lead_name}
             </p>
           )}
         </div>
 
         {task.due_at && (
           <span className={cn(
             "text-xs shrink-0",
             isOverdue ? "text-red-500" : isDueToday ? "text-amber-500" : "text-[hsl(var(--avivar-muted-foreground))]"
           )}>
             {format(new Date(task.due_at), "dd/MM HH:mm")}
           </span>
         )}
       </div>
     );
   }
 
   return (
     <Card className={cn(
       "p-3 transition-all bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))]",
       isCompleted && "opacity-60",
       isOverdue && "border-red-500/50 bg-red-500/5"
     )}>
       <div className="flex items-start gap-3">
         <Button
           variant="outline"
           size="icon"
           className={cn(
             "h-8 w-8 shrink-0 rounded-full border-[hsl(var(--avivar-border))]",
             isCompleted && "bg-emerald-500 border-emerald-500 text-white"
           )}
           onClick={() => onComplete(task.id)}
           disabled={isCompleted}
         >
           <Check className="h-4 w-4" />
         </Button>
 
         <div className="flex-1 min-w-0 space-y-1">
           <div className="flex items-start justify-between gap-2">
             <div>
               <p className={cn(
                 "font-medium text-[hsl(var(--avivar-foreground))]",
                 isCompleted && "line-through text-[hsl(var(--avivar-muted-foreground))]"
               )}>
                 {task.title}
               </p>
               {task.lead_name && (
                 <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
                   <User className="h-3 w-3" />
                   {task.lead_name}
                 </p>
               )}
             </div>
 
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                   <MoreVertical className="h-4 w-4" />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 {isCompleted && onReopen && (
                   <DropdownMenuItem onClick={() => onReopen(task.id)}>
                     <RotateCcw className="h-4 w-4 mr-2" />
                     Reabrir
                   </DropdownMenuItem>
                 )}
                 <DropdownMenuItem 
                   onClick={() => onDelete(task.id)}
                   className="text-red-500"
                 >
                   <Trash2 className="h-4 w-4 mr-2" />
                   Excluir
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
 
           {task.description && (
             <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] line-clamp-2">
               {task.description}
             </p>
           )}
 
           <div className="flex items-center gap-2 flex-wrap">
             <Badge variant="outline" className={priorityConfig[task.priority].className}>
               {priorityConfig[task.priority].label}
             </Badge>
 
             {task.due_at && (
               <div className={cn(
                 "flex items-center gap-1 text-xs",
                 isOverdue ? "text-red-500" : isDueToday ? "text-amber-500" : "text-[hsl(var(--avivar-muted-foreground))]"
               )}>
                 {isOverdue ? (
                   <AlertTriangle className="h-3 w-3" />
                 ) : (
                   <Clock className="h-3 w-3" />
                 )}
                 {format(new Date(task.due_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
               </div>
             )}
           </div>
         </div>
       </div>
     </Card>
   );
 }