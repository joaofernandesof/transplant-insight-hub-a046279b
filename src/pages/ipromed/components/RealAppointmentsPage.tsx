/**
 * IPROMED - Agenda Real (com banco de dados)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Video,
  Users,
  Gavel,
  Bell,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Appointment {
  id: string;
  client_id: string | null;
  case_id: string | null;
  title: string;
  description: string | null;
  appointment_type: string;
  start_datetime: string;
  end_datetime: string | null;
  all_day: boolean;
  location: string | null;
  is_virtual: boolean;
  meeting_url: string | null;
  status: string;
  priority: string;
  created_at: string;
  ipromed_legal_clients?: { name: string } | null;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  reuniao: { label: 'Reunião', icon: Users, color: 'bg-blue-500' },
  audiencia: { label: 'Audiência', icon: Gavel, color: 'bg-purple-500' },
  prazo: { label: 'Prazo', icon: Clock, color: 'bg-rose-500' },
  lembrete: { label: 'Lembrete', icon: Bell, color: 'bg-amber-500' },
  tarefa: { label: 'Tarefa', icon: CheckCircle2, color: 'bg-emerald-500' },
};

const priorityColors: Record<string, string> = {
  low: 'border-l-gray-400',
  normal: 'border-l-blue-400',
  high: 'border-l-amber-400',
  urgent: 'border-l-rose-500',
};

export default function RealAppointmentsPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    appointment_type: 'reuniao',
    start_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    all_day: false,
    location: '',
    is_virtual: false,
    meeting_url: '',
    client_id: '',
    priority: 'normal',
  });

  const queryClient = useQueryClient();
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch appointments for the week
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['ipromed-appointments', weekStart.toISOString()],
    queryFn: async () => {
      const weekEnd = addDays(weekStart, 7);
      
      const { data, error } = await supabase
        .from('ipromed_appointments')
        .select(`
          *,
          ipromed_legal_clients(name)
        `)
        .gte('start_datetime', weekStart.toISOString())
        .lt('start_datetime', weekEnd.toISOString())
        .order('start_datetime');

      if (error) throw error;
      return data as Appointment[];
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Create appointment
  const createAppointment = useMutation({
    mutationFn: async () => {
      const startDateTime = formData.all_day 
        ? `${formData.start_date}T00:00:00`
        : `${formData.start_date}T${formData.start_time}:00`;
      
      const endDateTime = formData.all_day
        ? null
        : `${formData.start_date}T${formData.end_time}:00`;

      const { error } = await supabase
        .from('ipromed_appointments')
        .insert([{
          title: formData.title,
          description: formData.description || null,
          appointment_type: formData.appointment_type,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          all_day: formData.all_day,
          location: formData.location || null,
          is_virtual: formData.is_virtual,
          meeting_url: formData.is_virtual ? formData.meeting_url : null,
          client_id: formData.client_id || null,
          priority: formData.priority,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-appointments'] });
      toast.success('Compromisso criado!');
      setIsFormOpen(false);
      setFormData({
        title: '',
        description: '',
        appointment_type: 'reuniao',
        start_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        all_day: false,
        location: '',
        is_virtual: false,
        meeting_url: '',
        client_id: '',
        priority: 'normal',
      });
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => 
    appointments.filter(apt => isSameDay(parseISO(apt.start_datetime), day));

  // Stats
  const stats = {
    total: appointments.length,
    reunioes: appointments.filter(a => a.appointment_type === 'reuniao').length,
    audiencias: appointments.filter(a => a.appointment_type === 'audiencia').length,
    prazos: appointments.filter(a => a.appointment_type === 'prazo').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Compromissos, audiências e prazos
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#0066CC]">
              <Plus className="h-4 w-4" />
              Novo Compromisso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Compromisso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do compromisso"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.appointment_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, appointment_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.all_day}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, all_day: !!v }))}
                />
                <Label>Dia inteiro</Label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                {!formData.all_day && (
                  <>
                    <div className="space-y-2">
                      <Label>Início</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim</Label>
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_virtual}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_virtual: !!v }))}
                />
                <Label>Reunião virtual</Label>
              </div>

              {formData.is_virtual ? (
                <div className="space-y-2">
                  <Label>Link da reunião</Label>
                  <Input
                    value={formData.meeting_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Endereço ou sala"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detalhes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => createAppointment.mutate()}
                  disabled={!formData.title || createAppointment.isPending}
                  className="bg-[#0066CC]"
                >
                  {createAppointment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Esta Semana</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#0066CC]/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#0066CC]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Reuniões</div>
                <div className="text-2xl font-bold text-blue-600">{stats.reunioes}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Audiências</div>
                <div className="text-2xl font-bold text-purple-600">{stats.audiencias}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Gavel className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Prazos</div>
                <div className="text-2xl font-bold text-rose-600">{stats.prazos}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Semana anterior
        </Button>
        <h2 className="text-lg font-semibold">
          {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd 'de' MMMM", { locale: ptBR })}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
          Próxima semana
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Week Calendar Grid */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 divide-x">
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div key={day.toISOString()} className="min-h-[300px]">
                    {/* Day Header */}
                    <div className={`p-3 text-center border-b ${isToday ? 'bg-[#0066CC]/10' : 'bg-gray-50'}`}>
                      <div className="text-xs text-muted-foreground uppercase">
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                      <div className={`text-lg font-semibold ${isToday ? 'text-[#0066CC]' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                    
                    {/* Appointments */}
                    <div className="p-2 space-y-2">
                      {dayAppointments.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-4">
                          Sem compromissos
                        </div>
                      ) : (
                        dayAppointments.map((apt) => {
                          const config = typeConfig[apt.appointment_type] || typeConfig.reuniao;
                          const Icon = config.icon;
                          
                          return (
                            <div 
                              key={apt.id}
                              className={`p-2 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${priorityColors[apt.priority]}`}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`w-5 h-5 rounded ${config.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                  <Icon className="h-3 w-3 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{apt.title}</p>
                                  {!apt.all_day && (
                                    <p className="text-[10px] text-muted-foreground">
                                      {format(parseISO(apt.start_datetime), 'HH:mm')}
                                      {apt.end_datetime && ` - ${format(parseISO(apt.end_datetime), 'HH:mm')}`}
                                    </p>
                                  )}
                                  {apt.ipromed_legal_clients?.name && (
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {apt.ipromed_legal_clients.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
