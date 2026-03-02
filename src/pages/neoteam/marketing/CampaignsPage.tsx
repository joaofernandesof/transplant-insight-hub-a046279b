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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Megaphone, TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { format, parseISO } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planejada",
  in_progress: "Em Execução",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export default function CampaignsPage() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["neoteam_campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neoteam_campaigns")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from("neoteam_campaigns").insert({
        name: form.name,
        description: form.description,
        campaign_type: form.campaign_type,
        channel: form.channel,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        status: "planned",
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_campaigns"] });
      toast.success("Campanha criada");
      setDialogOpen(false);
    },
    onError: () => toast.error("Erro ao criar campanha"),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("neoteam_campaigns").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam_campaigns"] });
      toast.success("Campanha atualizada");
    },
  });

  const totalBudget = campaigns.reduce((s: number, c: any) => s + (Number(c.budget) || 0), 0);
  const totalSpent = campaigns.reduce((s: number, c: any) => s + (Number(c.spent) || 0), 0);
  const totalLeads = campaigns.reduce((s: number, c: any) => s + (c.leads_generated || 0), 0);
  const totalConversions = campaigns.reduce((s: number, c: any) => s + (c.conversions || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas de Marketing</h1>
          <p className="text-muted-foreground">Planejamento e performance</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Campanha</DialogTitle></DialogHeader>
            <CampaignForm onSubmit={(f: any) => createCampaign.mutate(f)} loading={createCampaign.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">R$ {totalBudget.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground">Orçamento Total</p>
          {totalBudget > 0 && <Progress value={(totalSpent / totalBudget) * 100} className="mt-2 h-1.5" />}
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">R$ {totalSpent.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground">Investido</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-6 w-6 mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold">{totalLeads}</p>
          <p className="text-xs text-muted-foreground">Leads Gerados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Target className="h-6 w-6 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{totalConversions}</p>
          <p className="text-xs text-muted-foreground">Conversões</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Orçamento</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma campanha</TableCell></TableRow>
              ) : campaigns.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.name}</p>
                    {c.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description}</p>}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{c.campaign_type?.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-sm capitalize">{c.channel || "—"}</TableCell>
                  <TableCell className="text-xs">
                    {c.start_date && format(parseISO(c.start_date), "dd/MM/yy")}
                    {c.end_date && ` → ${format(parseISO(c.end_date), "dd/MM/yy")}`}
                  </TableCell>
                  <TableCell>{c.budget ? `R$ ${Number(c.budget).toLocaleString("pt-BR")}` : "—"}</TableCell>
                  <TableCell>{c.leads_generated || 0}</TableCell>
                  <TableCell>
                    <Select value={c.status} onValueChange={v => updateCampaign.mutate({ id: c.id, status: v })}>
                      <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planejada</SelectItem>
                        <SelectItem value="in_progress">Em Execução</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignForm({ onSubmit, loading }: { onSubmit: (f: any) => void; loading: boolean }) {
  const [form, setForm] = useState({
    name: "", description: "", campaign_type: "social_media", channel: "", start_date: "", end_date: "", budget: "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3">
      <Input placeholder="Nome da Campanha *" value={form.name} onChange={e => set("name", e.target.value)} />
      <Textarea placeholder="Descrição" value={form.description} onChange={e => set("description", e.target.value)} />
      <Select value={form.campaign_type} onValueChange={v => set("campaign_type", v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="social_media">Redes Sociais</SelectItem>
          <SelectItem value="email">E-mail Marketing</SelectItem>
          <SelectItem value="sms">SMS</SelectItem>
          <SelectItem value="event">Evento</SelectItem>
          <SelectItem value="print">Impresso</SelectItem>
          <SelectItem value="paid_ads">Ads Pagos</SelectItem>
        </SelectContent>
      </Select>
      <Input placeholder="Canal (instagram, google...)" value={form.channel} onChange={e => set("channel", e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-muted-foreground">Início</label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
        <div><label className="text-xs text-muted-foreground">Fim</label><Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} /></div>
      </div>
      <Input placeholder="Orçamento (R$)" type="number" value={form.budget} onChange={e => set("budget", e.target.value)} />
      <Button onClick={() => onSubmit(form)} disabled={loading || !form.name} className="w-full">Criar Campanha</Button>
    </div>
  );
}
