 /**
  * CreateTaskDialog - Modal para criar nova tarefa
  */
 
 import { useState } from 'react';
 import { format, addDays, addHours } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { Loader2, CalendarDays } from 'lucide-react';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Calendar } from '@/components/ui/calendar';
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from '@/components/ui/popover';
 import { cn } from '@/lib/utils';
 import { CreateAvivarTaskData } from '@/hooks/useAvivarTasks';
 
 interface CreateTaskDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   leads: Array<{ id: string; name: string; phone: string | null }>;
   onCreate: (data: CreateAvivarTaskData) => void;
   isCreating: boolean;
 }
 
 const timeSlots = Array.from({ length: 24 }, (_, hour) => {
   return [
     `${hour.toString().padStart(2, '0')}:00`,
     `${hour.toString().padStart(2, '0')}:30`,
   ];
 }).flat();
 
 export function CreateTaskDialog({ 
   open, 
   onOpenChange, 
   leads, 
   onCreate, 
   isCreating 
 }: CreateTaskDialogProps) {
   const [title, setTitle] = useState('');
   const [description, setDescription] = useState('');
   const [leadId, setLeadId] = useState('');
   const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
   const [dueDate, setDueDate] = useState<Date | undefined>(addDays(new Date(), 1));
   const [dueTime, setDueTime] = useState('09:00');
 
   const handleSubmit = () => {
     if (!title.trim() || !leadId) return;
 
     let due_at: string | undefined;
     if (dueDate) {
       const [hours, minutes] = dueTime.split(':').map(Number);
       const fullDate = new Date(dueDate);
       fullDate.setHours(hours, minutes, 0, 0);
       due_at = fullDate.toISOString();
     }
 
     onCreate({
       lead_id: leadId,
       title: title.trim(),
       description: description.trim() || undefined,
       priority,
       due_at,
     });
 
     // Reset form
     setTitle('');
     setDescription('');
     setLeadId('');
     setPriority('medium');
     setDueDate(addDays(new Date(), 1));
     setDueTime('09:00');
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-lg">
         <DialogHeader>
           <DialogTitle>Nova Tarefa</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           {/* Lead Selection */}
           <div className="space-y-2">
             <Label htmlFor="lead">Lead *</Label>
             <Select value={leadId} onValueChange={setLeadId}>
               <SelectTrigger>
                 <SelectValue placeholder="Selecione um lead" />
               </SelectTrigger>
               <SelectContent>
                 {leads.map((lead) => (
                   <SelectItem key={lead.id} value={lead.id}>
                     {lead.name} {lead.phone && `(${lead.phone})`}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Title */}
           <div className="space-y-2">
             <Label htmlFor="title">Título *</Label>
             <Input
               id="title"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Ex: Ligar para confirmar agendamento"
             />
           </div>
 
           {/* Description */}
           <div className="space-y-2">
             <Label htmlFor="description">Descrição</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Detalhes adicionais..."
               rows={2}
             />
           </div>
 
           {/* Due Date & Time */}
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Data de Vencimento</Label>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     className={cn(
                       "w-full justify-start text-left font-normal",
                       !dueDate && "text-muted-foreground"
                     )}
                   >
                     <CalendarDays className="mr-2 h-4 w-4" />
                     {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0" align="start">
                   <Calendar
                     mode="single"
                     selected={dueDate}
                     onSelect={setDueDate}
                     locale={ptBR}
                     initialFocus
                   />
                 </PopoverContent>
               </Popover>
             </div>
 
             <div className="space-y-2">
               <Label>Horário</Label>
               <Select value={dueTime} onValueChange={setDueTime}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {timeSlots.map((time) => (
                     <SelectItem key={time} value={time}>
                       {time}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           {/* Priority */}
           <div className="space-y-2">
             <Label>Prioridade</Label>
             <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
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
 
         <div className="flex justify-end gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Cancelar
           </Button>
           <Button 
             onClick={handleSubmit}
             disabled={!title.trim() || !leadId || isCreating}
           >
             {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
             Criar Tarefa
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }