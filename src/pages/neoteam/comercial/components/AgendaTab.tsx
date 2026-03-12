import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Calendar, Play, Search, Clock, User, Plus, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CallScriptView } from './CallScriptView';
import { useGoogleCalendarConnect } from '@/hooks/useGoogleCalendarConnect';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  const { user } = useUnifiedAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agendaId, setAgendaId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [activeScript, setActiveScript] = useState<{ summary: string; start: string } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAgendaName, setNewAgendaName] = useState('Agenda Comercial');
  const [isCreating, setIsCreating] = useState(false);
  const [allAgendas, setAllAgendas] = useState<Array<{ id: string; name: string; google_connected: boolean; google_calendar_name: string | null }>>([]);

  const {
    connectGoogle,
    isConnecting,
    disconnectGoogle,
  } = useGoogleCalendarConnect(agendaId);

  // Load all agendas for this account
  useEffect(() => {
    if (!accountId) return;
    supabase
      .from('avivar_agendas')
      .select('id, google_connected, google_calendar_id, google_calendar_name, name')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setAllAgendas(data);
          const connected = data.filter(a => a.google_connected);
          if (connected.length > 0) {
            const preferred = connected.find(a =>
              a.name?.toLowerCase().includes('adm') || a.name?.toLowerCase().includes('ibramec')
            ) || connected[0];
            setAgendaId(preferred.id);
            setIsConnected(true);
          }
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

  useEffect(() => {
    if (agendaId && isConnected) fetchEvents();
  }, [agendaId, isConnected, fetchEvents]);

  const handleCreateAndConnect = async () => {
    if (!accountId || !user?.authUserId || !newAgendaName.trim()) return;
    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('avivar_agendas')
        .insert({
          name: newAgendaName.trim(),
          user_id: user.authUserId,
          account_id: accountId,
        })
        .select('id')
        .single();

      if (error) throw error;

      setAgendaId(data.id);
      setShowCreateDialog(false);

      // Small delay to let state propagate, then trigger OAuth
      setTimeout(() => {
        const redirectUri = `${window.location.origin}/avivar/google-callback`;
        supabase.functions.invoke('avivar-google-calendar', {
          body: {
            action: 'get_auth_url',
            redirect_uri: redirectUri,
            agenda_id: data.id,
          },
        }).then(({ data: authData, error: authError }) => {
          if (authError) throw authError;
          if (authData?.url) {
            sessionStorage.setItem('google_calendar_agenda_id', data.id);
            window.location.href = authData.url;
          }
        }).catch(err => {
          console.error('Error starting Google auth:', err);
          toast.error('Erro ao iniciar conexão com Google');
        });
      }, 100);
    } catch (err: any) {
      console.error('Error creating agenda:', err);
      toast.error('Erro ao criar agenda: ' + (err.message || ''));
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectExisting = async (id: string) => {
    setAgendaId(id);
    setTimeout(() => {
      const redirectUri = `${window.location.origin}/avivar/google-callback`;
      supabase.functions.invoke('avivar-google-calendar', {
        body: {
          action: 'get_auth_url',
          redirect_uri: redirectUri,
          agenda_id: id,
        },
      }).then(({ data: authData, error: authError }) => {
        if (authError) throw authError;
        if (authData?.url) {
          sessionStorage.setItem('google_calendar_agenda_id', id);
          window.location.href = authData.url;
        }
      }).catch(err => {
        console.error('Error starting Google auth:', err);
        toast.error('Erro ao iniciar conexão com Google');
      });
    }, 100);
  };

  const handleDisconnect = async () => {
    await disconnectGoogle();
    setIsConnected(false);
    setEvents([]);
  };

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

  const grouped: Record<string, CalendarEvent[]> = {};
  filtered.forEach(e => {
    const dateKey = new Date(e.start).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(e);
  });

  const disconnectedAgendas = allAgendas.filter(a => !a.google_connected);

  if (!isConnected) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <div className="space-y-1">
              <p className="text-muted-foreground font-medium">
                Nenhuma agenda Google Calendar conectada.
              </p>
              <p className="text-xs text-muted-foreground">
                Conecte sua agenda do Google para visualizar seus compromissos e iniciar calls com o script guiado.
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 pt-2">
              {disconnectedAgendas.length > 0 && (
                <div className="space-y-2 w-full max-w-sm">
                  <p className="text-xs text-muted-foreground font-medium">Agendas existentes:</p>
                  {disconnectedAgendas.map(a => (
                    <Button
                      key={a.id}
                      variant="outline"
                      className="w-full gap-2 justify-start"
                      onClick={() => handleConnectExisting(a.id)}
                    >
                      <Calendar className="h-4 w-4" />
                      Conectar "{a.name}"
                    </Button>
                  ))}
                </div>
              )}

              <Button
                className="gap-2"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Criar e Conectar Nova Agenda
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Conectar Google Agenda
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome da agenda</Label>
                <Input
                  value={newAgendaName}
                  onChange={e => setNewAgendaName(e.target.value)}
                  placeholder="Ex: Agenda Comercial"
                />
                <p className="text-xs text-muted-foreground">
                  Esse é o nome interno. Após criar, você será redirecionado para autorizar o Google Calendar.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button
                onClick={handleCreateAndConnect}
                disabled={isCreating || !newAgendaName.trim()}
                className="gap-2"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                Conectar com Google
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const currentAgenda = allAgendas.find(a => a.id === agendaId);

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
        {currentAgenda && (
          <Badge variant="secondary" className="text-xs gap-1.5">
            <Calendar className="h-3 w-3" />
            {currentAgenda.google_calendar_name || currentAgenda.name}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-destructive hover:text-destructive"
          onClick={handleDisconnect}
        >
          <Unlink className="h-3.5 w-3.5" />
          Desconectar
        </Button>
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
