 /**
  * TaskInlineInput - Input de criação de tarefa inline no chat
  * Substitui o MessageInput quando usuário clica em "Tarefa"
  */
 
 import { useState, useEffect } from 'react';
 import { format, addDays, parse, isValid } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import { X, Check, ChevronDown, Loader2, CalendarIcon, Clock } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
 import { Calendar } from '@/components/ui/calendar';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { cn } from '@/lib/utils';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 import { useQuery } from '@tanstack/react-query';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 
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
 
 // Time slots every 30 minutes
 const timeSlots = Array.from({ length: 48 }, (_, i) => {
   const hours = Math.floor(i / 2);
   const minutes = i % 2 === 0 ? '00' : '30';
   return `${hours.toString().padStart(2, '0')}:${minutes}`;
 });
 
 export function TaskInlineInput({ leadId, onCancel, onSubmit, isSubmitting }: TaskInlineInputProps) {
   const { user } = useAuth();
   const [title, setTitle] = useState('');
   const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
   const [selectedTime, setSelectedTime] = useState('09:00');
   const [dateInputValue, setDateInputValue] = useState(format(addDays(new Date(), 1), 'dd.MM.yyyy'));
   const [assignedTo, setAssignedTo] = useState<string>(user?.id || '');
   
   const [showDateTimePicker, setShowDateTimePicker] = useState(false);
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
 
   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const value = e.target.value;
     setDateInputValue(value);
     // Try parsing dd.MM.yyyy format
     const parsed = parse(value, 'dd.MM.yyyy', new Date());
     if (isValid(parsed)) {
       setSelectedDate(parsed);
     }
   };
 
   const handleCalendarSelect = (date: Date | undefined) => {
     if (date) {
       setSelectedDate(date);
       setDateInputValue(format(date, 'dd.MM.yyyy'));
     }
   };
 
   const handleTimeSlotSelect = (time: string) => {
     setSelectedTime(time);
   };
 
   const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setSelectedTime(e.target.value);
   };
 
   const handleSubmit = () => {
     if (!title.trim()) return;
 
     const dueDate = new Date(selectedDate);
     const [hours, minutes] = selectedTime.split(':').map(Number);
     dueDate.setHours(hours || 0, minutes || 0, 0, 0);
 
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
         
         {/* Date input with calendar popup */}
         <Popover open={showDateTimePicker} onOpenChange={setShowDateTimePicker}>
           <PopoverTrigger asChild>
             <div className="flex items-center gap-1">
               <input
                 type="text"
                 value={dateInputValue}
                 onChange={handleDateChange}
                 onClick={(e) => e.stopPropagation()}
                 className="w-[90px] px-2 py-0.5 text-sm rounded-l border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--avivar-primary))]"
                 placeholder="dd.mm.aaaa"
               />
               <button
                 type="button"
                 className="px-1.5 py-0.5 rounded-r border border-l-0 border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-muted))] transition-colors"
               >
                 <CalendarIcon className="h-4 w-4" />
               </button>
             </div>
           </PopoverTrigger>
           <PopoverContent className="w-auto p-0" align="start" side="top">
             <div className="flex">
               {/* Calendar */}
               <Calendar
                 mode="single"
                 selected={selectedDate}
                 onSelect={handleCalendarSelect}
                 locale={ptBR}
                 className="p-2 pointer-events-auto"
               />
               {/* Time slots column */}
               <div className="border-l border-border">
                 <div className="px-2 py-1.5 border-b border-border">
                   <span className="text-xs font-medium text-muted-foreground">Horário</span>
                 </div>
                 <ScrollArea className="h-[260px]">
                   <div className="p-1">
                     {timeSlots.map((time) => (
                       <button
                         key={time}
                         onClick={() => handleTimeSlotSelect(time)}
                         className={cn(
                           "w-full text-left px-2 py-1 text-sm rounded transition-colors",
                           selectedTime === time
                             ? "bg-primary text-primary-foreground"
                             : "hover:bg-muted"
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
 
         {/* Time input (editable) with clock icon */}
         <div className="flex items-center">
           <input
             type="time"
             value={selectedTime}
             onChange={handleTimeChange}
             className="w-[75px] px-2 py-0.5 text-sm rounded-l border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-foreground))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--avivar-primary))]"
           />
           <span className="px-1.5 py-0.5 rounded-r border border-l-0 border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] text-[hsl(var(--avivar-muted-foreground))]">
             <Clock className="h-4 w-4" />
           </span>
         </div>
 
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