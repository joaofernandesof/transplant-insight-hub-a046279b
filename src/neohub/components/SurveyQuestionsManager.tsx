import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GripVertical,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Plus,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Settings2,
  ListChecks,
  MessageSquare,
  ToggleLeft,
  Hash,
  X,
} from "lucide-react";
import {
  useSurveyQuestionsConfig,
  SurveyQuestionConfig,
  CATEGORY_LABELS,
  QUESTION_TYPE_LABELS,
} from "@/neohub/hooks/useSurveyQuestionsConfig";

interface SurveyQuestionsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUESTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  select: <ListChecks className="h-4 w-4" />,
  text: <MessageSquare className="h-4 w-4" />,
  boolean: <ToggleLeft className="h-4 w-4" />,
  scale: <Hash className="h-4 w-4" />,
};

export function SurveyQuestionsManager({ open, onOpenChange }: SurveyQuestionsManagerProps) {
  const {
    questions,
    isLoading,
    updateQuestion,
    reorderQuestions,
    toggleVisibility,
    deleteQuestion,
    createQuestion,
  } = useSurveyQuestionsConfig();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestionConfig | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<SurveyQuestionConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    question_label: "",
    question_key: "",
    question_type: "select" as SurveyQuestionConfig['question_type'],
    category: "general" as SurveyQuestionConfig['category'],
    options: "",
    is_required: false,
    target_person: "",
  });

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        q.question_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.question_key.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [questions, searchQuery, categoryFilter]);

  const groupedQuestions = useMemo(() => {
    const groups: Record<string, SurveyQuestionConfig[]> = {};
    filteredQuestions.forEach((q) => {
      if (!groups[q.category]) {
        groups[q.category] = [];
      }
      groups[q.category].push(q);
    });
    return groups;
  }, [filteredQuestions]);

  const handleMoveUp = (question: SurveyQuestionConfig) => {
    const categoryQuestions = questions.filter((q) => q.category === question.category);
    const currentIndex = categoryQuestions.findIndex((q) => q.id === question.id);
    if (currentIndex <= 0) return;

    const prevQuestion = categoryQuestions[currentIndex - 1];
    reorderQuestions.mutate([
      { id: question.id, order_index: prevQuestion.order_index },
      { id: prevQuestion.id, order_index: question.order_index },
    ]);
  };

  const handleMoveDown = (question: SurveyQuestionConfig) => {
    const categoryQuestions = questions.filter((q) => q.category === question.category);
    const currentIndex = categoryQuestions.findIndex((q) => q.id === question.id);
    if (currentIndex >= categoryQuestions.length - 1) return;

    const nextQuestion = categoryQuestions[currentIndex + 1];
    reorderQuestions.mutate([
      { id: question.id, order_index: nextQuestion.order_index },
      { id: nextQuestion.id, order_index: question.order_index },
    ]);
  };

  const handleEdit = (question: SurveyQuestionConfig) => {
    setEditingQuestion(question);
    setFormData({
      question_label: question.question_label,
      question_key: question.question_key,
      question_type: question.question_type,
      category: question.category,
      options: question.options ? question.options.join("\n") : "",
      is_required: question.is_required,
      target_person: question.target_person || "",
    });
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      question_label: "",
      question_key: "",
      question_type: "select",
      category: "general",
      options: "",
      is_required: false,
      target_person: "",
    });
  };

  const handleSave = () => {
    const options = formData.options
      .split("\n")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (editingQuestion) {
      updateQuestion.mutate({
        id: editingQuestion.id,
        question_label: formData.question_label,
        question_type: formData.question_type,
        category: formData.category,
        options: options.length > 0 ? options : null,
        is_required: formData.is_required,
        target_person: formData.target_person || null,
      });
      setEditingQuestion(null);
    } else if (isCreating) {
      const maxOrder = Math.max(...questions.map((q) => q.order_index), 0);
      createQuestion.mutate({
        question_label: formData.question_label,
        question_key: formData.question_key || formData.question_label.toLowerCase().replace(/\s+/g, "_"),
        question_type: formData.question_type,
        category: formData.category,
        options: options.length > 0 ? options : null,
        order_index: maxOrder + 1,
        is_visible: true,
        is_required: formData.is_required,
        target_person: formData.target_person || null,
      });
      setIsCreating(false);
    }
  };

  const handleDelete = () => {
    if (questionToDelete) {
      deleteQuestion.mutate(questionToDelete.id);
      setQuestionToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Gerenciar Perguntas da Pesquisa
            </DialogTitle>
            <DialogDescription>
              Edite, ordene, oculte ou exclua perguntas da pesquisa de satisfação
            </DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 py-3 border-b">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar perguntas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Pergunta
            </Button>
          </div>

          {/* Questions List */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => {
                const categoryConfig = CATEGORY_LABELS[category];
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${categoryConfig.bgColor} ${categoryConfig.color} border-0`}>
                        {categoryConfig.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {categoryQuestions.length} perguntas
                      </span>
                    </div>

                    <div className="space-y-2">
                      {categoryQuestions.map((question, idx) => (
                        <Card
                          key={question.id}
                          className={`transition-all ${
                            !question.is_visible ? "opacity-50 bg-muted/30" : ""
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleMoveUp(question)}
                                  disabled={idx === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleMoveDown(question)}
                                  disabled={idx === categoryQuestions.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {question.question_key}
                                  </span>
                                  {question.is_required && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                      Obrigatória
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-medium text-sm">{question.question_label}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs gap-1">
                                    {QUESTION_TYPE_ICONS[question.question_type]}
                                    {QUESTION_TYPE_LABELS[question.question_type]}
                                  </Badge>
                                  {question.target_person && (
                                    <Badge variant="secondary" className="text-xs">
                                      {question.target_person}
                                    </Badge>
                                  )}
                                  {question.options && question.options.length > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      {question.options.length} opções
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    toggleVisibility.mutate({
                                      id: question.id,
                                      is_visible: !question.is_visible,
                                    })
                                  }
                                >
                                  {question.is_visible ? (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(question)}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setQuestionToDelete(question)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredQuestions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma pergunta encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{questions.length} perguntas no total</span>
              <span>•</span>
              <span>{questions.filter((q) => q.is_visible).length} visíveis</span>
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog
        open={!!editingQuestion || isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setEditingQuestion(null);
            setIsCreating(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Editar Pergunta" : "Nova Pergunta"}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion
                ? "Altere os dados da pergunta abaixo"
                : "Preencha os dados para criar uma nova pergunta"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Texto da Pergunta</Label>
              <Input
                value={formData.question_label}
                onChange={(e) => setFormData({ ...formData, question_label: e.target.value })}
                placeholder="Ex: Como você avalia a organização do evento?"
              />
            </div>

            {isCreating && (
              <div className="space-y-2">
                <Label>Chave da Pergunta</Label>
                <Input
                  value={formData.question_key}
                  onChange={(e) => setFormData({ ...formData, question_key: e.target.value })}
                  placeholder="Ex: q_organization (gerado automaticamente se vazio)"
                  className="font-mono text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.question_type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, question_type: v as SurveyQuestionConfig['question_type'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {QUESTION_TYPE_ICONS[key]}
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v as SurveyQuestionConfig['category'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.question_type === "select" && (
              <div className="space-y-2">
                <Label>Opções (uma por linha)</Label>
                <Textarea
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder={"Excelente\nMuito Bom\nBom\nRegular\nRuim"}
                  rows={5}
                />
              </div>
            )}

            {(formData.category === "instructor" || formData.category === "monitor") && (
              <div className="space-y-2">
                <Label>Pessoa Alvo</Label>
                <Input
                  value={formData.target_person}
                  onChange={(e) => setFormData({ ...formData, target_person: e.target.value })}
                  placeholder="Ex: hygor, patrick, eder"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_required}
                onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
              />
              <Label>Pergunta obrigatória</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingQuestion(null);
                setIsCreating(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.question_label}>
              {editingQuestion ? "Salvar Alterações" : "Criar Pergunta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pergunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A pergunta "{questionToDelete?.question_label}" será
              permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
