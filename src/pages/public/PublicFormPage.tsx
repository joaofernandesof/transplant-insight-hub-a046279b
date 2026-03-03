/**
 * Página pública de formulário - acesso via token único sem autenticação
 */

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, Loader2, CheckCircle2, AlertCircle, Send,
} from "lucide-react";
import { toast } from "sonner";

interface FormQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "boolean" | "select" | "number";
  options?: string[];
  required: boolean;
  order: number;
}

export default function PublicFormPage() {
  const { token } = useParams<{ token: string }>();
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: template, isLoading, error } = useQuery({
    queryKey: ["public-form-template", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ipromed_form_templates")
        .select("id, name, description, category, questions, is_active, public_token")
        .eq("public_token", token!)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return {
        ...data,
        questions: (typeof data.questions === "string"
          ? JSON.parse(data.questions)
          : data.questions) as FormQuestion[],
      };
    },
    enabled: !!token,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("ipromed_public_form_submissions")
        .insert({
          template_id: template!.id,
          respondent_name: respondentName || null,
          respondent_email: respondentEmail || null,
          answers,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Formulário enviado com sucesso!");
    },
    onError: () => toast.error("Erro ao enviar formulário. Tente novamente."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    const questions = template?.questions || [];
    const missing = questions.filter(
      (q) => q.required && (answers[q.id] === undefined || answers[q.id] === "" || answers[q.id] === null)
    );
    if (missing.length > 0) {
      toast.error(`Preencha todas as perguntas obrigatórias (${missing.length} pendente${missing.length > 1 ? "s" : ""})`);
      return;
    }

    submitMutation.mutate();
  };

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error / not found
  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Formulário não encontrado</h2>
            <p className="text-sm text-muted-foreground">
              O link pode estar expirado ou inválido. Entre em contato com o escritório.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
            <h2 className="text-lg font-semibold mb-2">Formulário enviado!</h2>
            <p className="text-sm text-muted-foreground">
              Suas respostas foram registradas com sucesso. Obrigado!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = template.questions.sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{template.name}</CardTitle>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Respondent info */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Seus dados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          {questions.map((q, index) => (
            <Card key={q.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-bold text-muted-foreground mt-0.5">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">
                      {q.label}
                      {q.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  </div>
                </div>

                {q.type === "text" && (
                  <Input
                    value={answers[q.id] || ""}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder="Sua resposta..."
                  />
                )}

                {q.type === "textarea" && (
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder="Sua resposta..."
                    rows={3}
                  />
                )}

                {q.type === "number" && (
                  <Input
                    type="number"
                    value={answers[q.id] || ""}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    placeholder="0"
                  />
                )}

                {q.type === "boolean" && (
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={answers[q.id] === true}
                      onCheckedChange={(v) => updateAnswer(q.id, v)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {answers[q.id] === true ? "Sim" : "Não"}
                    </span>
                  </div>
                )}

                {q.type === "select" && q.options && (
                  <Select
                    value={answers[q.id] || ""}
                    onValueChange={(v) => updateAnswer(q.id, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção..." />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar Formulário
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Formulário seguro • NeoHub
        </p>
      </div>
    </div>
  );
}
