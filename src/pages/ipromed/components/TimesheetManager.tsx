/**
 * IPROMED - Timesheet / Controle de Tempo
 * Cronômetro, registro de horas e produtividade
 */

import { useState, useEffect, useRef } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Play,
  Pause,
  Square,
  Clock,
  Plus,
  Calendar,
  DollarSign,
  Timer,
  Loader2,
  Trash2,
} from "lucide-react";
import { format, differenceInMinutes, differenceInSeconds } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TimesheetEntry {
  id: string;
  client_id: string | null;
  case_id: string | null;
  description: string;
  activity_type: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_running: boolean;
  is_billable: boolean;
  hourly_rate: number | null;
  total_value: number | null;
  created_at: string;
  ipromed_legal_clients?: { name: string } | null;
  ipromed_legal_cases?: { title: string } | null;
}

const activityTypes: Record<string, { label: string; color: string }> = {
  atendimento: { label: 'Atendimento', color: 'bg-blue-100 text-blue-700' },
  reuniao: { label: 'Reunião', color: 'bg-purple-100 text-purple-700' },
  pesquisa: { label: 'Pesquisa', color: 'bg-cyan-100 text-cyan-700' },
  elaboracao: { label: 'Elaboração', color: 'bg-amber-100 text-amber-700' },
  audiencia: { label: 'Audiência', color: 'bg-rose-100 text-rose-700' },
  deslocamento: { label: 'Deslocamento', color: 'bg-gray-100 text-gray-700' },
};

