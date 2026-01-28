import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, ClipboardCheck, Bell, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  scheduled_at: string;
  appointment_type: string;
  status: string;
}

interface Document {
  id: string;
  file_name: string;
  category: string | null;
  created_at: string | null;
}

export default function NeoCareHome() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.userId) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    setIsLoading(true);
    try {
      // Buscar patient_id via portal_users
      const { data: portalUser } = await supabase
        .from('portal_users')
        .select('id')
        .eq('user_id', user?.userId)
        .single();

      if (portalUser) {
        const { data: patient } = await supabase
          .from('portal_patients')
          .select('id')
          .eq('portal_user_id', portalUser.id)
          .single();

        if (patient) {
          // Buscar agendamentos futuros
          const { data: appointments } = await supabase
            .from('portal_appointments')
            .select('id, scheduled_at, appointment_type, status')
            .eq('patient_id', patient.id)
            .gte('scheduled_at', new Date().toISOString())
            .neq('status', 'cancelled')
            .order('scheduled_at', { ascending: true })
            .limit(3);

          setUpcomingAppointments(appointments || []);

          // Buscar documentos recentes
          const { data: documents } = await supabase
            .from('portal_attachments')
            .select('id, file_name, category, created_at')
            .eq('patient_id', patient.id)
            .order('created_at', { ascending: false })
            .limit(3);

          setRecentDocuments(documents || []);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const quickActions = [
    { icon: Calendar, label: 'Agendar Consulta', path: '/neocare/appointments/new', color: 'bg-[hsl(var(--neocare-primary))]' },
    { icon: FileText, label: 'Meus Documentos', path: '/neocare/my-records', color: 'bg-emerald-500' },
    { icon: ClipboardCheck, label: 'Orientações', path: '/neocare/orientations', color: 'bg-purple-500' },
    { icon: Bell, label: 'Notícias', path: '/neocare/news', color: 'bg-orange-500' },
  ];

  const appointmentTypeLabels: Record<string, string> = {
    consultation: 'Consulta',
    return: 'Retorno',
    exam: 'Exame',
    procedure: 'Procedimento',
    hair_transplant: 'Transplante Capilar',
    prp: 'PRP Capilar',
  };

  const categoryLabels: Record<string, string> = {
    exame: 'Exame',
    laudo: 'Laudo',
    receita: 'Receita',
    atestado: 'Atestado',
    foto: 'Foto',
    outro: 'Documento',
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[hsl(152,69%,40%)] to-[hsl(152,60%,50%)] rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center text-2xl font-bold shrink-0">
          {user?.fullName?.charAt(0) || 'P'}
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {user?.fullName?.split(' ')[0] || 'Paciente'}!
          </h1>
          <p className="text-white/90">Bem-vindo ao seu Portal do Paciente</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.label}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(action.path)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center mb-3`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Suas consultas e procedimentos agendados</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/neocare/appointments')}>
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[hsl(var(--neocare-primary))]/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-[hsl(var(--neocare-primary))]" />
                    </div>
                    <div>
                      <p className="font-medium">{appointmentTypeLabels[apt.appointment_type] || apt.appointment_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(apt.scheduled_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[hsl(var(--neocare-primary))] border-[hsl(var(--neocare-primary))]">
                    Agendado
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você não tem agendamentos próximos</p>
              <Button className="mt-4 bg-[hsl(var(--neocare-primary))] hover:bg-[hsl(var(--neocare-primary))]/90" onClick={() => navigate('/neocare/appointments/new')}>
                Agendar Consulta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Documentos Recentes</CardTitle>
            <CardDescription>Seus últimos exames e laudos</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/neocare/my-records')}>
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => navigate('/neocare/my-records')}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.created_at && format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {categoryLabels[doc.category || 'outro'] || 'Documento'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento disponível</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>Você está em dia! Nenhuma notificação pendente.</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
