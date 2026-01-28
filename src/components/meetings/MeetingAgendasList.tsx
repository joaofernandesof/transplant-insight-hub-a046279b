import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  MoreHorizontal,
  Trash2,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMeetingAgendas, MeetingAgenda, useMeetingAgendaItems } from "@/hooks/useMeetingAgenda";
import { CreateAgendaDialog } from "./CreateAgendaDialog";
import { MeetingAgendaModal } from "./MeetingAgendaModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AgendaCardProps {
  agenda: MeetingAgenda;
  onOpen: () => void;
  onDelete: () => void;
}

function AgendaCard({ agenda, onOpen, onDelete }: AgendaCardProps) {
  // Get items count for this agenda
  const { items, stats } = useMeetingAgendaItems(agenda.id);

  const statusConfig = {
    pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    em_andamento: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    concluida: { label: 'Concluída', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  };

  const status = statusConfig[agenda.status as keyof typeof statusConfig] || statusConfig.pendente;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all group"
      onClick={onOpen}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{agenda.title}</h3>
            {agenda.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {agenda.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                <Eye className="h-4 w-4 mr-2" />
                Abrir
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="secondary" className={cn("text-xs", status.color)}>
            {status.label}
          </Badge>
          
          {agenda.meeting_date && (
            <Badge variant="outline" className="text-xs gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(agenda.meeting_date + 'T00:00:00'), "dd/MM", { locale: ptBR })}
            </Badge>
          )}

          {stats && stats.total > 0 && (
            <Badge variant="outline" className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {stats.completed}/{stats.total}
            </Badge>
          )}
        </div>

        {stats && stats.total > 0 && (
          <div className="mt-3">
            <Progress value={stats.percentage} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MeetingAgendasList() {
  const { data: agendas, isLoading } = useMeetingAgendas();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAgendaId, setSelectedAgendaId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const selectedAgenda = agendas?.find(a => a.id === selectedAgendaId);

  const handleDelete = async (agendaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pauta?')) return;

    const { error } = await supabase
      .from('meeting_agendas')
      .delete()
      .eq('id', agendaId);

    if (error) {
      toast.error('Erro ao excluir pauta');
    } else {
      toast.success('Pauta excluída');
      queryClient.invalidateQueries({ queryKey: ['meeting-agendas'] });
    }
  };

  const pendingAgendas = agendas?.filter(a => a.status !== 'concluida') || [];
  const completedAgendas = agendas?.filter(a => a.status === 'concluida') || [];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              📋 Pautas de Reunião
            </CardTitle>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Pauta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : agendas && agendas.length > 0 ? (
            <div className="space-y-4">
              {pendingAgendas.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 text-muted-foreground">
                    Próximas ({pendingAgendas.length})
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {pendingAgendas.map((agenda) => (
                      <AgendaCard
                        key={agenda.id}
                        agenda={agenda}
                        onOpen={() => setSelectedAgendaId(agenda.id)}
                        onDelete={() => handleDelete(agenda.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {completedAgendas.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 text-muted-foreground">
                    Concluídas ({completedAgendas.length})
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {completedAgendas.slice(0, 4).map((agenda) => (
                      <AgendaCard
                        key={agenda.id}
                        agenda={agenda}
                        onOpen={() => setSelectedAgendaId(agenda.id)}
                        onDelete={() => handleDelete(agenda.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma pauta criada ainda
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira pauta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateAgendaDialog
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreated={(agendaId) => {
          setIsCreating(false);
          setSelectedAgendaId(agendaId);
        }}
      />

      {/* View Modal */}
      {selectedAgendaId && (
        <MeetingAgendaModal
          isOpen={!!selectedAgendaId}
          onClose={() => setSelectedAgendaId(null)}
          agendaId={selectedAgendaId}
          agendaTitle={selectedAgenda?.title}
          agendaDate={selectedAgenda?.meeting_date 
            ? format(new Date(selectedAgenda.meeting_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })
            : undefined
          }
        />
      )}
    </>
  );
}
