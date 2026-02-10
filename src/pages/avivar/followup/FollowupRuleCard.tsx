import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Clock, 
  MessageSquare, 
  Edit2, 
  Trash2, 
  Zap,
  Brain,
  Calendar,
  ArrowRight,
  Mic,
  Music,
  Forward,
  Image,
  Video,
  FileText,
  Filter,
} from 'lucide-react';
import { useKanbanBoards } from '@/hooks/useKanbanBoards';
import { cn } from '@/lib/utils';
import type { FollowupRule } from '@/hooks/useFollowupRules';
 
 interface FollowupRuleCardProps {
   rule: FollowupRule;
   onToggle: (id: string, isActive: boolean) => void;
   onEdit: (rule: FollowupRule) => void;
   onDelete: (id: string) => void;
 }
 
export function FollowupRuleCard({ rule, onToggle, onEdit, onDelete }: FollowupRuleCardProps) {
  const { boards } = useKanbanBoards();
  const scopeBoardNames = (rule.applicable_kanban_ids || [])
    .map(id => boards.find(b => b.id === id)?.name)
    .filter(Boolean);
   const getDelayLabel = () => {
     const value = rule.delay_minutes;
     if (rule.delay_type === 'hours') return `${value / 60} hora${value / 60 > 1 ? 's' : ''}`;
     if (rule.delay_type === 'days') return `${value / 1440} dia${value / 1440 > 1 ? 's' : ''}`;
     return `${value} minuto${value > 1 ? 's' : ''}`;
   };
 
 
   return (
     <div 
       className={cn(
         "p-4 rounded-xl border transition-all",
         rule.is_active 
           ? "border-[hsl(var(--avivar-primary)/0.4)] bg-[hsl(var(--avivar-secondary))]" 
           : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted)/0.3)] opacity-60"
       )}
     >
       <div className="flex items-start justify-between gap-4">
         <div className="flex items-center gap-3">
           <div className={cn(
             "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
             rule.is_active 
               ? "bg-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))]" 
               : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
           )}>
             {rule.attempt_number}
           </div>
           <div className="flex-1">
             <div className="flex items-center gap-2 flex-wrap">
               <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                 {rule.name || `Tentativa ${rule.attempt_number}`}
               </p>
               {rule.use_ai_generation && (
                 <Badge className="text-xs bg-purple-500/20 text-purple-500 border-purple-500/30">
                   <Brain className="h-3 w-3 mr-1" />
                   IA
                 </Badge>
               )}
              {rule.respect_business_hours && (
                  <Badge variant="outline" className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]">
                    <Calendar className="h-3 w-3 mr-1" />
                    Horário comercial
                  </Badge>
                )}
                {rule.audio_url && (
                  <Badge className="text-xs bg-orange-500/20 text-orange-500 border-orange-500/30">
                    {rule.audio_type === 'ptt' ? (
                      <><Mic className="h-3 w-3 mr-1" />Voz</>
                    ) : (
                      <><Music className="h-3 w-3 mr-1" />Áudio{rule.audio_forward && <Forward className="h-3 w-3 ml-1" />}</>
                    )}
                  </Badge>
                )}
                {rule.image_url && (
                  <Badge className="text-xs bg-blue-500/20 text-blue-500 border-blue-500/30">
                    <Image className="h-3 w-3 mr-1" />Imagem
                  </Badge>
                )}
                {rule.video_url && (
                  <Badge className="text-xs bg-pink-500/20 text-pink-500 border-pink-500/30">
                    <Video className="h-3 w-3 mr-1" />Vídeo
                  </Badge>
                )}
                {rule.document_url && (
                  <Badge className="text-xs bg-cyan-500/20 text-cyan-500 border-cyan-500/30">
                    <FileText className="h-3 w-3 mr-1" />Arquivo
                  </Badge>
                )}
                {scopeBoardNames.length > 0 && (
                  <Badge variant="outline" className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]">
                    <Filter className="h-3 w-3 mr-1" />
                    {scopeBoardNames.length === 1 ? scopeBoardNames[0] : `${scopeBoardNames.length} funis`}
                  </Badge>
                )}
             </div>
             <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1">
               <Clock className="h-3 w-3 inline mr-1" />
               Após {getDelayLabel()} sem resposta
             </p>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <Switch 
             checked={rule.is_active}
             onCheckedChange={(checked) => onToggle(rule.id, checked)}
           />
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => onEdit(rule)}
             className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
           >
             <Edit2 className="h-4 w-4" />
           </Button>
           <Button 
             variant="ghost" 
             size="icon" 
             onClick={() => onDelete(rule.id)}
             className="text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
           >
             <Trash2 className="h-4 w-4" />
           </Button>
         </div>
       </div>
 
       {/* Message Preview */}
       <div className="mt-3 p-3 rounded-lg bg-[hsl(var(--avivar-muted)/0.5)] border border-[hsl(var(--avivar-border)/0.5)]">
         <p className="text-sm text-[hsl(var(--avivar-secondary-foreground))] flex items-start gap-2">
           <MessageSquare className="h-4 w-4 text-[hsl(var(--avivar-primary))] mt-0.5 flex-shrink-0" />
           {rule.message_template}
         </p>
       </div>
 
       {/* Automation Actions */}
       {(rule.move_to_column_id || rule.create_task_on_failure) && (
         <div className="mt-3 flex items-center gap-3 text-xs text-[hsl(var(--avivar-muted-foreground))]">
           {rule.move_to_column_id && (
             <span className="flex items-center gap-1">
               <ArrowRight className="h-3 w-3" />
               Move para etapa automaticamente
             </span>
           )}
           {rule.create_task_on_failure && (
             <span className="flex items-center gap-1">
               <Zap className="h-3 w-3" />
               Cria tarefa se falhar
             </span>
           )}
         </div>
       )}
     </div>
   );
 }