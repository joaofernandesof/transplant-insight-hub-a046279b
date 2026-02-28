/**
 * CPG Advocacia - Listagem de todos os Formulários de Onboarding
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ClipboardList, Search, Eye, ExternalLink, Copy, Check,
  Loader2, FileText, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface OnboardingForm {
  id: string;
  client_id: string;
  token: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  doctor_name: string | null;
  cnpj: string | null;
  clinic_address: string | null;
  cancel_min_hours: number | null;
  cancel_has_fine: boolean | null;
  deposit_required: boolean | null;
  has_followup: boolean | null;
  has_teleconsultation: boolean | null;
  ipromed_legal_clients: { name: string } | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Clock },
  submitted: { label: "Respondido", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2 },
  expired: { label: "Expirado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: AlertCircle },
};

export default function IpromedOnboardingForms() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedForm, setSelectedForm] = useState<OnboardingForm | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: forms, isLoading } = useQuery({
    queryKey: ["ipromed-onboarding-forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ipromed_onboarding_forms")
        .select("*, ipromed_legal_clients(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as OnboardingForm[];
    },
  });

  const filtered = (forms || []).filter((f) => {
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      const clientName = f.ipromed_legal_clients?.name || "";
      return (
        clientName.toLowerCase().includes(s) ||
        (f.doctor_name || "").toLowerCase().includes(s) ||
        (f.cnpj || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  const stats = {
    total: (forms || []).length,
    pending: (forms || []).filter((f) => f.status === "pending").length,
    submitted: (forms || []).filter((f) => f.status === "submitted").length,
  };

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/forms/onboarding/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatus = (status: string) => STATUS_MAP[status] || STATUS_MAP.pending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Formulários de Onboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os formulários enviados aos clientes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.submitted}</p>
              <p className="text-xs text-muted-foreground">Respondidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, médico ou CNPJ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="submitted">Respondido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum formulário encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Respondido em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((form) => {
                  const status = getStatus(form.status);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">
                        {form.ipromed_legal_clients?.name || "—"}
                      </TableCell>
                      <TableCell>{form.doctor_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`gap-1 ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(form.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {form.submitted_at
                          ? format(new Date(form.submitted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedForm(form)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyLink(form.token, form.id)}
                            title="Copiar link"
                          >
                            {copiedId === form.id ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/cpg/clients/${form.client_id}`)}
                            title="Ir para o cliente"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Detalhes do Formulário
            </DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4">
              <InfoRow label="Cliente" value={selectedForm.ipromed_legal_clients?.name} />
              <InfoRow label="Médico" value={selectedForm.doctor_name} />
              <InfoRow label="CNPJ" value={selectedForm.cnpj} />
              <InfoRow label="Endereço da Clínica" value={selectedForm.clinic_address} />
              <InfoRow
                label="Status"
                value={getStatus(selectedForm.status).label}
              />
              <InfoRow
                label="Criado em"
                value={format(new Date(selectedForm.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              />
              {selectedForm.submitted_at && (
                <InfoRow
                  label="Respondido em"
                  value={format(new Date(selectedForm.submitted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                />
              )}

              <hr className="border-border" />
              <h4 className="font-semibold text-sm">Políticas configuradas</h4>

              <InfoRow label="Antecedência mín. cancelamento" value={selectedForm.cancel_min_hours ? `${selectedForm.cancel_min_hours}h` : null} />
              <InfoRow label="Multa por cancelamento" value={selectedForm.cancel_has_fine != null ? (selectedForm.cancel_has_fine ? "Sim" : "Não") : null} />
              <InfoRow label="Depósito obrigatório" value={selectedForm.deposit_required != null ? (selectedForm.deposit_required ? "Sim" : "Não") : null} />
              <InfoRow label="Possui retorno" value={selectedForm.has_followup != null ? (selectedForm.has_followup ? "Sim" : "Não") : null} />
              <InfoRow label="Teleconsulta" value={selectedForm.has_teleconsultation != null ? (selectedForm.has_teleconsultation ? "Sim" : "Não") : null} />

              <div className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/cpg/clients/${selectedForm.client_id}`);
                    setSelectedForm(null);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Cliente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyLink(selectedForm.token, selectedForm.id)}
                >
                  {copiedId === selectedForm.id ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copiar Link
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}
