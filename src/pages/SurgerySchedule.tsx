import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Phone,
  Stethoscope,
} from "lucide-react";
import { ModuleSidebar } from "@/components/ModuleSidebar";
import { useSurgerySchedule } from "@/hooks/useSurgerySchedule";
import { SurgeryTable } from "@/components/surgery/SurgeryTable";
import { SurgeryDialog } from "@/components/surgery/SurgeryDialog";
import { SurgeryCalendarView } from "@/components/surgery/SurgeryCalendarView";
import { format, parseISO, isToday, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SurgerySchedule() {
  const { user } = useAuth();
  const { surgeries, isLoading, stats, createSurgery, updateSurgery, deleteSurgery } = useSurgerySchedule();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState<any>(null);
  const [activeView, setActiveView] = useState<"table" | "calendar">("table");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "upcoming" | "past">("all");

  const filteredSurgeries = surgeries.filter(surgery => {
    const matchesSearch = surgery.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surgery.patient_phone?.includes(searchTerm) ||
      surgery.companion_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const surgeryDate = parseISO(surgery.surgery_date);
      if (dateFilter === "today") matchesDate = isToday(surgeryDate);
      else if (dateFilter === "upcoming") matchesDate = isFuture(surgeryDate);
      else if (dateFilter === "past") matchesDate = isPast(surgeryDate) && !isToday(surgeryDate);
    }
    
    return matchesSearch && matchesDate;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleEdit = (surgery: any) => {
    setEditingSurgery(surgery);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingSurgery(null);
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingSurgery) {
      await updateSurgery.mutateAsync({ id: editingSurgery.id, ...data });
    } else {
      await createSurgery.mutateAsync({ ...data, user_id: user?.id });
    }
    setDialogOpen(false);
    setEditingSurgery(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta cirurgia?')) {
      await deleteSurgery.mutateAsync(id);
    }
  };

  return (
    <ModuleSidebar>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Agenda de Cirurgias
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gerencie todas as cirurgias da sua clínica
              </p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Cirurgia
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
                <p className="text-xl font-bold mt-1">{stats.totalSurgeries}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Confirmadas</span>
                </div>
                <p className="text-xl font-bold mt-1">{stats.confirmedSurgeries}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-muted-foreground">Sem Exames</span>
                </div>
                <p className="text-xl font-bold mt-1">{stats.pendingExams}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-muted-foreground">VGV Total</span>
                </div>
                <p className="text-lg font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-muted-foreground">Upgrade</span>
                </div>
                <p className="text-lg font-bold mt-1">{formatCurrency(stats.upgradeTotal)}</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-rose-600" />
                  <span className="text-xs text-muted-foreground">Saldo Devedor</span>
                </div>
                <p className="text-lg font-bold mt-1">{formatCurrency(stats.totalBalanceDue)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por paciente, telefone ou acompanhante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={dateFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("all")}
                  >
                    Todas
                  </Button>
                  <Button
                    variant={dateFilter === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("today")}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant={dateFilter === "upcoming" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("upcoming")}
                  >
                    Futuras
                  </Button>
                  <Button
                    variant={dateFilter === "past" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateFilter("past")}
                  >
                    Passadas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* View Toggle */}
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "table" | "calendar")} className="space-y-4">
            <TabsList>
              <TabsTrigger value="table" className="gap-2">
                <FileText className="h-4 w-4" />
                Tabela
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendário
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <SurgeryTable
                surgeries={filteredSurgeries}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdate={updateSurgery.mutateAsync}
              />
            </TabsContent>

            <TabsContent value="calendar">
              <SurgeryCalendarView
                surgeries={filteredSurgeries}
                onSelectSurgery={handleEdit}
              />
            </TabsContent>
          </Tabs>

          {/* Surgery Dialog */}
          <SurgeryDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            surgery={editingSurgery}
            onSave={handleSave}
            isLoading={createSurgery.isPending || updateSurgery.isPending}
          />
        </div>
      </div>
    </ModuleSidebar>
  );
}
