 /**
  * CreateTaskDialog - Modal para criar nova tarefa
  */
 
import { useState, useEffect, useMemo } from 'react';
 import { format, addDays, addHours } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
import { Loader2, CalendarDays, Search, User, Phone } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState<{ id: string; name: string; phone: string | null } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
   const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
   const [dueDate, setDueDate] = useState<Date | undefined>(addDays(new Date(), 1));
   const [dueTime, setDueTime] = useState('09:00');
 
  // Filter leads based on search query
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads.slice(0, 20);
    
    const query = searchQuery.toLowerCase().trim();
    return leads.filter(lead => 
      lead.name.toLowerCase().includes(query) ||
      (lead.phone && lead.phone.includes(query))
    ).slice(0, 20);
  }, [leads, searchQuery]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setSearchQuery('');
      setSelectedLead(null);
      setShowSuggestions(false);
      setPriority('medium');
      setDueDate(addDays(new Date(), 1));
      setDueTime('09:00');
    }
  }, [open]);

  const handleSelectLead = (lead: { id: string; name: string; phone: string | null }) => {
    setSelectedLead(lead);
    setSearchQuery(lead.name + (lead.phone ? ` (${lead.phone})` : ''));
    setShowSuggestions(false);
  };

   const handleSubmit = () => {
    if (!title.trim()) return;
    if (!selectedLead || !selectedLead.id) return;
 
     let due_at: string | undefined;
     if (dueDate) {
       const [hours, minutes] = dueTime.split(':').map(Number);
       const fullDate = new Date(dueDate);
       fullDate.setHours(hours, minutes, 0, 0);
       due_at = fullDate.toISOString();
     }
 
    const taskData: CreateAvivarTaskData = {
      lead_id: selectedLead.id,
       title: title.trim(),
       description: description.trim() || undefined,
       priority,
       due_at,
    };

    onCreate(taskData);
   };
 
  const isValid = title.trim() && selectedLead && selectedLead.id;

   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
         <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))]">Nova Tarefa</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
          {/* Lead Search */}
           <div className="space-y-2">
            <Label className="text-[hsl(var(--avivar-foreground))]">Atribuir tarefa para:</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedLead(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-10 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && !selectedLead && (
                <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] rounded-md shadow-lg">
                  <ScrollArea className="max-h-[200px]">
                    {filteredLeads.length > 0 ? (
                      <div className="py-1">
                        {filteredLeads.map((lead) => (
                          <button
                            key={lead.id}
                            type="button"
                            onClick={() => handleSelectLead(lead)}
                            className="w-full px-3 py-2 text-left hover:bg-[hsl(var(--avivar-primary)/0.1)] flex items-center gap-3 transition-colors"
                          >
                            <div className="h-8 w-8 rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center">
                              <User className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] truncate">
                                {lead.name}
                              </p>
                              {lead.phone && (
                                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-3 px-3 text-sm text-[hsl(var(--avivar-muted-foreground))] text-center">
                        {leads.length === 0 
                          ? 'Nenhum lead cadastrado. Crie um lead primeiro no CRM.' 
                          : 'Nenhum lead encontrado com esse termo.'}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}

              {/* Selected Lead Badge */}
              {selectedLead && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--avivar-primary)/0.1)] rounded-full border border-[hsl(var(--avivar-primary)/0.3)]">
                  <User className="h-3 w-3 text-[hsl(var(--avivar-primary))]" />
                  <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                    {selectedLead.name}
                    {selectedLead.phone && <span className="text-[hsl(var(--avivar-muted-foreground))] ml-1">({selectedLead.phone})</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLead(null);
                      setSearchQuery('');
                    }}
                    className="ml-1 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
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