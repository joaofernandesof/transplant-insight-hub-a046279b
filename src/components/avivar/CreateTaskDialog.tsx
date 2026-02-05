 /**
  * CreateTaskDialog - Modal para criar nova tarefa
  */
 
import { useState, useEffect } from 'react';
 import { format, addDays, addHours } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
import { Loader2, CalendarDays, Phone, User } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'lead' | 'phone'>(leads.length > 0 ? 'lead' : 'phone');
   const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
   const [dueDate, setDueDate] = useState<Date | undefined>(addDays(new Date(), 1));
   const [dueTime, setDueTime] = useState('09:00');
 
  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setLeadId('');
      setPhoneNumber('');
      setContactName('');
      setAssignmentMode(leads.length > 0 ? 'lead' : 'phone');
      setPriority('medium');
      setDueDate(addDays(new Date(), 1));
      setDueTime('09:00');
    }
  }, [open, leads.length]);

   const handleSubmit = () => {
    if (!title.trim()) return;
    
    // Validate based on assignment mode
    if (assignmentMode === 'lead' && !leadId) return;
    if (assignmentMode === 'phone' && !phoneNumber.trim()) return;
 
     let due_at: string | undefined;
     if (dueDate) {
       const [hours, minutes] = dueTime.split(':').map(Number);
       const fullDate = new Date(dueDate);
       fullDate.setHours(hours, minutes, 0, 0);
       due_at = fullDate.toISOString();
     }
 
    const taskData: CreateAvivarTaskData = {
       title: title.trim(),
       description: description.trim() || undefined,
       priority,
       due_at,
    };

    if (assignmentMode === 'lead') {
      taskData.lead_id = leadId;
    } else {
      taskData.phone_number = phoneNumber.trim();
      taskData.contact_name = contactName.trim() || undefined;
    }

    onCreate(taskData);
   };
 
  const isValid = title.trim() && (
    (assignmentMode === 'lead' && leadId) ||
    (assignmentMode === 'phone' && phoneNumber.trim())
  );

   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
         <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))]">Nova Tarefa</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
          {/* Assignment Mode Tabs */}
           <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))]">Atribuir a *</Label>
            <Tabs value={assignmentMode} onValueChange={(v) => setAssignmentMode(v as 'lead' | 'phone')}>
              <TabsList className="grid w-full grid-cols-2 bg-[hsl(var(--avivar-background))]">
                <TabsTrigger 
                  value="lead" 
                  className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
                  disabled={leads.length === 0}
                >
                  <User className="h-4 w-4 mr-2" />
                  Lead Existente
                </TabsTrigger>
                <TabsTrigger 
                  value="phone"
                  className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Telefone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lead" className="mt-3">
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] max-h-[200px]">
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} {lead.phone && `(${lead.phone})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="phone" className="mt-3 space-y-3">
                <div>
                  <Input
                    placeholder="Telefone (ex: 11999999999)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Nome do contato (opcional)"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                  />
                </div>
              </TabsContent>
            </Tabs>
           </div>
 
           {/* Title */}
           <div className="space-y-2">
            <Label htmlFor="title" className="text-[hsl(var(--avivar-foreground))]">Título *</Label>
             <Input
               id="title"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Ex: Ligar para confirmar agendamento"
              className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
             />
           </div>
 
           {/* Description */}
           <div className="space-y-2">
            <Label htmlFor="description" className="text-[hsl(var(--avivar-foreground))]">Descrição</Label>
             <Textarea
               id="description"
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               placeholder="Detalhes adicionais..."
               rows={2}
              className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
             />
           </div>
 
           {/* Due Date & Time */}
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Data de Vencimento</Label>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button
                     variant="outline"
                     className={cn(
                      "w-full justify-start text-left font-normal bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]",
                      !dueDate && "text-[hsl(var(--avivar-muted-foreground))]"
                     )}
                   >
                     <CalendarDays className="mr-2 h-4 w-4" />
                     {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                   </Button>
                 </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]" align="start">
                   <Calendar
                     mode="single"
                     selected={dueDate}
                     onSelect={setDueDate}
                     locale={ptBR}
                     initialFocus
                    className="pointer-events-auto"
                   />
                 </PopoverContent>
               </Popover>
             </div>
 
             <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Horário</Label>
               <Select value={dueTime} onValueChange={setDueTime}>
                <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                   <SelectValue />
                 </SelectTrigger>
                <SelectContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] max-h-[200px]">
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
            <Label className="text-[hsl(var(--avivar-foreground))]">Prioridade</Label>
             <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                 <SelectValue />
               </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
                 <SelectItem value="low">Baixa</SelectItem>
                 <SelectItem value="medium">Média</SelectItem>
                 <SelectItem value="high">Alta</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </div>
 
         <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
             Cancelar
           </Button>
           <Button 
             onClick={handleSubmit}
            disabled={!isValid || isCreating}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
           >
             {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
             Criar Tarefa
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }