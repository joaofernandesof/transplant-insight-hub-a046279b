import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Calendar, Play, Search, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CallScriptView } from './CallScriptView';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  status: string;
}

interface AgendaTabProps {
  accountId: string | null;
}

export function AgendaTab({ accountId }: AgendaTabProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agendaId, setAgendaId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [activeScript, setActiveScript] = useState<{ summary: string; start: string } | null>(null);

  // Find the agenda connected to adm@ibramec.com (or the first connected agenda)
  useEffect(() => {
    if (!accountId) return;
    supabase
      .from('avivar_agendas')
      .select('id, google_connected, google_calendar_id, name')
      .eq('account_id', accountId)
      .eq('google_connected', true)
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Prefer agenda with "adm" or "ibramec" in name, fallback to first
          const preferred = data.find(a =>
            a.name?.toLowerCase().includes('adm') || a.name?.toLowerCase().includes('ibramec')
          ) || data[0];
          setAgendaId(preferred.id);
          setIsConnected(true);
        }
      });
  }, [accountId]);

  const fetchEvents = useCallback(async () => {
    if (!agendaId) return;
    setIsLoading(true);
    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase.functions.invoke('avivar-google-calendar', {
        body: {
          action: 'get_events',
          agenda_id: agendaId,
          time_min: timeMin,
          time_max: timeMax,
        },
      });
      if (error) throw error;
      if (data?.events) {
        setEvents(data.events.filter((e: CalendarEvent) => e.status !== 'cancelled'));
        toast.success(`${data.events.length} agendamentos carregados`);
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      toast.error('Erro ao buscar agendamentos: ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  }, [agendaId]);

  // Auto-fetch on mount
  useEffect(() => {
    if (agendaId) fetchEvents();
  }, [agendaId, fetchEvents]);

  if (activeScript) {
    return (
      <CallScriptView
        eventSummary={activeScript.summary}
        eventStart={activeScript.start}
        onBack={() => setActiveScript(null)}
      />
    );
  }

  const filtered = events.filter(e =>
    !search || e.summary?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by date
  const grouped: Record<string, CalendarEvent[]> = {};
  filtered.forEach(e => {
    const dateKey = new Date(e.start).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(e);
  });

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Nenhuma agenda Google Calendar conectada.
          </p>
          <p className="text-xs text-muted-foreground">
            Conecte uma agenda no módulo Avivar para puxar os agendamentos aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={fetchEvents} disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Puxar Agendamentos
        </Button>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar agendamento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="text-xs">{filtered.length} agendamentos</Badge>
      </div>

      {/* Events list */}
      <ScrollArea className="h-[calc(100vh-18rem)]">
        <div className="space-y-6 pr-3">
          {Object.entries(grouped).length === 0 && !isLoading && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {events.length === 0
                  ? 'Clique em "Puxar Agendamentos" para carregar os eventos do Google Calendar.'
                  : 'Nenhum agendamento encontrado com esse filtro.'}
              </CardContent>
            </Card>
          )}

          {Object.entries(grouped).map(([dateLabel, dateEvents]) => (
            <div key={dateLabel}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 capitalize">{dateLabel}</h3>
              <div className="space-y-2">
                {dateEvents.map(event => {
                  const startTime = new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const endTime = new Date(event.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{event.summary || 'Sem título'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{startTime} – {endTime}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="gap-1.5 shrink-0"
                          onClick={() => setActiveScript({ summary: event.summary || 'Reunião', start: event.start })}
                        >
                          <Play className="h-3.5 w-3.5" />
                          Iniciar Reunião
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
