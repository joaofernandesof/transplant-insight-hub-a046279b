import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NeoTeamBreadcrumb } from "@/neohub/components/NeoTeamBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { Plus, Search, FileText, Eye, Pencil, Trash2, BookOpen, Archive, Send } from "lucide-react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

const CATEGORIES = [
  { value: "clinico", label: "Clínico" },
  { value: "cirurgico", label: "Cirúrgico" },
  { value: "administrativo", label: "Administrativo" },
  { value: "atendimento", label: "Atendimento" },
  { value: "financeiro", label: "Financeiro" },
  { value: "marketing", label: "Marketing" },
  { value: "geral", label: "Geral" },
];

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  published: { label: "Publicado", variant: "default" },
  archived: { label: "Arquivado", variant: "outline" },
};

type Pop = {
  id: string;
  title: string;
  category: string;
  content: string | null;
  description: string | null;
  version: string | null;
  status: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export default function NeoTeamPopsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [viewPop, setViewPop] = useState<Pop | null>(null);
  const [editPop, setEditPop] = useState<Pop | null>(null);
  const [deletePop, setDeletePop] = useState<Pop | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("geral");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formStatus, setFormStatus] = useState("draft");

  const { data: pops = [], isLoading } = useQuery({
    queryKey: ["neoteam-pops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neoteam_pops")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Pop[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (pop: Partial<Pop> & { id?: string }) => {
      if (pop.id) {
        const { error } = await supabase
          .from("neoteam_pops")
          .update({ ...pop, updated_by: session?.user?.id, updated_at: new Date().toISOString() })
          .eq("id", pop.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("neoteam_pops")
          .insert({ ...pop, created_by: session?.user?.id, updated_by: session?.user?.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam-pops"] });
      toast.success(editPop ? "POP atualizado!" : "POP criado!");
      closeForm();
    },
    onError: () => toast.error("Erro ao salvar POP"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("neoteam_pops").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neoteam-pops"] });
      toast.success("POP excluído!");
      setDeletePop(null);
    },
    onError: () => toast.error("Erro ao excluir POP"),
  });

  const closeForm = () => {
    setFormOpen(false);
    setEditPop(null);
    setFormTitle("");
    setFormCategory("geral");
    setFormDescription("");
    setFormContent("");
    setFormStatus("draft");
  };

  const openEdit = (pop: Pop) => {
    setEditPop(pop);
    setFormTitle(pop.title);
    setFormCategory(pop.category);
    setFormDescription(pop.description || "");
    setFormContent(pop.content || "");
    setFormStatus(pop.status);
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return toast.error("Título é obrigatório");
    saveMutation.mutate({
      ...(editPop ? { id: editPop.id } : {}),
      title: formTitle,
      category: formCategory,
      description: formDescription || null,
      content: formContent || null,
      status: formStatus,
    });
  };

  const filtered = pops.filter((p) => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || p.category === filterCategory;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <NeoTeamBreadcrumb />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            POPs — Procedimentos Operacionais
          </h1>
          <p className="text-muted-foreground text-sm">Biblioteca central de procedimentos padronizados</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); else setFormOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo POP</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editPop ? "Editar POP" : "Novo POP"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: POP de Atendimento Inicial" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Breve descrição do procedimento" />
              </div>
              <div>
                <Label>Conteúdo do POP</Label>
                <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={12} placeholder="Descreva o procedimento passo a passo..." className="font-mono text-sm" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeForm}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar POPs..." className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando POPs...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhum POP encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pop) => {
            const st = STATUS_MAP[pop.status] || STATUS_MAP.draft;
            const catLabel = CATEGORIES.find((c) => c.value === pop.category)?.label || pop.category;
            return (
              <Card key={pop.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug line-clamp-2">{pop.title}</CardTitle>
                    <Badge variant={st.variant} className="shrink-0 text-xs">{st.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{catLabel}</Badge>
                    {pop.version && <span className="text-xs text-muted-foreground">v{pop.version}</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  {pop.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{pop.description}</p>}
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setViewPop(pop)}><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(pop)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeletePop(pop)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View dialog */}
      <Dialog open={!!viewPop} onOpenChange={(o) => !o && setViewPop(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {viewPop && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {viewPop.title}
                </DialogTitle>
              </DialogHeader>
              <div className="flex gap-2 mb-4">
                <Badge variant={STATUS_MAP[viewPop.status]?.variant}>{STATUS_MAP[viewPop.status]?.label}</Badge>
                <Badge variant="outline">{CATEGORIES.find((c) => c.value === viewPop.category)?.label}</Badge>
                {viewPop.version && <span className="text-xs text-muted-foreground">v{viewPop.version}</span>}
              </div>
              {viewPop.description && <p className="text-sm text-muted-foreground mb-4">{viewPop.description}</p>}
              <div className="prose prose-sm max-w-none whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border text-sm font-mono">
                {viewPop.content || "Sem conteúdo."}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmActionDialog
        open={!!deletePop}
        onOpenChange={(o) => !o && setDeletePop(null)}
        title="Excluir POP?"
        description={`O POP "${deletePop?.title}" será removido permanentemente.`}
        impact="Esta ação não pode ser desfeita. Colaboradores não terão mais acesso a este procedimento."
        severity="destructive"
        confirmLabel="Excluir POP"
        onConfirm={() => deletePop && deleteMutation.mutate(deletePop.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
