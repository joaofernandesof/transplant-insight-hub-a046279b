import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Plus,
  Table2,
  LayoutGrid,
  LayoutList,
  Stethoscope,
} from "lucide-react";
import { ModuleSidebar } from "@/components/ModuleSidebar";
import { useSurgerySchedule, SurgerySchedule as SurgeryType } from "@/hooks/useSurgerySchedule";
import { 
  SurgeryTable, 
  SurgeryDialog, 
  SurgeryCalendarView, 
  SurgeryDashboardCards,
  SurgeryFilters,
  SurgeryDetailPanel,
  SurgeryKanban,
} from "@/components/surgery";
import { parseISO, isToday, isFuture, isPast, isWithinInterval, addDays, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

export default function SurgerySchedule() {
  const { user } = useAuth();
  const { surgeries, isLoading, stats, createSurgery, updateSurgery, deleteSurgery } = useSurgerySchedule();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "upcoming" | "past" | "week" | "month">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Dialog/panel states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState<SurgeryType | null>(null);
  const [editingSurgery, setEditingSurgery] = useState<SurgeryType | null>(null);
  
  // View state
  const [activeView, setActiveView] = useState<"table" | "calendar" | "kanban">("kanban");

  // Enhanced filtering logic
  const filteredSurgeries = useMemo(() => {
    return surgeries.filter(surgery => {
      // Search filter
      const matchesSearch = 
        surgery.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surgery.patient_phone?.includes(searchTerm) ||
        surgery.companion_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surgery.medical_record?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Date filter
      const surgeryDate = parseISO(surgery.surgery_date);
      let matchesDate = true;
      
      if (dateRange?.from) {
        matchesDate = isWithinInterval(surgeryDate, {
          start: dateRange.from,
          end: dateRange.to || dateRange.from,
        });
      } else {
        switch (dateFilter) {
          case "today":
            matchesDate = isToday(surgeryDate);
            break;
          case "upcoming":
            matchesDate = isFuture(surgeryDate);
            break;
          case "past":
            matchesDate = isPast(surgeryDate) && !isToday(surgeryDate);
            break;
          case "week":
            matchesDate = isWithinInterval(surgeryDate, {
              start: new Date(),
              end: addDays(new Date(), 7),
            });
            break;
          case "month":
            matchesDate = isWithinInterval(surgeryDate, {
              start: new Date(),
              end: addDays(new Date(), 30),
            });
            break;
        }
      }
      
      if (!matchesDate) return false;

      // Category filter
      if (categoryFilter !== "all") {
        if (!surgery.category?.startsWith(categoryFilter)) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        switch (statusFilter) {
          case "confirmed":
            if (!surgery.confirmed) return false;
            break;
          case "pending_confirmation":
            if (surgery.confirmed) return false;
            break;
          case "pending_exams":
            if (surgery.exams_sent) return false;
            break;
          case "pending_contract":
            if (surgery.contract_signed) return false;
            break;
          case "pending_payment":
            if (surgery.balance_due <= 0) return false;
            break;
        }
      }

      return true;
    });
  }, [surgeries, searchTerm, dateFilter, categoryFilter, statusFilter, dateRange]);

  // Enhanced stats
  const enhancedStats = useMemo(() => {
    const thisMonth = surgeries.filter(s => {
      const date = parseISO(s.surgery_date);
      return isWithinInterval(date, {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      });
    });

    const withContractSigned = surgeries.filter(s => s.contract_signed).length;

    return {
      ...stats,
      surgeriesThisMonth: thisMonth.length,
      surgeriesWithContractSigned: withContractSigned,
    };
  }, [surgeries, stats]);

  const handleSelectSurgery = (surgery: SurgeryType) => {
    setSelectedSurgery(surgery);
    setDetailPanelOpen(true);
  };

  const handleEdit = (surgery?: SurgeryType) => {
    setEditingSurgery(surgery || selectedSurgery);
    setDetailPanelOpen(false);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingSurgery(null);
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingSurgery) {
        await updateSurgery.mutateAsync({ id: editingSurgery.id, ...data });
      } else {
        await createSurgery.mutateAsync({ ...data, user_id: user?.id });
      }
      setDialogOpen(false);
      setEditingSurgery(null);
    } catch (error) {
      console.error("Error saving surgery:", error);
    }
  };

  const handleDelete = async (id?: string) => {
    const surgeryId = id || selectedSurgery?.id;
    if (!surgeryId) return;

    if (confirm('Tem certeza que deseja excluir esta cirurgia?')) {
      await deleteSurgery.mutateAsync(surgeryId);
      setDetailPanelOpen(false);
      setSelectedSurgery(null);
    }
  };

  const handleViewPatient = (patientId: string) => {
    // TODO: Navigate to patient prontuário
    toast.info("Navegando para prontuário do paciente...", {
      description: `Prontuário: ${patientId}`,
    });
  };

  return (
    <ModuleSidebar>
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6 space-y-6 w-full overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-primary" />
                Agenda NeoCirurgias
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Tudo pronto para a cirurgia. Gerencie com confiança.
              </p>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Cirurgia
            </Button>
          </div>

          {/* Dashboard Cards */}
          <SurgeryDashboardCards 
            stats={enhancedStats}
            surgeriesWithContractSigned={enhancedStats.surgeriesWithContractSigned}
            surgeriesThisMonth={enhancedStats.surgeriesThisMonth}
          />

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <SurgeryFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </CardContent>
          </Card>

          {/* View Toggle */}
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <Table2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tabela</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Calendário</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kanban" className="mt-4">
              <SurgeryKanban
                surgeries={filteredSurgeries}
                onSelectSurgery={handleSelectSurgery}
              />
            </TabsContent>

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
                onSelectSurgery={handleSelectSurgery}
              />
            </TabsContent>
          </Tabs>

          {/* Surgery Detail Panel */}
          <SurgeryDetailPanel
            surgery={selectedSurgery}
            open={detailPanelOpen}
            onOpenChange={setDetailPanelOpen}
            onEdit={() => handleEdit()}
            onDelete={() => handleDelete()}
            onViewPatient={handleViewPatient}
          />

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
