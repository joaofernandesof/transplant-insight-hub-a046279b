 /**
  * TaskBanner - Banner de tarefa pendente exibido no chat
  * Mostra tarefas não concluídas associadas ao lead/conversa
  */
 
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
import { Clock, Check, X, Pencil } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { Button } from '@/components/ui/button';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ConversationTask } from '@/hooks/useConversationTasks';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 interface TaskBannerProps {
  task: ConversationTask;
   onComplete: (taskId: string) => void;
   onDelete: (taskId: string) => void;
  onEdit?: (task: ConversationTask) => void;
   isCompleting?: boolean;
   isDeleting?: boolean;
 }
 
export function TaskBanner({ task, onComplete, onDelete, onEdit, isCompleting, isDeleting }: TaskBannerProps) {
   const { user } = useAuth();
   
   // Buscar nome do responsável
   const { data: assignee } = useQuery({
     queryKey: ['task-assignee', task.assigned_to],
     queryFn: async () => {
       if (!task.assigned_to) return null;
       
       // Primeiro verifica se é o owner
       if (task.assigned_to === user?.id) {
         return {
           name: 'Você',
           avatar_url: null,
         };
       }
       
       // Busca nos membros da equipe
       const { data } = await supabase
         .from('avivar_team_members')
         .select('name, avatar_url')
         .eq('member_user_id', task.assigned_to)
         .single();
       
       return data;
     },
     enabled: !!task.assigned_to,
   });
 
   const getInitials = (name: string) => {
     return name
       .split(' ')
       .map(n => n[0])
       .join('')
       .toUpperCase()
       .slice(0, 2);
   };
 
   const isOverdue = task.due_at && new Date(task.due_at) < new Date();
 
   return (
     <div className={cn(
       "mx-4 mb-2 rounded-lg border p-3 transition-all",
       isOverdue 
         ? "bg-red-500/10 border-red-500/30" 
         : "bg-[hsl(var(--avivar-muted))] border-[hsl(var(--avivar-border))]"
     )}>
       <div className="flex items-start gap-3">
         {/* Icon */}
         <div className={cn(
           "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
           isOverdue ? "bg-red-500/20" : "bg-amber-500/20"
         )}>
           <Clock className={cn(
             "h-4 w-4",
             isOverdue ? "text-red-500" : "text-amber-500"
           )} />
         </div>
 
         {/* Content */}
         <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 text-xs text-[hsl(var(--avivar-muted-foreground))] mb-1">
             {task.due_at && (
               <span className={cn(isOverdue && "text-red-500 font-medium")}>
                 {format(new Date(task.due_at), "dd.MM.yyyy", { locale: ptBR })}
               </span>
             )}
             <span>De TI para</span>
             <span className="text-[hsl(var(--avivar-primary))] font-medium uppercase">
               {assignee?.name || 'Carregando...'}
             </span>
           </div>
           
           <div className="flex items-start gap-2">
             <span className="text-emerald-500">🔔</span>
             <div>
               <span className="text-[hsl(var(--avivar-foreground))] font-medium">Acompanhar</span>
               <span className="text-[hsl(var(--avivar-muted-foreground))]"> — </span>
               <span className="text-[hsl(var(--avivar-foreground))]">{task.title}</span>
             </div>
           </div>
 
           <div className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
             Modificado por TI {format(new Date(task.updated_at), "dd.MM.yyyy, HH:mm:ss", { locale: ptBR })}
           </div>
         </div>
 
         {/* Actions */}
         <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
              onClick={() => onEdit(task)}
              title="Editar tarefa"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
           <Button
             variant="ghost"
             size="icon"
             className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
             onClick={() => onComplete(task.id)}
             disabled={isCompleting}
             title="Concluir tarefa"
           >
             <Check className="h-4 w-4" />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
             onClick={() => onDelete(task.id)}
             disabled={isDeleting}
             title="Excluir tarefa"
           >
             <X className="h-4 w-4" />
           </Button>
         </div>
       </div>
     </div>
   );
 }