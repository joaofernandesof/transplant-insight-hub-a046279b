import { Navigate } from 'react-router-dom';
import { ModuleSidebar } from '@/components/ModuleSidebar';
import { SalaTecnicaCalendar } from '@/components/SalaTecnicaCalendar';
import { SalaTecnicaNotification } from '@/components/SalaTecnicaNotification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Calendar, Award } from 'lucide-react';
import { useAllSalaTecnicaMeetings, useIsLicensee } from '@/hooks/useSalaTecnica';

export default function SalaTecnica() {
  const isLicensee = useIsLicensee();
  const { data: allMeetings } = useAllSalaTecnicaMeetings();
  
  // Redirect non-licensees away from this page
  if (!isLicensee) {
    return <Navigate to="/" replace />;
  }
  
  const stats = {
    total: allMeetings?.length || 0,
    upcoming: allMeetings?.filter(m => m.meeting_date >= new Date().toISOString().split('T')[0]).length || 0,
    past: allMeetings?.filter(m => m.meeting_date < new Date().toISOString().split('T')[0]).length || 0,
  };

  return (
    <ModuleSidebar>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Video className="h-7 w-7 text-amber-500" />
            </div>
            Agenda do Licenciado
          </h1>
          <p className="text-muted-foreground">
            Eventos, mentorias e encontros exclusivos para licenciados ByNeoFolic
          </p>
        </div>

        {/* Thursday Notification */}
        <SalaTecnicaNotification />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.upcoming}</p>
                  <p className="text-xs text-muted-foreground">Próximas reuniões</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Video className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.past}</p>
                  <p className="text-xs text-muted-foreground">Realizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Users className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-xs text-muted-foreground">Mentores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Award className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">19h</p>
                  <p className="text-xs text-muted-foreground">Horário fixo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mentors */}
        <Card className="border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Equipe de Mentores</CardTitle>
            <CardDescription>
              Especialistas do IBRAMEC que conduzem as mentorias semanais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                👨‍⚕️ Dr. Hygor
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                👩‍💼 Larissa
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                👨‍💻 João
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                👩‍🔬 Edith
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <SalaTecnicaCalendar />
      </div>
    </ModuleSidebar>
  );
}
