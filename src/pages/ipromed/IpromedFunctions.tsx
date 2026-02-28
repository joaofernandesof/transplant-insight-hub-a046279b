/**
 * CPG Advocacia Médica - Funções do Escritório (Tabela)
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Briefcase, Trash2, Pencil, Search, Users, Shield, Scale,
  FileText, Gavel, BookOpen, AlertCircle, Loader2, ArrowUpDown, ArrowUp, ArrowDown,
  BarChart3, Tag, Hash,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";
import { ipromedTeam } from "./components/IpromedTeamProfiles";

const CATEGORIES = [
  { value: "tipos_processo", label: "Tipos de Processo", icon: Gavel, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "tipos_demanda", label: "Tipos de Demanda", icon: FileText, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "administrativa", label: "Administrativa", icon: Briefcase, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "compliance", label: "Compliance & LGPD", icon: Shield, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "consultoria", label: "Consultoria", icon: BookOpen, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
  { value: "contencioso", label: "Contencioso", icon: Scale, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { value: "geral", label: "Geral", icon: Users, color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300" },
];

const LAWYERS = ipromedTeam.map(m => ({ value: m.name, label: m.name, photo: m.photo, color: m.color, role: m.role }));

interface LawyerFunction {
  id: string;
  lawyer_name: string;
  category: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function IpromedFunctions() {
  const { user } = useUnifiedAuth();
  const [functions, setFunctions] = useState<LawyerFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLawyer, setFilterLawyer] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<"lawyer_name" | "title" | "category">("lawyer_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [form, setForm] = useState({
    lawyer_name: "",
    category: "geral",
    title: "",
    description: "",
  });

  const fetchFunctions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ipromed_lawyer_functions")
      .select("*")
      .order("lawyer_name")
      .order("category")
      .order("created_at", { ascending: false });

    if (!error && data) setFunctions(data as LawyerFunction[]);
    setLoading(false);
  };

  useEffect(() => { fetchFunctions(); }, []);

  const handleSave = async () => {
    if (!form.lawyer_name || !form.title) {
      toast.error("Preencha o nome da advogada e o título da função.");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("ipromed_lawyer_functions")
        .update({
          lawyer_name: form.lawyer_name,
          category: form.category,
          title: form.title,
          description: form.description || null,
        })
        .eq("id", editingId);

      if (error) { toast.error("Erro ao atualizar."); return; }
      toast.success("Função atualizada!");
    } else {
      const { error } = await supabase
        .from("ipromed_lawyer_functions")
        .insert({
          lawyer_name: form.lawyer_name,
          category: form.category,
          title: form.title,
          description: form.description || null,
          created_by: user?.id || "",
        });

      if (error) { toast.error("Erro ao criar."); return; }
      toast.success("Função cadastrada!");
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({ lawyer_name: "", category: "geral", title: "", description: "" });
    fetchFunctions();
  };

  const handleEdit = (fn: LawyerFunction) => {
    setEditingId(fn.id);
    setForm({
      lawyer_name: fn.lawyer_name,
      category: fn.category,
      title: fn.title,
      description: fn.description || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ipromed_lawyer_functions").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Função removida.");
    fetchFunctions();
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ lawyer_name: "", category: "geral", title: "", description: "" });
    setDialogOpen(true);
  };

  const filtered = functions.filter(fn => {
    if (filterLawyer !== "all" && fn.lawyer_name !== filterLawyer) return false;
    if (filterCategory !== "all" && fn.category !== filterCategory) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return fn.title.toLowerCase().includes(s) || (fn.description || "").toLowerCase().includes(s) || fn.lawyer_name.toLowerCase().includes(s);
    }
    return true;
  }).sort((a, b) => {
    const valA = a[sortColumn].toLowerCase();
    const valB = b[sortColumn].toLowerCase();
    return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];
  const getLawyerInfo = (name: string) => LAWYERS.find(l => l.value === name);

  const toggleSort = (col: "lawyer_name" | "title" | "category") => {
    if (sortColumn === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortColumn !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Compute insights
  const uniqueLawyers = [...new Set(functions.map(f => f.lawyer_name))];
  const uniqueCategories = [...new Set(functions.map(f => f.category))];
  const topCategory = uniqueCategories.length > 0
    ? uniqueCategories.reduce((best, cat) => {
        const count = functions.filter(f => f.category === cat).length;
        return count > (best.count || 0) ? { cat, count } : best;
      }, { cat: "", count: 0 })
    : { cat: "", count: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Funções do Escritório
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Responsabilidades e atribuições de cada advogada
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Função
        </Button>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{functions.length}</p>
              <p className="text-xs text-muted-foreground">Total de Funções</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{uniqueLawyers.length}</p>
              <p className="text-xs text-muted-foreground">Responsáveis</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <Tag className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold">{uniqueCategories.length}</p>
              <p className="text-xs text-muted-foreground">Categorias</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{topCategory.cat ? getCategoryInfo(topCategory.cat).label : "—"}</p>
              <p className="text-xs text-muted-foreground">Top Categoria ({topCategory.count})</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Lawyer Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {uniqueLawyers.sort().map(name => {
          const info = getLawyerInfo(name);
          const count = functions.filter(f => f.lawyer_name === name).length;
          const isActive = filterLawyer === name;
          return (
            <button
              key={name}
              onClick={() => setFilterLawyer(isActive ? "all" : name)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all hover:shadow-sm ${isActive ? 'ring-2 ring-primary bg-primary/5' : 'bg-card hover:bg-muted/40'}`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={info?.photo} alt={name} className="object-cover" />
                <AvatarFallback className={`text-xs ${info?.color || ''}`}>
                  {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{name.split(" ")[0]}</p>
                <p className="text-[10px] text-muted-foreground">{count} {count === 1 ? "função" : "funções"}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterLawyer} onValueChange={setFilterLawyer}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Advogada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {LAWYERS.map(l => (
              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} de {functions.length} funções
          {filterLawyer !== "all" || filterCategory !== "all" || searchTerm ? " (filtrado)" : ""}
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma função encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Clique em "Nova Função" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[220px] cursor-pointer select-none" onClick={() => toggleSort("lawyer_name")}>
                    <span className="flex items-center">Responsável <SortIcon col="lawyer_name" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("title")}>
                    <span className="flex items-center">Função <SortIcon col="title" /></span>
                  </TableHead>
                  <TableHead className="w-[160px] cursor-pointer select-none" onClick={() => toggleSort("category")}>
                    <span className="flex items-center">Categoria <SortIcon col="category" /></span>
                  </TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((fn) => {
                  const cat = getCategoryInfo(fn.category);
                  const CatIcon = cat.icon;
                  const lawyerInfo = getLawyerInfo(fn.lawyer_name);
                  return (
                    <TableRow key={fn.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={lawyerInfo?.photo} alt={fn.lawyer_name} className="object-cover" />
                            <AvatarFallback className={`text-xs ${lawyerInfo?.color || ''}`}>
                              {fn.lawyer_name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{fn.lawyer_name}</p>
                            {lawyerInfo?.role && (
                              <p className="text-[11px] text-muted-foreground truncate">{lawyerInfo.role}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{fn.title}</p>
                        {fn.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{fn.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cat.color} text-xs`}>
                          <CatIcon className="h-3 w-3 mr-1" />
                          {cat.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(fn)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(fn.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Função" : "Nova Função"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Advogada *</label>
              <Select value={form.lawyer_name} onValueChange={v => setForm(f => ({ ...f, lawyer_name: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a advogada" />
                </SelectTrigger>
                <SelectContent>
                  {LAWYERS.map(l => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Título da Função *</label>
              <Input
                placeholder="Ex: Defesa em processos éticos"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição</label>
              <Textarea
                placeholder="Detalhe a responsabilidade..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
