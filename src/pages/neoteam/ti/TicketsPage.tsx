import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Ticket, Monitor, Wifi, Key, HelpCircle, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  waiting: "bg-amber-100 text-amber-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em Andamento",
  waiting: "Aguardando",
  resolved: "Resolvido",
  closed: "Fechado",
};

const CATEGORY_ICONS: Record<string, any> = {
  hardware: Monitor,
  software: Ticket,
  network: Wifi,
  access: Key,
  general: HelpCircle,
  other: AlertCircle,
};

export default function TicketsPage() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["neoteam_tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neoteam_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createTicket = useMutation({
    mutationFn: async (form: any) => {
      const ticketNumber = `TI-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase.from("neoteam_tickets").insert({
        ticket_number: ticketNumber,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        requester_id: user?.id,
        requester_name: (user as any)?.name || user?.email || "Usuário",
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_tickets"] });
      toast.success("Chamado aberto");
      setDialogOpen(false);
    },
    onError: () => toast.error("Erro ao abrir chamado"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === "resolved") updates.resolved_at = new Date().toISOString();
      if (status === "closed") updates.closed_at = new Date().toISOString();
      const { error } = await supabase.from("neoteam_tickets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_tickets"] });
      toast.success("Status atualizado");
    },
  });

  const filtered = statusFilter === "all" ? tickets : tickets.filter((t: any) => t.status === statusFilter);

  const stats = {
    open: tickets.filter((t: any) => t.status === "open").length,
    in_progress: tickets.filter((t: any) => t.status === "in_progress").length,
    resolved: tickets.filter((t: any) => t.status === "resolved").length,
    total: tickets.length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chamados de TI</h1>
          <p className="text-muted-foreground">Helpdesk interno</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />Novo Chamado</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Abrir Chamado</DialogTitle></DialogHeader>
            <TicketForm onSubmit={(f: any) => createTicket.mutate(f)} loading={createTicket.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer" onClick={() => setStatusFilter("open")}><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.open}</p>
          <p className="text-xs text-muted-foreground">Abertos</p>
        </CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("in_progress")}><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
          <p className="text-xs text-muted-foreground">Em Andamento</p>
        </CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("resolved")}><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
          <p className="text-xs text-muted-foreground">Resolvidos</p>
        </CardContent></Card>
        <Card className="cursor-pointer" onClick={() => setStatusFilter("all")}><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum chamado</TableCell></TableRow>
              ) : filtered.map((t: any) => {
                const CatIcon = CATEGORY_ICONS[t.category] || HelpCircle;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                    <TableCell>
                      <p className="font-medium">{t.title}</p>
                      {t.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.description}</p>}
                    </TableCell>
                    <TableCell><div className="flex items-center gap-1"><CatIcon className="h-3 w-3" /><span className="text-sm capitalize">{t.category}</span></div></TableCell>
                    <TableCell><Badge className={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge></TableCell>
                    <TableCell className="text-sm">{t.requester_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(parseISO(t.created_at), "dd/MM HH:mm")}</TableCell>
                    <TableCell>
                      <Select value={t.status} onValueChange={v => updateStatus.mutate({ id: t.id, status: v })}>
                        <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Aberto</SelectItem>
                          <SelectItem value="in_progress">Em Andamento</SelectItem>
                          <SelectItem value="waiting">Aguardando</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
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

function TicketForm({ onSubmit, loading }: { onSubmit: (f: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ title: "", description: "", category: "general", priority: "medium" });
  return (
    <div className="space-y-3">
      <Input placeholder="Título do chamado *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <Textarea placeholder="Descrição detalhada" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="general">Geral</SelectItem>
          <SelectItem value="hardware">Hardware</SelectItem>
          <SelectItem value="software">Software</SelectItem>
          <SelectItem value="network">Rede</SelectItem>
          <SelectItem value="access">Acessos</SelectItem>
          <SelectItem value="other">Outro</SelectItem>
        </SelectContent>
      </Select>
      <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Baixa</SelectItem>
          <SelectItem value="medium">Média</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="critical">Crítica</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => onSubmit(form)} disabled={loading || !form.title} className="w-full">Abrir Chamado</Button>
    </div>
  );
}
