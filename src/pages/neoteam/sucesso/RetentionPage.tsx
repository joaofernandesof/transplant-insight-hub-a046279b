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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, AlertTriangle, UserCheck, UserX, Phone, Shield, TrendingDown, Activity } from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  contacted: "bg-blue-100 text-blue-800",
  recovered: "bg-emerald-100 text-emerald-800",
  lost: "bg-muted text-muted-foreground",
};

export default function RetentionPage() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("alerts");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [protocolDialog, setProtocolDialog] = useState(false);

  // Fetch churn alerts
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ["neoteam_churn_alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neoteam_churn_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch protocols
  const { data: protocols = [], isLoading: loadingProtocols } = useQuery({
    queryKey: ["neoteam_retention_protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neoteam_retention_protocols")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create alert
  const createAlert = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from("neoteam_churn_alerts").insert({
        patient_name: form.patient_name,
        patient_phone: form.patient_phone,
        risk_level: form.risk_level,
        reason: form.reason,
        days_inactive: form.days_inactive ? parseInt(form.days_inactive) : null,
        notes: form.notes,
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_churn_alerts"] });
      toast.success("Alerta criado");
      setDialogOpen(false);
    },
    onError: () => toast.error("Erro ao criar alerta"),
  });

  // Update alert status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("neoteam_churn_alerts")
        .update({ status, updated_at: new Date().toISOString(), resolved_at: status === "recovered" || status === "lost" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_churn_alerts"] });
      toast.success("Status atualizado");
    },
  });

  // Create protocol
  const createProtocol = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from("neoteam_retention_protocols").insert({
        name: form.name,
        description: form.description,
        trigger_event: form.trigger_event,
        trigger_days_inactive: form.trigger_days_inactive ? parseInt(form.trigger_days_inactive) : null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_retention_protocols"] });
      toast.success("Protocolo criado");
      setProtocolDialog(false);
    },
    onError: () => toast.error("Erro ao criar protocolo"),
  });

  const stats = {
    open: alerts.filter((a: any) => a.status === "open").length,
    critical: alerts.filter((a: any) => a.risk_level === "critical" && a.status === "open").length,
    recovered: alerts.filter((a: any) => a.status === "recovered").length,
    lost: alerts.filter((a: any) => a.status === "lost").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sucesso do Paciente</h1>
          <p className="text-muted-foreground">Protocolos de retenção e alertas de churn</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold">{stats.open}</p>
          <p className="text-xs text-muted-foreground">Alertas Abertos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingDown className="h-6 w-6 mx-auto text-orange-500 mb-1" />
          <p className="text-2xl font-bold">{stats.critical}</p>
          <p className="text-xs text-muted-foreground">Risco Crítico</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <UserCheck className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{stats.recovered}</p>
          <p className="text-xs text-muted-foreground">Recuperados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <UserX className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{stats.lost}</p>
          <p className="text-xs text-muted-foreground">Perdidos</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="alerts">Alertas de Churn</TabsTrigger>
            <TabsTrigger value="protocols">Protocolos</TabsTrigger>
          </TabsList>
          {tab === "alerts" ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Alerta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Alerta de Churn</DialogTitle></DialogHeader>
                <AlertForm onSubmit={(f: any) => createAlert.mutate(f)} loading={createAlert.isPending} />
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={protocolDialog} onOpenChange={setProtocolDialog}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Protocolo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Protocolo de Retenção</DialogTitle></DialogHeader>
                <ProtocolForm onSubmit={(f: any) => createProtocol.mutate(f)} loading={createProtocol.isPending} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Dias Inativo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAlerts ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : alerts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum alerta registrado</TableCell></TableRow>
                  ) : alerts.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{a.patient_name}</p>
                          {a.patient_phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{a.patient_phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={RISK_COLORS[a.risk_level]}>{a.risk_level}</Badge></TableCell>
                      <TableCell className="text-sm">{a.reason || "—"}</TableCell>
                      <TableCell>{a.days_inactive ?? "—"}</TableCell>
                      <TableCell><Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge></TableCell>
                      <TableCell>
                        <Select value={a.status} onValueChange={(v) => updateStatus.mutate({ id: a.id, status: v })}>
                          <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Aberto</SelectItem>
                            <SelectItem value="contacted">Contatado</SelectItem>
                            <SelectItem value="recovered">Recuperado</SelectItem>
                            <SelectItem value="lost">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocols" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingProtocols ? (
              <p className="text-muted-foreground col-span-full text-center py-8">Carregando...</p>
            ) : protocols.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">Nenhum protocolo cadastrado</p>
            ) : protocols.map((p: any) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Ativo" : "Inativo"}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{p.description || "Sem descrição"}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{p.trigger_event}</Badge>
                    {p.trigger_days_inactive && <Badge variant="outline">{p.trigger_days_inactive} dias</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AlertForm({ onSubmit, loading }: { onSubmit: (f: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", risk_level: "medium", reason: "", days_inactive: "", notes: "" });
  return (
    <div className="space-y-3">
      <Input placeholder="Nome do Paciente *" value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} />
      <Input placeholder="Telefone" value={form.patient_phone} onChange={e => setForm(f => ({ ...f, patient_phone: e.target.value }))} />
      <Select value={form.risk_level} onValueChange={v => setForm(f => ({ ...f, risk_level: v }))}>
        <SelectTrigger><SelectValue placeholder="Nível de Risco" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Baixo</SelectItem>
          <SelectItem value="medium">Médio</SelectItem>
          <SelectItem value="high">Alto</SelectItem>
          <SelectItem value="critical">Crítico</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="Motivo (no_show, inactive...)" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
      <Input placeholder="Dias inativo" type="number" value={form.days_inactive} onChange={e => setForm(f => ({ ...f, days_inactive: e.target.value }))} />
      <Textarea placeholder="Observações" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      <Button onClick={() => onSubmit(form)} disabled={loading || !form.patient_name} className="w-full">Criar Alerta</Button>
    </div>
  );
}

function ProtocolForm({ onSubmit, loading }: { onSubmit: (f: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ name: "", description: "", trigger_event: "manual", trigger_days_inactive: "" });
  return (
    <div className="space-y-3">
      <Input placeholder="Nome do Protocolo *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <Select value={form.trigger_event} onValueChange={v => setForm(f => ({ ...f, trigger_event: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="manual">Manual</SelectItem>
          <SelectItem value="no_show">No-Show</SelectItem>
          <SelectItem value="churn_risk">Risco de Churn</SelectItem>
          <SelectItem value="nps_low">NPS Baixo</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="Dias de inatividade para disparar" type="number" value={form.trigger_days_inactive} onChange={e => setForm(f => ({ ...f, trigger_days_inactive: e.target.value }))} />
      <Button onClick={() => onSubmit(form)} disabled={loading || !form.name} className="w-full">Criar Protocolo</Button>
    </div>
  );
}
