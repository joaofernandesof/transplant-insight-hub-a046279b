import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ClipboardList, Eye, Copy, Link2, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  class_id: string | null;
  survey_type: string;
  is_active: boolean;
  is_required: boolean;
  created_at: string;
  course_classes?: { name: string; code: string } | null;
}

interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  scale_min: number;
  scale_max: number;
  scale_labels: Record<string, string> | null;
  is_required: boolean;
  order_index: number;
  category: string | null;
}

interface CourseClass {
  id: string;
  name: string;
  code: string;
  status: string;
}

export function SurveyManagement() {
  const queryClient = useQueryClient();
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [activeTab, setActiveTab] = useState("surveys");

  // Form state for new survey
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    class_id: "",
    survey_type: "satisfaction",
    is_active: true,
    is_required: false
  });

  // Form state for new question
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "rating",
    options: [""],
    scale_min: 1,
    scale_max: 5,
    is_required: true,
    category: ""
  });

  // Fetch surveys
  const { data: surveys, isLoading: surveysLoading } = useQuery({
    queryKey: ["surveys-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select(`*, course_classes(name, code)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Survey[];
    }
  });

  // Fetch classes for dropdown
  const { data: classes } = useQuery({
    queryKey: ["classes-for-surveys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_classes")
        .select("id, name, code, status")
        .in("status", ["active", "in_progress", "pending"])
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as CourseClass[];
    }
  });

  // Fetch questions for selected survey
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["survey-questions", selectedSurvey?.id],
    queryFn: async () => {
      if (!selectedSurvey) return [];
      const { data, error } = await supabase
        .from("survey_questions")
        .select("*")
        .eq("survey_id", selectedSurvey.id)
        .order("order_index");
      if (error) throw error;
      return data as SurveyQuestion[];
    },
    enabled: !!selectedSurvey
  });

  // Create survey mutation
  const createSurvey = useMutation({
    mutationFn: async (survey: typeof newSurvey) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("surveys")
        .insert({
          title: survey.title,
          description: survey.description || null,
          class_id: survey.class_id || null,
          survey_type: survey.survey_type,
          is_active: survey.is_active,
          is_required: survey.is_required,
          created_by: user?.id
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys-admin"] });
      setIsCreateDialogOpen(false);
      setNewSurvey({ title: "", description: "", class_id: "", survey_type: "satisfaction", is_active: true, is_required: false });
      toast.success("Pesquisa criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar pesquisa: " + error.message);
    }
  });

  // Delete survey mutation
  const deleteSurvey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("surveys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys-admin"] });
      if (selectedSurvey) setSelectedSurvey(null);
      toast.success("Pesquisa excluída!");
    }
  });

  // Create/update question mutation
  const saveQuestion = useMutation({
    mutationFn: async (question: typeof newQuestion & { id?: string }) => {
      const payload = {
        survey_id: selectedSurvey!.id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.question_type.includes("choice") ? question.options.filter(o => o.trim()) : null,
        scale_min: question.scale_min,
        scale_max: question.scale_max,
        is_required: question.is_required,
        category: question.category || null,
        order_index: questions?.length || 0
      };

      if (question.id) {
        const { error } = await supabase.from("survey_questions").update(payload).eq("id", question.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("survey_questions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-questions", selectedSurvey?.id] });
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      setNewQuestion({ question_text: "", question_type: "rating", options: [""], scale_min: 1, scale_max: 5, is_required: true, category: "" });
      toast.success("Pergunta salva!");
    }
  });

  // Delete question mutation
  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("survey_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["survey-questions", selectedSurvey?.id] });
      toast.success("Pergunta excluída!");
    }
  });

  // Duplicate survey mutation
  const duplicateSurvey = useMutation({
    mutationFn: async (survey: Survey) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create new survey
      const { data: newSurveyData, error: surveyError } = await supabase
        .from("surveys")
        .insert({
          title: `${survey.title} (cópia)`,
          description: survey.description,
          class_id: null, // Don't copy class assignment
          survey_type: survey.survey_type,
          is_active: false,
          is_required: survey.is_required,
          created_by: user?.id
        })
        .select()
        .single();
      if (surveyError) throw surveyError;

      // Copy questions
      const { data: originalQuestions } = await supabase
        .from("survey_questions")
        .select("*")
        .eq("survey_id", survey.id);

      if (originalQuestions && originalQuestions.length > 0) {
        const newQuestions = originalQuestions.map(q => ({
          survey_id: newSurveyData.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          scale_min: q.scale_min,
          scale_max: q.scale_max,
          scale_labels: q.scale_labels,
          is_required: q.is_required,
          order_index: q.order_index,
          category: q.category
        }));
        await supabase.from("survey_questions").insert(newQuestions);
      }

      return newSurveyData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys-admin"] });
      toast.success("Pesquisa duplicada!");
    }
  });

  const questionTypes = [
    { value: "rating", label: "Avaliação (1-5)" },
    { value: "scale", label: "Escala Numérica" },
    { value: "text", label: "Texto Livre" },
    { value: "single_choice", label: "Escolha Única" },
    { value: "multiple_choice", label: "Múltipla Escolha" }
  ];

  const surveyTypes = [
    { value: "satisfaction", label: "Satisfação" },
    { value: "feedback", label: "Feedback" },
    { value: "nps", label: "NPS" },
    { value: "custom", label: "Personalizada" }
  ];

  return (
    <ModuleLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-emerald-600" />
              Gestão de Pesquisas
            </h1>
            <p className="text-sm text-muted-foreground">Crie e vincule pesquisas às turmas</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Pesquisa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Nova Pesquisa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={newSurvey.title}
                    onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                    placeholder="Ex: Pesquisa de Satisfação Day 1"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={newSurvey.description}
                    onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                    placeholder="Descrição opcional..."
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={newSurvey.survey_type}
                    onValueChange={(v) => setNewSurvey({ ...newSurvey, survey_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {surveyTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vincular à Turma (opcional)</Label>
                  <Select
                    value={newSurvey.class_id}
                    onValueChange={(v) => setNewSurvey({ ...newSurvey, class_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma (template)</SelectItem>
                      {classes?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativa</Label>
                  <Switch
                    checked={newSurvey.is_active}
                    onCheckedChange={(v) => setNewSurvey({ ...newSurvey, is_active: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Obrigatória</Label>
                  <Switch
                    checked={newSurvey.is_required}
                    onCheckedChange={(v) => setNewSurvey({ ...newSurvey, is_required: v })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => createSurvey.mutate(newSurvey)} disabled={!newSurvey.title}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Surveys List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pesquisas ({surveys?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-1 p-3">
                  {surveysLoading ? (
                    <p className="text-sm text-muted-foreground p-2">Carregando...</p>
                  ) : surveys?.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">Nenhuma pesquisa criada</p>
                  ) : (
                    surveys?.map((survey) => (
                      <div
                        key={survey.id}
                        onClick={() => setSelectedSurvey(survey)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                          selectedSurvey?.id === survey.id
                            ? "bg-primary/10 border-primary/30"
                            : "hover:bg-muted/50 border-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{survey.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {survey.course_classes ? `${survey.course_classes.code}` : "Template"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={survey.is_active ? "default" : "secondary"} className="text-[10px]">
                              {survey.is_active ? "Ativa" : "Inativa"}
                            </Badge>
                            {survey.is_required && (
                              <Badge variant="outline" className="text-[10px]">Obrigatória</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Survey Details & Questions */}
          <Card className="lg:col-span-2">
            {selectedSurvey ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedSurvey.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedSurvey.course_classes 
                          ? `Vinculada: ${selectedSurvey.course_classes.code} - ${selectedSurvey.course_classes.name}`
                          : "Template (não vinculada)"
                        }
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => duplicateSurvey.mutate(selectedSurvey)}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (confirm("Excluir esta pesquisa?")) deleteSurvey.mutate(selectedSurvey.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Perguntas ({questions?.length || 0})</h3>
                      <Button size="sm" onClick={() => setIsQuestionDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>

                    <ScrollArea className="h-[50vh]">
                      <div className="space-y-2 pr-4">
                        {questionsLoading ? (
                          <p className="text-sm text-muted-foreground">Carregando...</p>
                        ) : questions?.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhuma pergunta. Adicione perguntas à pesquisa.</p>
                        ) : (
                          questions?.map((q, idx) => (
                            <div key={q.id} className="p-3 rounded-lg border bg-muted/30">
                              <div className="flex items-start gap-3">
                                <span className="text-xs font-bold text-muted-foreground bg-background px-2 py-1 rounded">
                                  {idx + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{q.question_text}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px]">
                                      {questionTypes.find(t => t.value === q.question_type)?.label}
                                    </Badge>
                                    {q.category && (
                                      <Badge variant="secondary" className="text-[10px]">{q.category}</Badge>
                                    )}
                                    {q.is_required && (
                                      <span className="text-[10px] text-destructive">*Obrigatória</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setEditingQuestion(q);
                                      setNewQuestion({
                                        question_text: q.question_text,
                                        question_type: q.question_type,
                                        options: q.options || [""],
                                        scale_min: q.scale_min,
                                        scale_max: q.scale_max,
                                        is_required: q.is_required,
                                        category: q.category || ""
                                      });
                                      setIsQuestionDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => {
                                      if (confirm("Excluir esta pergunta?")) deleteQuestion.mutate(q.id);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-30" />
                <p>Selecione uma pesquisa para gerenciar</p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Question Dialog */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => {
          setIsQuestionDialogOpen(open);
          if (!open) {
            setEditingQuestion(null);
            setNewQuestion({ question_text: "", question_type: "rating", options: [""], scale_min: 1, scale_max: 5, is_required: true, category: "" });
          }
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Editar Pergunta" : "Nova Pergunta"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Pergunta</Label>
                <Textarea
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  placeholder="Digite a pergunta..."
                />
              </div>
              <div>
                <Label>Tipo de Resposta</Label>
                <Select
                  value={newQuestion.question_type}
                  onValueChange={(v) => setNewQuestion({ ...newQuestion, question_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newQuestion.question_type.includes("choice") && (
                <div>
                  <Label>Opções</Label>
                  <div className="space-y-2 mt-2">
                    {newQuestion.options.map((opt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQuestion.options];
                            updated[idx] = e.target.value;
                            setNewQuestion({ ...newQuestion, options: updated });
                          }}
                          placeholder={`Opção ${idx + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const updated = newQuestion.options.filter((_, i) => i !== idx);
                            setNewQuestion({ ...newQuestion, options: updated.length ? updated : [""] });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewQuestion({ ...newQuestion, options: [...newQuestion.options, ""] })}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Opção
                    </Button>
                  </div>
                </div>
              )}

              {newQuestion.question_type === "scale" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Mínimo</Label>
                    <Input
                      type="number"
                      value={newQuestion.scale_min}
                      onChange={(e) => setNewQuestion({ ...newQuestion, scale_min: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Máximo</Label>
                    <Input
                      type="number"
                      value={newQuestion.scale_max}
                      onChange={(e) => setNewQuestion({ ...newQuestion, scale_max: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Categoria (opcional)</Label>
                <Input
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  placeholder="Ex: Instrutor, Infraestrutura, Conteúdo..."
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Resposta Obrigatória</Label>
                <Switch
                  checked={newQuestion.is_required}
                  onCheckedChange={(v) => setNewQuestion({ ...newQuestion, is_required: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Cancelar</Button>
              <Button 
                onClick={() => saveQuestion.mutate(editingQuestion ? { ...newQuestion, id: editingQuestion.id } : newQuestion)} 
                disabled={!newQuestion.question_text}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}

export default SurveyManagement;
