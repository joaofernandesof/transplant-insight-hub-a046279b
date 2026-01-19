import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MarketplaceLayout } from "../components/MarketplaceLayout";
import { MarketplaceHeader } from "../components/MarketplaceHeader";
import { toast } from "sonner";

interface TimeSlot {
  time: string;
  available: boolean;
  appointment?: {
    patientName: string;
    procedure: string;
  };
}

const mockSlots: TimeSlot[] = [
  { time: "08:00", available: true },
  { time: "08:30", available: false, appointment: { patientName: "João Silva", procedure: "Consulta" } },
  { time: "09:00", available: true },
  { time: "09:30", available: true },
  { time: "10:00", available: false, appointment: { patientName: "Maria Santos", procedure: "Transplante FUE" } },
  { time: "10:30", available: false, appointment: { patientName: "Maria Santos", procedure: "Transplante FUE" } },
  { time: "11:00", available: false, appointment: { patientName: "Maria Santos", procedure: "Transplante FUE" } },
  { time: "11:30", available: true },
  { time: "14:00", available: true },
  { time: "14:30", available: true },
  { time: "15:00", available: false, appointment: { patientName: "Pedro Costa", procedure: "Retorno" } },
  { time: "15:30", available: true },
  { time: "16:00", available: true },
  { time: "16:30", available: true },
];

export function MarketplaceSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week">("day");

  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfWeek(selectedDate, { weekStartsOn: 0 }), i)
  );

  return (
    <MarketplaceLayout>
      <MarketplaceHeader
        title="Agenda"
        subtitle="Visualize e gerencie agendamentos"
        actions={
          <Button
            className="bg-marketplace hover:bg-marketplace/90"
            onClick={() => toast.info("Novo agendamento em desenvolvimento")}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Agendamento</span>
          </Button>
        }
      />

      <div className="p-4 sm:p-6">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Calendar Sidebar */}
          <div className="space-y-4">
            <Card className="border-marketplace-border">
              <CardContent className="p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </CardContent>
            </Card>

            {/* View Toggle */}
            <div className="flex border rounded-lg p-1">
              <Button
                variant={view === "day" ? "secondary" : "ghost"}
                className="flex-1"
                onClick={() => setView("day")}
              >
                Dia
              </Button>
              <Button
                variant={view === "week" ? "secondary" : "ghost"}
                className="flex-1"
                onClick={() => setView("week")}
              >
                Semana
              </Button>
            </div>

            {/* Quick Stats */}
            <Card className="border-marketplace-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resumo do Dia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Agendamentos</span>
                  <Badge variant="secondary">4</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Horários livres</span>
                  <Badge variant="outline" className="text-marketplace-accent">
                    8
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxa ocupação</span>
                  <Badge>33%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule View */}
          <Card className="border-marketplace-border">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setSelectedDate((d) => addDays(d, view === "day" ? -1 : -7))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-lg">
                    {view === "day"
                      ? format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                      : `Semana de ${format(weekDays[0], "dd/MM")} a ${format(
                          weekDays[6],
                          "dd/MM"
                        )}`}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setSelectedDate((d) => addDays(d, view === "day" ? 1 : 7))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Hoje
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {view === "day" ? (
                <div className="space-y-2">
                  {mockSlots.map((slot, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                        slot.available
                          ? "border-dashed border-marketplace-border hover:border-marketplace hover:bg-marketplace/5 cursor-pointer"
                          : "border-marketplace-border bg-muted/30"
                      }`}
                      onClick={() =>
                        slot.available &&
                        toast.info(`Agendar horário ${slot.time}`)
                      }
                    >
                      <div className="flex items-center gap-2 w-16 text-sm font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {slot.time}
                      </div>

                      {slot.appointment ? (
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {slot.appointment.patientName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {slot.appointment.procedure}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 text-sm text-muted-foreground">
                          Horário disponível
                        </div>
                      )}

                      <Badge
                        variant={slot.available ? "outline" : "secondary"}
                        className={
                          slot.available
                            ? "text-marketplace-accent border-marketplace-accent"
                            : ""
                        }
                      >
                        {slot.available ? "Livre" : "Ocupado"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                        isSameDay(day, selectedDate)
                          ? "border-marketplace bg-marketplace/10"
                          : "border-marketplace-border hover:border-marketplace/50"
                      }`}
                      onClick={() => {
                        setSelectedDate(day);
                        setView("day");
                      }}
                    >
                      <p className="text-xs text-muted-foreground">
                        {format(day, "EEE", { locale: ptBR })}
                      </p>
                      <p className="text-lg font-semibold">{format(day, "dd")}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        3 ag.
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