export default function TimesheetManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [runningEntry, setRunningEntry] = useState<TimesheetEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [formData, setFormData] = useState({
    description: '',
    activity_type: 'atendimento',
    client_id: '',
    case_id: '',
    is_billable: true,
    hourly_rate: '250',
    manual_duration: '',
  });

  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ipromed-timesheets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_timesheets')
        .select(`
          *,
          ipromed_legal_clients(name),
          ipromed_legal_cases(title)
        `)
        .order('start_time', { ascending: false })
        .limit(50);
      if (error) throw error;
      
      // Find running entry
      const running = data?.find(e => e.is_running);
      if (running) {
        setRunningEntry(running as TimesheetEntry);
      }
      
      return data as TimesheetEntry[];
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-dropdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  // Timer effect
  useEffect(() => {
    if (runningEntry) {
      const updateTimer = () => {
        const seconds = differenceInSeconds(new Date(), new Date(runningEntry.start_time));
        setElapsedTime(seconds);
      };
      
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setElapsedTime(0);
    }
  }, [runningEntry]);

  // Start timer
  const startTimer = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_timesheets')
        .insert([{
          description: formData.description || 'Atividade em andamento',
          activity_type: formData.activity_type,
          client_id: formData.client_id || null,
          case_id: formData.case_id || null,
          start_time: new Date().toISOString(),
          is_running: true,
          is_billable: formData.is_billable,
          hourly_rate: formData.is_billable ? parseFloat(formData.hourly_rate) : null,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setRunningEntry(data as TimesheetEntry);
      queryClient.invalidateQueries({ queryKey: ['ipromed-timesheets'] });
      toast.success('Cronômetro iniciado!');
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao iniciar: ' + error.message);
    },
  });

  // Stop timer
  const stopTimer = useMutation({
    mutationFn: async () => {
      if (!runningEntry) return;
      
      const endTime = new Date();
      const durationMinutes = differenceInMinutes(endTime, new Date(runningEntry.start_time));
      const totalValue = runningEntry.is_billable && runningEntry.hourly_rate
        ? (durationMinutes / 60) * runningEntry.hourly_rate
        : null;
      
      const { error } = await supabase
        .from('ipromed_timesheets')
        .update({
          end_time: endTime.toISOString(),
          is_running: false,
          duration_minutes: durationMinutes,
          total_value: totalValue,
        })
        .eq('id', runningEntry.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      setRunningEntry(null);
      queryClient.invalidateQueries({ queryKey: ['ipromed-timesheets'] });
      toast.success('Tempo registrado!');
    },
  });

  // Manual entry
  const addManualEntry = useMutation({
    mutationFn: async () => {
      const durationMinutes = parseInt(formData.manual_duration) || 0;
      const totalValue = formData.is_billable && durationMinutes > 0
        ? (durationMinutes / 60) * parseFloat(formData.hourly_rate)
        : null;
      
      const { error } = await supabase
        .from('ipromed_timesheets')
        .insert([{
          description: formData.description,
          activity_type: formData.activity_type,
          client_id: formData.client_id || null,
          case_id: formData.case_id || null,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          is_running: false,
          is_billable: formData.is_billable,
          hourly_rate: formData.is_billable ? parseFloat(formData.hourly_rate) : null,
          duration_minutes: durationMinutes,
          total_value: totalValue,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-timesheets'] });
      toast.success('Tempo registrado!');
      setIsFormOpen(false);
      setFormData({
        description: '',
        activity_type: 'atendimento',
        client_id: '',
        case_id: '',
        is_billable: true,
        hourly_rate: '250',
        manual_duration: '',
      });
    },
  });

  // Delete entry
  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ipromed_timesheets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-timesheets'] });
      toast.success('Registro removido');
    },
  });

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // Stats
  const todayEntries = entries.filter(e => 
    format(new Date(e.start_time), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );
  const todayMinutes = todayEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const todayBillable = todayEntries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.total_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Timer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Timesheet</h1>
          <p className="text-sm text-muted-foreground">
            Controle de tempo e produtividade
          </p>
        </div>
        
        {runningEntry ? (
          <Card className="border-0 shadow-lg bg-[#0066CC] text-white">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="animate-pulse">
                <div className="h-3 w-3 bg-white rounded-full" />
              </div>
              <div>
                <div className="text-sm opacity-80">Em andamento</div>
                <div className="text-2xl font-mono font-bold">
                  {formatDuration(elapsedTime)}
                </div>
                <div className="text-xs opacity-80">{runningEntry.description}</div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => stopTimer.mutate()}
                className="ml-4"
              >
                <Square className="h-4 w-4 mr-1" />
                Parar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#0066CC]">
                <Play className="h-4 w-4" />
                Iniciar Cronômetro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Tempo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="O que você está fazendo?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Atividade</Label>
                    <Select
                      value={formData.activity_type}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, activity_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(activityTypes).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.is_billable}
                      onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_billable: !!v }))}
                    />
                    <Label>Faturável</Label>
                  </div>
                  {formData.is_billable && (
                    <div className="flex items-center gap-2">
                      <Label>R$/h:</Label>
                      <Input
                        type="number"
                        className="w-24"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                      />
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Ou registrar manualmente:</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder="Minutos"
                      value={formData.manual_duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, manual_duration: e.target.value }))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">minutos</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancelar
                  </Button>
                  {formData.manual_duration ? (
                    <Button 
                      onClick={() => addManualEntry.mutate()}
                      disabled={!formData.description}
                      className="bg-[#0066CC]"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Registrar Manual
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => startTimer.mutate()}
                      className="bg-[#0066CC]"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Hoje</div>
                <div className="text-2xl font-bold">{formatMinutes(todayMinutes)}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#0066CC]/10 flex items-center justify-center">
                <Timer className="h-5 w-5 text-[#0066CC]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Faturável Hoje</div>
                <div className="text-2xl font-bold text-emerald-600">
                  R$ {todayBillable.toFixed(2)}
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Registros Hoje</div>
                <div className="text-2xl font-bold">{todayEntries.length}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Total Registros</div>
                <div className="text-2xl font-bold">{entries.length}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Registros Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Clock className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium">Nenhum registro</p>
              <p className="text-sm">Inicie o cronômetro para registrar seu tempo</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="text-xs font-semibold">DATA</TableHead>
                  <TableHead className="text-xs font-semibold">DESCRIÇÃO</TableHead>
                  <TableHead className="text-xs font-semibold">TIPO</TableHead>
                  <TableHead className="text-xs font-semibold">CLIENTE</TableHead>
                  <TableHead className="text-xs font-semibold">DURAÇÃO</TableHead>
                  <TableHead className="text-xs font-semibold">VALOR</TableHead>
                  <TableHead className="text-xs font-semibold w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const type = activityTypes[entry.activity_type] || activityTypes.atendimento;
                  
                  return (
                    <TableRow key={entry.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {format(new Date(entry.start_time), 'dd/MM HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.is_running && (
                            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                          )}
                          <span className="text-sm">{entry.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={type.color}>{type.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.ipromed_legal_clients?.name || '-'}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {entry.is_running ? (
                          <span className="text-emerald-600">Em andamento</span>
                        ) : (
                          formatMinutes(entry.duration_minutes)
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.is_billable && entry.total_value ? (
                          <span className="text-emerald-600">
                            R$ {entry.total_value.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600"
                          onClick={() => deleteEntry.mutate(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
