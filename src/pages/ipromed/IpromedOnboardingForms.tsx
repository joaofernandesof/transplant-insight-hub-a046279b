/**
 * CPG Advocacia - Formulários (Templates + Onboarding Forms)
 * Permite criar formulários a partir de templates jurídicos ou do zero,
 * editar perguntas e gerenciar formulários enviados.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClipboardList, Search, Eye, ExternalLink, Copy, Check,
  Loader2, FileText, Clock, CheckCircle2, AlertCircle,
  Plus, Pencil, Trash2, GripVertical, UserPlus, FolderOpen,
  ShieldAlert, Star, Scale, FileCheck, LayoutTemplate,
  ArrowLeft, Save, Link2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ── Types ──

interface FormQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "boolean" | "select" | "number";
  options?: string[];
  required: boolean;
  order: number;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  icon: string;
  questions: FormQuestion[];
  is_system: boolean;
  is_active: boolean;
  public_token: string | null;
  created_at: string;
  updated_at: string;
}

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

// ── Constants ──

const ICON_MAP: Record<string, React.ElementType> = {
  UserPlus, FolderOpen, ShieldAlert, Star, Scale, FileCheck, FileText, ClipboardList,
};

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  onboarding: { label: "Onboarding", color: "bg-blue-100 text-blue-700" },
  documentos: { label: "Documentos", color: "bg-amber-100 text-amber-700" },
  risco: { label: "Risco", color: "bg-red-100 text-red-700" },
  satisfacao: { label: "Satisfação", color: "bg-emerald-100 text-emerald-700" },
  compliance: { label: "Compliance", color: "bg-violet-100 text-violet-700" },
  contratos: { label: "Contratos", color: "bg-cyan-100 text-cyan-700" },
  geral: { label: "Geral", color: "bg-gray-100 text-gray-700" },
};

const QUESTION_TYPES: { value: FormQuestion["type"]; label: string }[] = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "boolean", label: "Sim/Não" },
  { value: "select", label: "Múltipla escolha" },
  { value: "number", label: "Número" },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-700", icon: Clock },
  submitted: { label: "Respondido", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  expired: { label: "Expirado", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

// ── Main Component ──

export default function IpromedOnboardingForms() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("formularios");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedForm, setSelectedForm] = useState<OnboardingForm | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Template states
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // ── Queries ──

  const { data: forms, isLoading: formsLoading } = useQuery({
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

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["ipromed-form-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ipromed_form_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        questions: (typeof t.questions === 'string' ? JSON.parse(t.questions) : t.questions) as FormQuestion[],
      })) as FormTemplate[];
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async (template: Partial<FormTemplate> & { id?: string }) => {
      const payload = {
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon || "FileText",
        questions: JSON.stringify(template.questions),
        is_system: false,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (template.id) {
        const { error } = await supabase
          .from("ipromed_form_templates")
          .update(payload)
          .eq("id", template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ipromed_form_templates")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-form-templates"] });
      toast.success("Formulário salvo com sucesso!");
      setEditingTemplate(null);
      setIsCreatingNew(false);
    },
    onError: () => toast.error("Erro ao salvar formulário"),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ipromed_form_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ipromed-form-templates"] });
      toast.success("Formulário excluído!");
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  // ── Handlers ──

  const filtered = (forms || []).filter((f) => {
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      const name = f.ipromed_legal_clients?.name || "";
      return name.toLowerCase().includes(s) || (f.doctor_name || "").toLowerCase().includes(s) || (f.cnpj || "").toLowerCase().includes(s);
    }
    return true;
  });

  const stats = {
    total: (forms || []).length,
    pending: (forms || []).filter((f) => f.status === "pending").length,
    submitted: (forms || []).filter((f) => f.status === "submitted").length,
  };

  const copyLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/forms/onboarding/${token}`);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectTemplate = (template: FormTemplate) => {
    setEditingTemplate({
      ...template,
      id: template.id, // keep id for system templates editing
      questions: [...template.questions],
    });
    setIsCreatingNew(false);
    setShowTemplateSelector(false);
  };

  const handleCreateFromScratch = () => {
    setEditingTemplate({
      id: "",
      name: "",
      description: "",
      category: "geral",
      icon: "FileText",
      questions: [{ id: crypto.randomUUID(), label: "", type: "text", required: false, order: 1 }],
      is_system: false,
      is_active: true,
      public_token: null,
      created_at: "",
      updated_at: "",
    });
    setIsCreatingNew(true);
    setShowTemplateSelector(false);
  };

  const handleDuplicateTemplate = (template: FormTemplate) => {
    setEditingTemplate({
      ...template,
      id: "", // new
      name: `${template.name} (Cópia)`,
      is_system: false,
      questions: template.questions.map(q => ({ ...q, id: crypto.randomUUID() })),
    });
    setIsCreatingNew(true);
    setShowTemplateSelector(false);
  };

  // ── Render ──

  if (editingTemplate) {
    return (
      <FormTemplateEditor
        template={editingTemplate}
        isNew={isCreatingNew}
        onSave={(t) => saveTemplate.mutate(t)}
        onCancel={() => { setEditingTemplate(null); setIsCreatingNew(false); }}
        saving={saveTemplate.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Formulários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie, edite e gerencie formulários do escritório
          </p>
        </div>
        <Button onClick={() => setShowTemplateSelector(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Formulário
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="formularios" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="enviados" className="gap-2">
            <FileText className="h-4 w-4" />
            Enviados
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Modelos ── */}
        <TabsContent value="formularios" className="space-y-4">
          {templatesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(templates || []).map((t) => {
                const IconComp = ICON_MAP[t.icon] || FileText;
                const cat = CATEGORY_MAP[t.category] || CATEGORY_MAP.geral;
                return (
                  <Card key={t.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <IconComp className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{t.name}</h3>
                            <Badge variant="secondary" className={`mt-1 text-[10px] ${cat.color}`}>
                              {cat.label}
                            </Badge>
                          </div>
                        </div>
                        {t.is_system && (
                          <Badge variant="outline" className="text-[10px]">Sistema</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {t.description || "Sem descrição"}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        {t.questions.length} pergunta{t.questions.length !== 1 ? "s" : ""}
                      </div>
                      <div className="flex gap-2 pt-1 flex-wrap">
                        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleSelectTemplate(t)}>
                          <Pencil className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleDuplicateTemplate(t)}>
                          <Copy className="h-3 w-3" />
                          Duplicar
                        </Button>
                        {!t.is_system && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTemplate.mutate(t.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      {t.public_token && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full gap-1.5 text-xs mt-1"
                          onClick={() => {
                            const url = `${window.location.origin}/public/form/${t.public_token}`;
                            navigator.clipboard.writeText(url);
                            setCopiedId(t.id);
                            toast.success("Link público copiado!");
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                        >
                          {copiedId === t.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Link2 className="h-3 w-3" />}
                          {copiedId === t.id ? "Copiado!" : "Copiar Link Público"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── TAB: Enviados ── */}
        <TabsContent value="enviados" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10"><Clock className="h-5 w-5 text-amber-500" /></div>
                <div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>
                <div><p className="text-2xl font-bold">{stats.submitted}</p><p className="text-xs text-muted-foreground">Respondidos</p></div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por cliente ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="submitted">Respondido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {formsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>Nenhum formulário encontrado</p>
            </CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Respondido em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((form) => {
                    const status = STATUS_MAP[form.status] || STATUS_MAP.pending;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.ipromed_legal_clients?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`gap-1 ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />{status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(form.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {form.submitted_at ? format(new Date(form.submitted_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedForm(form)} title="Ver detalhes">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(form.token, form.id)} title="Copiar link">
                              {copiedId === form.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/cpg/clients/${form.client_id}`)} title="Ir para o cliente">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

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
              <InfoRow label="Cliente" value={selectedForm.doctor_name} />
              <InfoRow label="CNPJ" value={selectedForm.cnpj} />
              <InfoRow label="Endereço" value={selectedForm.clinic_address} />
              <InfoRow label="Status" value={(STATUS_MAP[selectedForm.status] || STATUS_MAP.pending).label} />
              <InfoRow label="Criado em" value={format(new Date(selectedForm.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} />
              {selectedForm.submitted_at && <InfoRow label="Respondido em" value={format(new Date(selectedForm.submitted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} />}
              <hr className="border-border" />
              <h4 className="font-semibold text-sm">Políticas configuradas</h4>
              <InfoRow label="Antecedência mín. cancelamento" value={selectedForm.cancel_min_hours ? `${selectedForm.cancel_min_hours}h` : null} />
              <InfoRow label="Multa por cancelamento" value={selectedForm.cancel_has_fine != null ? (selectedForm.cancel_has_fine ? "Sim" : "Não") : null} />
              <InfoRow label="Depósito obrigatório" value={selectedForm.deposit_required != null ? (selectedForm.deposit_required ? "Sim" : "Não") : null} />
              <InfoRow label="Possui retorno" value={selectedForm.has_followup != null ? (selectedForm.has_followup ? "Sim" : "Não") : null} />
              <InfoRow label="Teleconsulta" value={selectedForm.has_teleconsultation != null ? (selectedForm.has_teleconsultation ? "Sim" : "Não") : null} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar Novo Formulário
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Escolha um modelo pronto ou comece do zero.
          </p>
          <ScrollArea className="h-[55vh] pr-2">
            <div className="space-y-3">
              {/* From scratch option */}
              <button
                onClick={handleCreateFromScratch}
                className="w-full p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all text-left flex items-center gap-4"
              >
                <div className="p-3 rounded-lg bg-muted">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Formulário em branco</h3>
                  <p className="text-xs text-muted-foreground">
                    Comece do zero e adicione suas próprias perguntas
                  </p>
                </div>
              </button>

              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide py-2">
                Modelos para escritório jurídico
              </div>

              {(templates || []).map((t) => {
                const IconComp = ICON_MAP[t.icon] || FileText;
                const cat = CATEGORY_MAP[t.category] || CATEGORY_MAP.geral;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleDuplicateTemplate(t)}
                    className="w-full p-4 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all text-left flex items-center gap-4"
                  >
                    <div className="p-3 rounded-lg bg-primary/10">
                      <IconComp className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{t.name}</h3>
                        <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{t.questions.length} perguntas</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Form Template Editor ──

function FormTemplateEditor({
  template,
  isNew,
  onSave,
  onCancel,
  saving,
}: {
  template: FormTemplate;
  isNew: boolean;
  onSave: (t: Partial<FormTemplate> & { id?: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [category, setCategory] = useState(template.category);
  const [questions, setQuestions] = useState<FormQuestion[]>(template.questions);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        label: "",
        type: "text",
        required: false,
        order: questions.length + 1,
      },
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id).map((q, i) => ({ ...q, order: i + 1 })));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newQ = [...questions];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newQ.length) return;
    [newQ[index], newQ[target]] = [newQ[target], newQ[index]];
    setQuestions(newQ.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Nome do formulário é obrigatório"); return; }
    if (questions.some((q) => !q.label.trim())) { toast.error("Preencha o texto de todas as perguntas"); return; }
    onSave({
      id: isNew ? undefined : template.id,
      name,
      description,
      category,
      icon: template.icon,
      questions,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {isNew ? "Novo Formulário" : `Editar: ${template.name}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNew ? "Configure as perguntas do seu formulário" : "Edite as perguntas e configurações"}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </div>

      {/* Meta */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do formulário *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Onboarding de Cliente" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição do formulário..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Perguntas ({questions.length})</h2>
          <Button variant="outline" size="sm" onClick={addQuestion} className="gap-1">
            <Plus className="h-4 w-4" />
            Adicionar Pergunta
          </Button>
        </div>

        {questions.map((q, index) => (
          <Card key={q.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-2">
                  <button
                    onClick={() => moveQuestion(index, "up")}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
                  >
                    <GripVertical className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    onClick={() => moveQuestion(index, "down")}
                    disabled={index === questions.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      value={q.label}
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                      placeholder="Texto da pergunta..."
                      className="flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs whitespace-nowrap">Tipo:</Label>
                      <Select value={q.type} onValueChange={(v) => updateQuestion(q.id, { type: v as FormQuestion["type"] })}>
                        <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={q.required}
                        onCheckedChange={(v) => updateQuestion(q.id, { required: v })}
                        className="h-5 w-9"
                      />
                      <Label className="text-xs">Obrigatória</Label>
                    </div>
                  </div>

                  {q.type === "select" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Opções (separadas por vírgula)</Label>
                      <Input
                        value={(q.options || []).join(", ")}
                        onChange={(e) =>
                          updateQuestion(q.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
                        }
                        placeholder="Opção 1, Opção 2, Opção 3"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 mt-1" onClick={() => removeQuestion(q.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {questions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma pergunta adicionada</p>
              <Button variant="outline" size="sm" onClick={addQuestion} className="mt-3 gap-1">
                <Plus className="h-4 w-4" />
                Adicionar primeira pergunta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}
