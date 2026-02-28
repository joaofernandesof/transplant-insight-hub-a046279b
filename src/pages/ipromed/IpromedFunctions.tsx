/**
 * CPG Advocacia Médica - Funções do Escritório (Tabela)
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart3, TrendingUp, CheckCircle2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";
import { ipromedTeam } from "./components/IpromedTeamProfiles";

const CATEGORIES = [
  { value: "Contratual", label: "Contratual", icon: Gavel, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "Contencioso", label: "Contencioso", icon: Scale, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { value: "Administrativo", label: "Administrativo", icon: Briefcase, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "Compliance", label: "Compliance & LGPD", icon: Shield, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "Societário", label: "Societário", icon: BookOpen, color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
  { value: "Consultoria", label: "Consultoria", icon: FileText, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "Geral", label: "Geral", icon: Users, color: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300" },
];

const LAWYER_COLORS = [
  { bg: "from-emerald-500 to-teal-600", text: "text-white", pie: "#10B981" },
  { bg: "from-blue-500 to-indigo-600", text: "text-white", pie: "#3B82F6" },
  { bg: "from-purple-500 to-violet-600", text: "text-white", pie: "#8B5CF6" },
  { bg: "from-rose-500 to-pink-600", text: "text-white", pie: "#F43F5E" },
  { bg: "from-amber-500 to-orange-600", text: "text-white", pie: "#F59E0B" },
];

const CATEGORY_COLORS = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#F43F5E", "#6366F1", "#64748B"];

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

  // Analytics data
  const uniqueLawyers = [...new Set(functions.map(f => f.lawyer_name))].sort();
  const uniqueCategories = [...new Set(functions.map(f => f.category))];

  const lawyerStats = useMemo(() => uniqueLawyers.map((name, i) => {
    const count = functions.filter(f => f.lawyer_name === name).length;
    const cats = [...new Set(functions.filter(f => f.lawyer_name === name).map(f => f.category))].length;
    const colorSet = LAWYER_COLORS[i % LAWYER_COLORS.length];
    return { name, count, cats, ...colorSet };
  }), [functions, uniqueLawyers]);

  const avgFunctions = uniqueLawyers.length > 0 ? Math.round(functions.length / uniqueLawyers.length) : 0;
  const maxFunctions = lawyerStats.length > 0 ? Math.max(...lawyerStats.map(l => l.count)) : 0;
  const minFunctions = lawyerStats.length > 0 ? Math.min(...lawyerStats.map(l => l.count)) : 0;
  const balanceScore = maxFunctions > 0 ? Math.round((1 - (maxFunctions - minFunctions) / maxFunctions) * 100) : 100;

  const pieData = lawyerStats.map(l => ({ name: l.name.split(" ")[0], value: l.count, fill: l.pie }));

  const categoryBarData = useMemo(() => {
    return CATEGORIES.filter(c => functions.some(f => f.category === c.value)).map((c, i) => {
      const entry: Record<string, string | number> = { category: c.label };
      uniqueLawyers.forEach(name => {
        entry[name.split(" ")[0]] = functions.filter(f => f.category === c.value && f.lawyer_name === name).length;
      });
      return entry;
    });
  }, [functions, uniqueLawyers]);

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

      {/* Colorful User Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Summary widget */}
        <button
          onClick={() => setFilterLawyer("all")}
          className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${filterLawyer === "all" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Visão Geral</p>
                <p className="text-[11px] text-white/70">Todas as funções</p>
              </div>
            </div>
            <div className="flex items-end gap-6">
              <div>
                <p className="text-4xl font-black">{functions.length}</p>
                <p className="text-[11px] text-white/70 mt-0.5">total</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueCategories.length}</p>
                <p className="text-[11px] text-white/70 mt-0.5">categorias</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueLawyers.length}</p>
                <p className="text-[11px] text-white/70 mt-0.5">pessoas</p>
              </div>
            </div>
          </div>
        </button>

        {lawyerStats.map((lawyer) => {
          const info = getLawyerInfo(lawyer.name);
          const isActive = filterLawyer === lawyer.name;
          const pct = functions.length > 0 ? Math.round((lawyer.count / functions.length) * 100) : 0;
          return (
            <button
              key={lawyer.name}
              onClick={() => setFilterLawyer(isActive ? "all" : lawyer.name)}
              className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${lawyer.bg}`} />
              <div className="relative z-10 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12 border-2 border-white/30">
                    <AvatarImage src={info?.photo} alt={lawyer.name} className="object-cover" />
                    <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
                      {lawyer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{lawyer.name}</p>
                    <p className="text-[11px] text-white/70 truncate">{info?.role}</p>
                  </div>
                </div>
                <div className="flex items-end gap-5">
                  <div>
                    <p className="text-4xl font-black">{lawyer.count}</p>
                    <p className="text-[11px] text-white/70 mt-0.5">funções</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{lawyer.cats}</p>
                    <p className="text-[11px] text-white/70 mt-0.5">categorias</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-2xl font-bold">{pct}%</p>
                    <p className="text-[11px] text-white/70 mt-0.5">do total</p>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Balance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Balance Score */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Índice de Equilíbrio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke={balanceScore >= 80 ? "#10B981" : balanceScore >= 50 ? "#F59E0B" : "#EF4444"}
                    strokeWidth="3"
                    strokeDasharray={`${balanceScore} ${100 - balanceScore}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">{balanceScore}%</span>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Média: <strong className="text-foreground">{avgFunctions} funções</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">Máx: <strong className="text-foreground">{maxFunctions}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-muted-foreground">Mín: <strong className="text-foreground">{minFunctions}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-3.5 w-3.5 ${balanceScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span className="text-muted-foreground">
                    {balanceScore >= 80 ? "Bem distribuído" : balanceScore >= 50 ? "Desbalanceado" : "Muito desigual"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pie chart - Distribution per person */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Distribuição por Pessoa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  formatter={(value: number) => [`${value} funções`, ""]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar chart - Categories per person */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Funções por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={categoryBarData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="category" width={80} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                />
                {uniqueLawyers.map((name, i) => (
                  <Bar key={name} dataKey={name.split(" ")[0]} stackId="a" fill={LAWYER_COLORS[i % LAWYER_COLORS.length].pie} radius={i === uniqueLawyers.length - 1 ? [0, 4, 4, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
