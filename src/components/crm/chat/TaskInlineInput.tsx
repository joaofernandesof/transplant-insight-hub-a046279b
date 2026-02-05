 /**
  * TaskInlineInput - Input de criação de tarefa inline no chat
  * Substitui o MessageInput quando usuário clica em "Tarefa"
  */
 
 import { useState, useEffect } from 'react';
 import { format, addMinutes, addHours, addDays, addWeeks, addMonths, addYears } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { X, Check, ChevronDown, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Calendar } from '@/components/ui/calendar';
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from '@/components/ui/popover';
 import { cn } from '@/lib/utils';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 import { useQuery } from '@tanstack/react-query';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { ScrollArea } from '@/components/ui/scroll-area';
 
 interface TeamMember {
   id: string;
   member_user_id: string;
   name: string;
   email: string;
   avatar_url: string | null;
   role: string;
 }
 
 interface TaskInlineInputProps {
   leadId: string;
   onCancel: () => void;
   onSubmit: (data: {
     title: string;
     due_at: string;
     assigned_to: string;
   }) => void;
   isSubmitting?: boolean;
 }
 
 const quickDateOptions = [
   { label: 'Após 15 minutos', getValue: () => addMinutes(new Date(), 15) },
   { label: 'Após 30 minutos', getValue: () => addMinutes(new Date(), 30) },
   { label: 'Em uma hora', getValue: () => addHours(new Date(), 1) },
   { label: 'Hoje', getValue: () => new Date() },
   { label: 'Amanhã', getValue: () => addDays(new Date(), 1) },
   { label: 'Esta semana', getValue: () => addDays(new Date(), 3) },
   { label: 'Em 7 dias', getValue: () => addWeeks(new Date(), 1) },
   { label: 'Em 30 dias', getValue: () => addMonths(new Date(), 1) },
   { label: 'Em 1 ano', getValue: () => addYears(new Date(), 1) },
 ];
 
 const timeSlots = Array.from({ length: 24 }, (_, hour) => {
   return [
     `${hour.toString().padStart(2, '0')}:00`,
     `${hour.toString().padStart(2, '0')}:30`,
   ];
 }).flat();
 
 export function TaskInlineInput({ leadId, onCancel, onSubmit, isSubmitting }: TaskInlineInputProps) {
   const { user } = useAuth();
   const [title, setTitle] = useState('');
   const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
   const [selectedTime, setSelectedTime] = useState('09:00');
   const [isAllDay, setIsAllDay] = useState(false);
   const [assignedTo, setAssignedTo] = useState<string>(user?.id || '');
   
   const [showDatePicker, setShowDatePicker] = useState(false);
   const [showTimePicker, setShowTimePicker] = useState(false);
   const [showAssigneePicker, setShowAssigneePicker] = useState(false);
 
   // Set default assignee to current user
   useEffect(() => {
     if (user?.id && !assignedTo) {
       setAssignedTo(user.id);
     }
   }, [user?.id]);
 
   // Buscar membros da equipe
   const { data: teamMembers = [] } = useQuery({
     queryKey: ['team-members-for-task', user?.id],
     queryFn: async (): Promise<TeamMember[]> => {
       if (!user?.id) return [];
 
       const { data, error } = await supabase
         .from('avivar_team_members')
         .select('id, member_user_id, name, email, avatar_url, role')
         .eq('owner_user_id', user.id)
         .eq('is_active', true)
         .order('name');
 
       if (error) throw error;
       
       const currentUserAsOwner: TeamMember = {
         id: 'owner',
         member_user_id: user.id,
         name: 'Eu (Proprietário)',
         email: user.email || '',
         avatar_url: null,
         role: 'admin'
       };
 
       return [currentUserAsOwner, ...(data || [])];
     },
     enabled: !!user?.id,
   });
 
   const selectedMember = teamMembers.find(m => m.member_user_id === assignedTo);
 
   const getInitials = (name: string) => {
     return name
       .split(' ')
       .map(n => n[0])
       .join('')
       .toUpperCase()
       .slice(0, 2);
   };
 
   const handleQuickDate = (getValue: () => Date) => {
     setSelectedDate(getValue());
     setShowDatePicker(false);
   };
 
   const handleTimeSelect = (time: string) => {
     setSelectedTime(time);
     setIsAllDay(false);
     setShowTimePicker(false);
   };
 
   const handleAllDay = () => {
     setIsAllDay(true);
     setShowTimePicker(false);
   };
 
   const handleSubmit = () => {
     if (!title.trim()) return;
 
     const dueDate = new Date(selectedDate);
     if (!isAllDay) {
       const [hours, minutes] = selectedTime.split(':').map(Number);
       dueDate.setHours(hours, minutes, 0, 0);
     } else {
       dueDate.setHours(23, 59, 59, 0);
     }
 
     onSubmit({
       title: title.trim(),
       due_at: dueDate.toISOString(),
       assigned_to: assignedTo,
     });
   };
 
   return (
     <div className="border-t border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] p-4">
       {/* Task metadata line */}
       <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
         <span className="text-[hsl(var(--avivar-primary))] font-medium">Tarefa</span>
         <span className="text-[hsl(var(--avivar-muted-foreground))]">vencimento</span>
         
         {/* Date picker */}
         <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
           <PopoverTrigger asChild>
             <button className="px-2 py-0.5 rounded border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))] transition-colors">
               {format(selectedDate, 'dd.MM.yyyy', { locale: ptBR })}
             </button>
           </PopoverTrigger>
           <PopoverContent className="w-auto p-0 flex" align="start" side="top">
             <div className="flex max-h-[280px]">
             {/* Quick options */}
             <div className="border-r border-border">
               <div className="py-1 px-1">
               {quickDateOptions.map((option) => (
                 <button
                   key={option.label}
                   onClick={() => handleQuickDate(option.getValue)}
                   className="w-full text-left px-2 py-0.5 text-xs rounded hover:bg-muted transition-colors whitespace-nowrap"
                 >
                   {option.label}
                 </button>
               ))}
               </div>
             </div>
             
             {/* Calendar */}
             <div>
               <Calendar
                 mode="single"
                 selected={selectedDate}
                 onSelect={(date) => {
                   if (date) {
                     setSelectedDate(date);
                     setShowDatePicker(false);
                   }
                 }}
                 locale={ptBR}
                 initialFocus
                 className="pointer-events-auto p-0"
               />
             </div>
             
             {/* Time picker column */}
             <div className="border-l border-border py-1 px-1">
               <div>
                 <button
                   onClick={handleAllDay}
                   className={cn(
                     "w-full text-left px-1.5 py-0.5 text-xs rounded transition-colors whitespace-nowrap",
                     isAllDay ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                   )}
                 >
                   Dia todo
                 </button>
               </div>
               <ScrollArea className="h-[230px]">
                 <div>
                   {timeSlots.map((time) => (
                     <button
                       key={time}
                       onClick={() => handleTimeSelect(time)}
                       className={cn(
                         "w-full text-left px-1.5 py-0 text-xs rounded transition-colors",
                         selectedTime === time && !isAllDay ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                       )}
                     >
                       {time}
                     </button>
                   ))}
                 </div>
               </ScrollArea>
             </div>
             </div>
           </PopoverContent>
         </Popover>
 
         {/* Time display */}
         {!isAllDay && (
           <button 
             onClick={() => setShowDatePicker(true)}
             className="px-2 py-0.5 rounded border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted))] transition-colors"
           >
             {selectedTime}
           </button>
         )}
         {isAllDay && (
           <span className="px-2 py-0.5 rounded border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]">
             Dia todo
           </span>
         )}
 
         <span className="text-[hsl(var(--avivar-muted-foreground))]">para</span>
         
         {/* Assignee picker */}
         <Popover open={showAssigneePicker} onOpenChange={setShowAssigneePicker}>
           <PopoverTrigger asChild>
             <button className="flex items-center gap-1 px-2 py-0.5 rounded border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-muted))] transition-colors font-medium">
               {selectedMember ? (
                 <>
                   <Avatar className="h-4 w-4">
                     {selectedMember.avatar_url && <AvatarImage src={selectedMember.avatar_url} />}
                     <AvatarFallback className="text-[8px] bg-[hsl(var(--avivar-primary))] text-white">
                       {getInitials(selectedMember.name)}
                     </AvatarFallback>
                   </Avatar>
                   {selectedMember.name}
                 </>
               ) : (
                 'Selecionar'
               )}
               <ChevronDown className="h-3 w-3" />
             </button>
           </PopoverTrigger>
           <PopoverContent className="w-56 p-1" align="start" side="top">
             <div className="space-y-0.5">
               {teamMembers.map((member) => (
                 <button
                   key={member.id}
                   onClick={() => {
                     setAssignedTo(member.member_user_id);
                     setShowAssigneePicker(false);
                   }}
                   className={cn(
                     "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                     "hover:bg-muted",
                     assignedTo === member.member_user_id && "bg-muted"
                   )}
                 >
                   <Avatar className="h-6 w-6">
                     {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                     <AvatarFallback className="text-[10px] bg-[hsl(var(--avivar-primary))] text-white">
                       {getInitials(member.name)}
                     </AvatarFallback>
                   </Avatar>
                   <span className="flex-1 text-left">{member.name}</span>
                   {assignedTo === member.member_user_id && (
                     <Check className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                   )}
                 </button>
               ))}
             </div>
           </PopoverContent>
         </Popover>
 
         <span className="text-[hsl(var(--avivar-muted-foreground))]">:</span>
         <span className="text-emerald-500">🔔 Acompanhar:</span>
       </div>
 
       {/* Task content input */}
       <div className="mb-3">
         <Input
           value={title}
           onChange={(e) => setTitle(e.target.value)}
           placeholder="Descreva a tarefa..."
           className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
           autoFocus
           onKeyDown={(e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
               e.preventDefault();
               handleSubmit();
             }
             if (e.key === 'Escape') {
               onCancel();
             }
           }}
         />
       </div>
 
       {/* Action buttons */}
       <div className="flex items-center gap-2">
         <Button
           onClick={handleSubmit}
           disabled={!title.trim() || isSubmitting}
           className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
         >
           {isSubmitting ? (
             <Loader2 className="h-4 w-4 animate-spin mr-2" />
           ) : null}
           Definir
         </Button>
         <Button variant="ghost" onClick={onCancel}>
           Cancelar
         </Button>
       </div>
     </div>
   );
 }