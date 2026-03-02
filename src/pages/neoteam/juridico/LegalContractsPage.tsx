import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, FileText, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: FileText },
  active: { label: "Ativo", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  expiring: { label: "Vencendo", color: "bg-amber-100 text-amber-800", icon: AlertTriangle },
  expired: { label: "Vencido", color: "bg-red-100 text-red-800", icon: Clock },
  cancelled: { label: "Cancelado", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  service: "Serviço",
  rental: "Aluguel",
  employment: "Trabalho",
  supplier: "Fornecedor",
  partnership: "Parceria",
};

export default function LegalContractsPage() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["neoteam_legal_contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neoteam_legal_contracts")
        .select("*")
        .order("end_date", { ascending: true });
      if (error) throw error;
      // Auto-calculate status based on dates
      return (data || []).map((c: any) => {
        if (c.status === "cancelled") return c;
        if (!c.end_date) return { ...c, computed_status: c.status };
        const daysLeft = differenceInDays(parseISO(c.end_date), new Date());
        let computed_status = c.status;
        if (daysLeft < 0) computed_status = "expired";
        else if (daysLeft <= (c.alert_days_before || 30)) computed_status = "expiring";
        return { ...c, computed_status };
      });
    },
  });

  const createContract = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from("neoteam_legal_contracts").insert({
        title: form.title,
        contract_type: form.contract_type,
        party_name: form.party_name,
        party_document: form.party_document,
        start_date: form.start_date,
        end_date: form.end_date || null,
        renewal_date: form.renewal_date || null,
        value: form.value ? parseFloat(form.value) : null,
        recurrence: form.recurrence,
        notes: form.notes,
        status: "active",
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_legal_contracts"] });
      toast.success("Contrato cadastrado");
      setDialogOpen(false);
    },
    onError: () => toast.error("Erro ao cadastrar contrato"),
  });

  const filtered = filter === "all" ? contracts : contracts.filter((c: any) => (c.computed_status || c.status) === filter);

  const stats = {
    total: contracts.length,
    active: contracts.filter((c: any) => (c.computed_status || c.status) === "active").length,
    expiring: contracts.filter((c: any) => (c.computed_status || c.status) === "expiring").length,
    expired: contracts.filter((c: any) => (c.computed_status || c.status) === "expired").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Contratos</h1>
          <p className="text-muted-foreground">Controle de prazos e vencimentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />Novo Contrato</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Cadastrar Contrato</DialogTitle></DialogHeader>
            <ContractForm onSubmit={(f: any) => createContract.mutate(f)} loading={createContract.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer" onClick={() => setFilter("all")}><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setFilter("active")}><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Ativos</p>
        </CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setFilter("expiring")}><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.expiring}</p>
          <p className="text-xs text-muted-foreground">Vencendo</p>
        </CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setFilter("expired")}><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
          <p className="text-xs text-muted-foreground">Vencidos</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Parte</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum contrato encontrado</TableCell></TableRow>
              ) : filtered.map((c: any) => {
                const st = STATUS_MAP[(c.computed_status || c.status)] || STATUS_MAP.draft;
                const daysLeft = c.end_date ? differenceInDays(parseISO(c.end_date), new Date()) : null;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.title}</p>
                      {c.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.notes}</p>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{TYPE_LABELS[c.contract_type] || c.contract_type}</Badge></TableCell>
                    <TableCell>
                      <p className="text-sm">{c.party_name}</p>
                      {c.party_document && <p className="text-xs text-muted-foreground">{c.party_document}</p>}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{format(parseISO(c.start_date), "dd/MM/yyyy")}</p>
                      {c.end_date && (
                        <p className="text-xs text-muted-foreground">
                          até {format(parseISO(c.end_date), "dd/MM/yyyy")}
                          {daysLeft !== null && <span className={daysLeft < 0 ? " text-red-600 font-medium" : daysLeft <= 30 ? " text-amber-600" : ""}> ({daysLeft}d)</span>}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{c.value ? `R$ ${Number(c.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</TableCell>
                    <TableCell><Badge className={st.color}>{st.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ContractForm({ onSubmit, loading }: { onSubmit: (f: any) => void; loading: boolean }) {
  const [form, setForm] = useState({
    title: "", contract_type: "service", party_name: "", party_document: "",
    start_date: "", end_date: "", renewal_date: "", value: "", recurrence: "monthly", notes: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <Input placeholder="Título do Contrato *" value={form.title} onChange={e => set("title", e.target.value)} />
      <Select value={form.contract_type} onValueChange={v => set("contract_type", v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="service">Serviço</SelectItem>
          <SelectItem value="rental">Aluguel</SelectItem>
          <SelectItem value="employment">Trabalho</SelectItem>
          <SelectItem value="supplier">Fornecedor</SelectItem>
          <SelectItem value="partnership">Parceria</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="Nome da Parte *" value={form.party_name} onChange={e => set("party_name", e.target.value)} />
      <Input placeholder="CPF/CNPJ" value={form.party_document} onChange={e => set("party_document", e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground">Início *</label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground">Fim</label><Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Valor (R$)" type="number" value={form.value} onChange={e => set("value", e.target.value)} />
        <Select value={form.recurrence} onValueChange={v => set("recurrence", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="once">Único</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea placeholder="Observações" value={form.notes} onChange={e => set("notes", e.target.value)} />
      <Button onClick={() => onSubmit(form)} disabled={loading || !form.title || !form.party_name || !form.start_date} className="w-full">Cadastrar</Button>
    </div>
  );
}
