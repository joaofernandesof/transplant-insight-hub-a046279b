/**
 * Google Calendar OAuth Callback Page
 * Handles the redirect from Google after user authorizes
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  backgroundColor?: string;
}

export default function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'pick_calendar' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const code = searchParams.get('code');
  const agendaId = searchParams.get('state') || sessionStorage.getItem('google_calendar_agenda_id');

  useEffect(() => {
    async function handleCallback() {
      if (!code || !agendaId) {
        setStatus('error');
        setErrorMessage('Parâmetros de autorização inválidos');
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/avivar/google-callback`;
        
        const { data, error } = await supabase.functions.invoke('avivar-google-calendar', {
          body: {
            action: 'exchange_code',
            code,
            redirect_uri: redirectUri,
            agenda_id: agendaId,
          },
        });

        if (error) throw error;

        if (data?.calendars?.length) {
          setCalendars(data.calendars);
          setSelectedCalendar(data.calendars.find((c: GoogleCalendar) => c.primary)?.id || data.calendars[0].id);
          setStatus('pick_calendar');
        } else {
          setStatus('error');
          setErrorMessage('Nenhum calendário encontrado na sua conta Google');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage('Erro ao conectar com o Google Calendar');
      }
    }

    handleCallback();
  }, [code, agendaId]);

  async function handleSelectCalendar() {
    if (!selectedCalendar || !agendaId) return;

    setIsSaving(true);
    try {
      const cal = calendars.find(c => c.id === selectedCalendar);
      
      const { error } = await supabase.functions.invoke('avivar-google-calendar', {
        body: {
          action: 'select_calendar',
          agenda_id: agendaId,
          calendar_id: selectedCalendar,
          calendar_name: cal?.summary || '',
        },
      });

      if (error) throw error;

      sessionStorage.removeItem('google_calendar_agenda_id');
      setStatus('success');
      toast.success(`Calendário "${cal?.summary}" conectado!`);
      
      setTimeout(() => navigate('/avivar/agenda'), 2000);
    } catch (error) {
      console.error('Error selecting calendar:', error);
      toast.error('Erro ao salvar calendário');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Google Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Conectando ao Google Calendar...</p>
            </div>
          )}

          {status === 'pick_calendar' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione qual calendário do Google será usado para sincronizar os agendamentos:
              </p>
              
              <RadioGroup value={selectedCalendar} onValueChange={setSelectedCalendar}>
                {calendars.map((cal) => (
                  <div key={cal.id} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50">
                    <RadioGroupItem value={cal.id} id={cal.id} />
                    <Label htmlFor={cal.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        {cal.backgroundColor && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cal.backgroundColor }} 
                          />
                        )}
                        <span className="font-medium">{cal.summary}</span>
                        {cal.primary && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Principal</span>
                        )}
                      </div>
                      {cal.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{cal.description}</p>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button 
                onClick={handleSelectCalendar} 
                disabled={!selectedCalendar || isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Conectar este calendário'
                )}
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium">Conectado com sucesso!</p>
              <p className="text-sm text-muted-foreground">Redirecionando para a agenda...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="font-medium">Erro na conexão</p>
              <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
              <Button variant="outline" onClick={() => navigate('/avivar/agenda')}>
                Voltar para a agenda
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
