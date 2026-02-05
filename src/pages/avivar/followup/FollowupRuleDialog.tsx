 import React, { useState, useEffect } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Switch } from '@/components/ui/switch';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Brain, Clock, Zap, Calendar, Info } from 'lucide-react';
 import { TEMPLATE_VARIABLES } from '@/hooks/useFollowupTemplates';
 import type { FollowupRule, CreateFollowupRuleInput } from '@/hooks/useFollowupRules';
 import { useKanbanBoards } from '@/hooks/useKanbanBoards';
 
 interface FollowupRuleDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   rule?: FollowupRule | null;
   onSave: (data: CreateFollowupRuleInput | (Partial<FollowupRule> & { id: string })) => void;
   isLoading?: boolean;
   existingRulesCount: number;
 }
 
 export function FollowupRuleDialog({
   open,
   onOpenChange,
   rule,
   onSave,
   isLoading,
   existingRulesCount,
 }: FollowupRuleDialogProps) {
   const { boards, columns } = useKanbanBoards();
   const isEditing = !!rule;
 
   const [formData, setFormData] = useState({
     name: '',
     attempt_number: existingRulesCount + 1,
     delay_value: 30,
     delay_type: 'minutes' as 'minutes' | 'hours' | 'days',
     message_template: '',
     urgency_level: 'soft' as 'soft' | 'medium' | 'urgent',
     use_ai_generation: false,
     ai_context: '',
     respect_business_hours: true,
     business_hours_start: '08:00',
     business_hours_end: '18:00',
     excluded_days: [0, 6],
     target_kanban_id: '',
     move_to_column_id: '',
     create_task_on_failure: false,
     max_attempts: 3,
   });
 
   useEffect(() => {
     if (rule) {
       let delayValue = rule.delay_minutes;
       let delayType: 'minutes' | 'hours' | 'days' = 'minutes';
       
       if (rule.delay_minutes >= 1440) {
         delayValue = rule.delay_minutes / 1440;
         delayType = 'days';
       } else if (rule.delay_minutes >= 60) {
         delayValue = rule.delay_minutes / 60;
         delayType = 'hours';
       }
 
       setFormData({
         name: rule.name || '',
         attempt_number: rule.attempt_number,
         delay_value: delayValue,
         delay_type: delayType,
         message_template: rule.message_template,
         urgency_level: rule.urgency_level,
         use_ai_generation: rule.use_ai_generation,
         ai_context: rule.ai_context || '',
         respect_business_hours: rule.respect_business_hours,
         business_hours_start: rule.business_hours_start || '08:00',
         business_hours_end: rule.business_hours_end || '18:00',
         excluded_days: rule.excluded_days || [0, 6],
         target_kanban_id: rule.target_kanban_id || '',
         move_to_column_id: rule.move_to_column_id || '',
         create_task_on_failure: rule.create_task_on_failure,
         max_attempts: rule.max_attempts,
       });
     } else {
       setFormData(prev => ({
         ...prev,
         name: `Tentativa ${existingRulesCount + 1}`,
         attempt_number: existingRulesCount + 1,
       }));
     }
   }, [rule, existingRulesCount, open]);
 
   const handleSubmit = () => {
     let delayMinutes = formData.delay_value;
     if (formData.delay_type === 'hours') delayMinutes *= 60;
     if (formData.delay_type === 'days') delayMinutes *= 1440;
 
     const data = {
       name: formData.name,
       attempt_number: formData.attempt_number,
       delay_minutes: delayMinutes,
       delay_type: formData.delay_type,
       message_template: formData.message_template,
       urgency_level: formData.urgency_level,
       use_ai_generation: formData.use_ai_generation,
       ai_context: formData.ai_context || null,
       respect_business_hours: formData.respect_business_hours,
       business_hours_start: formData.business_hours_start,
       business_hours_end: formData.business_hours_end,
       excluded_days: formData.excluded_days,
       target_kanban_id: formData.target_kanban_id || null,
       move_to_column_id: formData.move_to_column_id || null,
       create_task_on_failure: formData.create_task_on_failure,
       max_attempts: formData.max_attempts,
     };
 
     if (isEditing && rule) {
       onSave({ id: rule.id, ...data });
     } else {
       onSave(data);
     }
   };
 
   const insertVariable = (variable: string) => {
     setFormData(prev => ({
       ...prev,
       message_template: prev.message_template + variable,
     }));
   };
 
   const selectedKanbanColumns = columns.filter(c => c.kanban_id === formData.target_kanban_id);
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
         <DialogHeader>
           <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
             {isEditing ? 'Editar Regra de Follow-up' : 'Nova Regra de Follow-up'}
           </DialogTitle>
           <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
             Configure quando e como as mensagens de follow-up serão enviadas
           </DialogDescription>
         </DialogHeader>
 
         <Tabs defaultValue="message" className="space-y-4">
           <TabsList className="bg-[hsl(var(--avivar-secondary))]">
             <TabsTrigger value="message">Mensagem</TabsTrigger>
             <TabsTrigger value="timing">Horários</TabsTrigger>
             <TabsTrigger value="automation">Automação</TabsTrigger>
             <TabsTrigger value="ai">IA</TabsTrigger>
           </TabsList>
 
           <TabsContent value="message" className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="name" className="text-[hsl(var(--avivar-foreground))]">Nome da Regra</Label>
                 <Input
                   id="name"
                   value={formData.name}
                   onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                   placeholder="Ex: Primeira abordagem"
                   className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="attempt" className="text-[hsl(var(--avivar-foreground))]">Número da Tentativa</Label>
                 <Input
                   id="attempt"
                   type="number"
                   min={1}
                   max={10}
                   value={formData.attempt_number}
                   onChange={(e) => setFormData(prev => ({ ...prev, attempt_number: parseInt(e.target.value) || 1 }))}
                   className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                 />
               </div>
             </div>
 
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[hsl(var(--avivar-foreground))]">Aguardar</Label>
                 <div className="flex gap-2">
                   <Input
                     type="number"
                     min={1}
                     value={formData.delay_value}
                     onChange={(e) => setFormData(prev => ({ ...prev, delay_value: parseInt(e.target.value) || 1 }))}
                     className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] flex-1"
                   />
                   <Select
                     value={formData.delay_type}
                     onValueChange={(value: 'minutes' | 'hours' | 'days') => setFormData(prev => ({ ...prev, delay_type: value }))}
                   >
                     <SelectTrigger className="w-32 bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="minutes">Minutos</SelectItem>
                       <SelectItem value="hours">Horas</SelectItem>
                       <SelectItem value="days">Dias</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-[hsl(var(--avivar-foreground))]">Nível de Urgência</Label>
                 <Select
                   value={formData.urgency_level}
                   onValueChange={(value: 'soft' | 'medium' | 'urgent') => setFormData(prev => ({ ...prev, urgency_level: value }))}
                 >
                   <SelectTrigger className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="soft">🌱 Suave</SelectItem>
                     <SelectItem value="medium">⚡ Médio</SelectItem>
                     <SelectItem value="urgent">🔥 Urgente</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
 
             <div className="space-y-2">
               <Label className="text-[hsl(var(--avivar-foreground))]">Mensagem</Label>
               <Textarea
                 value={formData.message_template}
                 onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
                 placeholder="Olá {{primeiro_nome}}! Vi que você demonstrou interesse..."
                 className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] min-h-[100px]"
               />
               <div className="flex flex-wrap gap-2">
                 {TEMPLATE_VARIABLES.map((v) => (
                   <Badge
                     key={v.key}
                     variant="outline"
                     className="cursor-pointer hover:bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-border))]"
                     onClick={() => insertVariable(v.key)}
                   >
                     {v.key}
                   </Badge>
                 ))}
               </div>
             </div>
           </TabsContent>
 
           <TabsContent value="timing" className="space-y-4">
             <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-secondary))]">
               <div className="flex items-center gap-3">
                 <Calendar className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                 <div>
                   <p className="font-medium text-[hsl(var(--avivar-foreground))]">Respeitar Horário Comercial</p>
                   <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                     Enviar apenas dentro do horário definido
                   </p>
                 </div>
               </div>
               <Switch
                 checked={formData.respect_business_hours}
                 onCheckedChange={(checked) => setFormData(prev => ({ ...prev, respect_business_hours: checked }))}
               />
             </div>
 
             {formData.respect_business_hours && (
               <>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[hsl(var(--avivar-foreground))]">Início</Label>
                     <Input
                       type="time"
                       value={formData.business_hours_start}
                       onChange={(e) => setFormData(prev => ({ ...prev, business_hours_start: e.target.value }))}
                       className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[hsl(var(--avivar-foreground))]">Fim</Label>
                     <Input
                       type="time"
                       value={formData.business_hours_end}
                       onChange={(e) => setFormData(prev => ({ ...prev, business_hours_end: e.target.value }))}
                       className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                     />
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <Label className="text-[hsl(var(--avivar-foreground))]">Dias Excluídos</Label>
                   <div className="flex gap-2">
                     {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                       <Button
                         key={day}
                         type="button"
                         variant={formData.excluded_days.includes(idx) ? 'default' : 'outline'}
                         size="sm"
                         onClick={() => {
                           const newDays = formData.excluded_days.includes(idx)
                             ? formData.excluded_days.filter(d => d !== idx)
                             : [...formData.excluded_days, idx];
                           setFormData(prev => ({ ...prev, excluded_days: newDays }));
                         }}
                         className={formData.excluded_days.includes(idx) 
                           ? 'bg-red-500/80 hover:bg-red-600' 
                           : 'border-[hsl(var(--avivar-border))]'
                         }
                       >
                         {day}
                       </Button>
                     ))}
                   </div>
                   <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                     Dias em vermelho não receberão follow-ups
                   </p>
                 </div>
               </>
             )}
           </TabsContent>
 
           <TabsContent value="automation" className="space-y-4">
             <div className="space-y-2">
               <Label className="text-[hsl(var(--avivar-foreground))]">Mover para Kanban/Etapa</Label>
               <Select
                 value={formData.target_kanban_id || 'none'}
                 onValueChange={(value) => setFormData(prev => ({ ...prev, target_kanban_id: value === 'none' ? '' : value, move_to_column_id: '' }))}
               >
                 <SelectTrigger className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                   <SelectValue placeholder="Selecione um funil (opcional)" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">Nenhum</SelectItem>
                   {boards.map((board) => (
                     <SelectItem key={board.id} value={board.id}>{board.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {formData.target_kanban_id && (
               <div className="space-y-2">
                 <Label className="text-[hsl(var(--avivar-foreground))]">Coluna de Destino</Label>
                 <Select
                   value={formData.move_to_column_id}
                   onValueChange={(value) => setFormData(prev => ({ ...prev, move_to_column_id: value }))}
                 >
                   <SelectTrigger className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                     <SelectValue placeholder="Selecione uma coluna" />
                   </SelectTrigger>
                   <SelectContent>
                     {selectedKanbanColumns.map((col) => (
                       <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
 
             <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(var(--avivar-secondary))]">
               <div className="flex items-center gap-3">
                 <Zap className="h-5 w-5 text-amber-500" />
                 <div>
                    <p className="font-medium text-[hsl(var(--avivar-foreground))]">Criar Tarefa se Falhar</p>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                      Se o lead não responder após todas as tentativas, cria uma tarefa para você entrar em contato manualmente
                    </p>
                 </div>
               </div>
               <Switch
                 checked={formData.create_task_on_failure}
                 onCheckedChange={(checked) => setFormData(prev => ({ ...prev, create_task_on_failure: checked }))}
               />
             </div>
 
              <div className="space-y-2">
                <Label className="text-[hsl(var(--avivar-foreground))]">Máximo de Tentativas desta Regra</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.max_attempts}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 3 }))}
                  className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] w-24"
                />
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  Quantas vezes esta mensagem será reenviada se o lead não responder. Após atingir este limite, o sistema para de enviar esta regra automaticamente.
                </p>
              </div>
           </TabsContent>
 
           <TabsContent value="ai" className="space-y-4">
             <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
               <div className="flex items-center gap-3">
                 <Brain className="h-5 w-5 text-purple-500" />
                 <div>
                   <p className="font-medium text-[hsl(var(--avivar-foreground))]">Personalização com IA</p>
                   <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                     A IA personaliza a mensagem para cada lead
                   </p>
                 </div>
               </div>
               <Switch
                 checked={formData.use_ai_generation}
                 onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_ai_generation: checked }))}
               />
             </div>
 
             {formData.use_ai_generation && (
               <div className="space-y-2">
                 <Label className="text-[hsl(var(--avivar-foreground))]">Contexto para a IA</Label>
                 <Textarea
                   value={formData.ai_context}
                   onChange={(e) => setFormData(prev => ({ ...prev, ai_context: e.target.value }))}
                   placeholder="Ex: Somos uma clínica de estética focada em procedimentos faciais. Tom amigável e profissional."
                   className="bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] min-h-[80px]"
                 />
                 <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
                   <Info className="h-3 w-3" />
                   A IA usará esse contexto para personalizar a mensagem mantendo sua intenção
                 </p>
               </div>
             )}
           </TabsContent>
         </Tabs>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[hsl(var(--avivar-border))]">
             Cancelar
           </Button>
           <Button 
             onClick={handleSubmit} 
             disabled={isLoading || !formData.message_template}
             className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
           >
             {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Regra'}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }