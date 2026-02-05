 import React from 'react';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { 
   Clock, 
   Edit2, 
   Trash2, 
   Send,
   CheckCircle2,
   AlertTriangle,
   MessageSquare,
   X,
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import type { FollowupExecution } from '@/hooks/useFollowupExecutions';
 
 interface FollowupExecutionCardProps {
   execution: FollowupExecution;
   onCancel: (id: string) => void;
   onSendNow: (id: string) => void;
   onReschedule?: (id: string) => void;
 }
 
 export function FollowupExecutionCard({ 
   execution, 
   onCancel, 
   onSendNow,
   onReschedule 
 }: FollowupExecutionCardProps) {
   const scheduledDate = new Date(execution.scheduled_for);
   const isPending = isPast(scheduledDate) && execution.status === 'pending';
 
   const getStatusBadge = () => {
     switch (execution.status) {
       case 'pending':
         return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Pendente</Badge>;
       case 'scheduled':
         return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Agendado</Badge>;
       case 'sent':
         return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Enviado</Badge>;
       case 'delivered':
         return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Entregue</Badge>;
       case 'read':
         return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Lido</Badge>;
       case 'responded':
         return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">Respondeu</Badge>;
       case 'failed':
         return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Falhou</Badge>;
       case 'cancelled':
         return <Badge variant="outline" className="border-[hsl(var(--avivar-border))]">Cancelado</Badge>;
       case 'skipped':
         return <Badge variant="outline" className="border-[hsl(var(--avivar-border))]">Pulado</Badge>;
       default:
         return null;
     }
   };
 
   const getTimeLabel = () => {
     if (isPending) return 'Agora';
     if (isToday(scheduledDate)) {
       return format(scheduledDate, "'Hoje às' HH:mm", { locale: ptBR });
     }
     if (isTomorrow(scheduledDate)) {
       return format(scheduledDate, "'Amanhã às' HH:mm", { locale: ptBR });
     }
     return format(scheduledDate, "dd/MM 'às' HH:mm", { locale: ptBR });
   };
 
   const getResultIcon = () => {
     switch (execution.status) {
       case 'responded':
         return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
       case 'sent':
       case 'delivered':
       case 'read':
         return <MessageSquare className="h-4 w-4 text-blue-500" />;
       case 'failed':
         return <AlertTriangle className="h-4 w-4 text-red-500" />;
       case 'cancelled':
       case 'skipped':
         return <X className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />;
       default:
         return <Clock className="h-4 w-4 text-amber-500" />;
     }
   };
 
   const isActionable = ['scheduled', 'pending'].includes(execution.status);
 
   return (
     <div 
       className={cn(
         "flex items-center justify-between p-4 rounded-xl border transition-colors",
         isPending
           ? "border-amber-500/30 bg-amber-500/5"
           : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-secondary))]",
         "hover:border-[hsl(var(--avivar-primary)/0.3)]"
       )}
     >
       <div className="flex items-center gap-4">
         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center text-white font-medium">
           {execution.lead_name?.charAt(0) || '?'}
         </div>
         <div>
           <div className="flex items-center gap-2">
             <p className="font-medium text-[hsl(var(--avivar-foreground))]">
               {execution.lead_name || 'Lead desconhecido'}
             </p>
             {getStatusBadge()}
           </div>
           <div className="flex items-center gap-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
             <Badge variant="outline" className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-secondary-foreground))]">
               Tentativa {execution.attempt_number}
             </Badge>
             <span>•</span>
             <span>{execution.channel}</span>
             {execution.ai_generated && (
               <>
                 <span>•</span>
                 <span className="text-purple-500">🤖 IA</span>
               </>
             )}
           </div>
         </div>
       </div>
 
       <div className="flex items-center gap-3">
         <div className="text-right">
           <p className={cn(
             "text-sm font-medium",
             isPending ? "text-amber-600" : "text-[hsl(var(--avivar-secondary-foreground))]"
           )}>
             {getTimeLabel()}
           </p>
           {execution.status === 'failed' && execution.error_message && (
             <p className="text-xs text-red-500 max-w-[150px] truncate" title={execution.error_message}>
               {execution.error_message}
             </p>
           )}
           {execution.status === 'skipped' && execution.skip_reason && (
             <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] max-w-[150px] truncate" title={execution.skip_reason}>
               {execution.skip_reason}
             </p>
           )}
         </div>
 
         {isActionable && (
           <div className="flex gap-1">
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => onSendNow(execution.id)}
               className="h-8 w-8 text-[hsl(var(--avivar-primary))] hover:text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
               title="Enviar agora"
             >
               <Send className="h-3.5 w-3.5" />
             </Button>
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => onCancel(execution.id)}
               className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
               title="Cancelar"
             >
               <Trash2 className="h-3.5 w-3.5" />
             </Button>
           </div>
         )}
 
         {!isActionable && (
           <div className="w-8 h-8 flex items-center justify-center">
             {getResultIcon()}
           </div>
         )}
       </div>
     </div>
   );
 }