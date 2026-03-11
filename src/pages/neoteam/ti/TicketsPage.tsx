import { useState, useRef, useEffect, useCallback } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Ticket, HelpCircle, ImagePlus, X, Paperclip, Loader2, UserCheck, UserX } from "lucide-react";
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

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function useNewTicketSound() {
  const play = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1175, now + 0.15);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.55);
    } catch (e) {
      // ignore
    }
  }, []);
  return play;
}

export default function TicketsPage() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const playSound = useNewTicketSound();

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

  // Realtime subscription for new tickets
  useEffect(() => {
    const channel = supabase
      .channel("neoteam-tickets-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "neoteam_tickets" },
        (payload) => {
          const newTicket = payload.new as any;
          playSound();
          toast("🎫 Novo chamado!", {
            description: `${newTicket.ticket_number} — ${newTicket.title}`,
            duration: 8000,
          });
          queryClient.invalidateQueries({ queryKey: ["neoteam_tickets"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "neoteam_tickets" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["neoteam_tickets"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, playSound]);

  // Fetch attachment counts per ticket
  const { data: attachmentCounts = {} } = useQuery({
    queryKey: ["neoteam_ticket_attachment_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neoteam_ticket_attachments")
        .select("ticket_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((a: any) => {
        counts[a.ticket_id] = (counts[a.ticket_id] || 0) + 1;
      });
      return counts;
    },
  });

  const createTicket = useMutation({
    mutationFn: async (form: { title: string; description: string; priority: string; files: File[] }) => {
      const ticketNumber = `TI-${Date.now().toString(36).toUpperCase()}`;
      const { data: ticketData, error } = await supabase.from("neoteam_tickets").insert({
        ticket_number: ticketNumber,
        title: form.title,
        description: form.description,
        category: "general",
        priority: form.priority,
        requester_id: user?.id,
        requester_name: (user as any)?.name || user?.email || "Usuário",
        status: "open",
      }).select("id").single();
      if (error) throw error;

      // Upload attachments
      if (form.files.length > 0 && ticketData) {
        for (const file of form.files) {
          const ext = file.name.split('.').pop();
          const path = `${ticketData.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          
          const { error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(path, file, { cacheControl: "3600", upsert: false });
          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage
            .from("ticket-attachments")
            .getPublicUrl(path);

          await supabase.from("neoteam_ticket_attachments").insert({
            ticket_id: ticketData.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_tickets"] });
      queryClient.invalidateQueries({ queryKey: ["neoteam_ticket_attachment_counts"] });
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

  const assignTicket = useMutation({
    mutationFn: async ({ id, assign }: { id: string; assign: boolean }) => {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };
      if (assign) {
        updates.assigned_to = user?.id;
        updates.assigned_name = (user as any)?.name || user?.email || "Operador";
        updates.status = "in_progress";
      } else {
        updates.assigned_to = null;
        updates.assigned_name = null;
      }
      const { error } = await supabase.from("neoteam_tickets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_tickets"] });
      toast.success(variables.assign ? "Chamado assumido!" : "Chamado liberado");
    },
    onError: () => toast.error("Erro ao atualizar responsável"),
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
          <DialogContent className="sm:max-w-lg">
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
                <TableHead>Prioridade</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Anexos</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum chamado</TableCell></TableRow>
              ) : filtered.map((t: any) => {
                const count = (attachmentCounts as Record<string, number>)[t.id] || 0;
                const isAssignedToMe = t.assigned_to === user?.id;
                const isUnassigned = !t.assigned_to;

                return (
                  <TableRow
                    key={t.id}
                    className={isUnassigned && t.status === "open" ? "border-l-4 border-l-orange-400" : ""}
                  >
                    <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
                    <TableCell>
                      <p className="font-medium">{t.title}</p>
                      {t.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.description}</p>}
                    </TableCell>
                    <TableCell><Badge className={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge></TableCell>
                    <TableCell className="text-sm">{t.requester_name}</TableCell>
                    <TableCell>
                      {isUnassigned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => assignTicket.mutate({ id: t.id, assign: true })}
                          disabled={assignTicket.isPending}
                        >
                          <UserCheck className="h-3 w-3" />
                          Assumir
                        </Button>
                      ) : isAssignedToMe ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                              {getInitials(t.assigned_name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{t.assigned_name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => assignTicket.mutate({ id: t.id, assign: false })}
                            disabled={assignTicket.isPending}
                            title="Liberar chamado"
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                              {getInitials(t.assigned_name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{t.assigned_name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {count > 0 ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span className="text-xs">{count}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
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
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} excede 10MB`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <Input placeholder="Título do chamado *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <Textarea placeholder="Descrição detalhada" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      
      <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Baixa</SelectItem>
          <SelectItem value="medium">Média</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="critical">Crítica</SelectItem>
        </SelectContent>
      </Select>

      {/* File attachment area */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
        />
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
          <p className="text-sm text-muted-foreground">Clique para anexar fotos ou vídeos</p>
          <p className="text-xs text-muted-foreground">Máx. 10MB por arquivo</p>
        </div>

        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {files.map((file, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-border bg-muted">
                {file.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-20 object-cover"
                  />
                ) : (
                  <div className="w-full h-20 flex flex-col items-center justify-center p-1">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground truncate w-full text-center mt-1">{file.name}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-[9px] text-muted-foreground text-center py-0.5">{formatSize(file.size)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={() => onSubmit({ ...form, files })} disabled={loading || !form.title} className="w-full">
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : "Abrir Chamado"}
      </Button>
    </div>
  );
}
