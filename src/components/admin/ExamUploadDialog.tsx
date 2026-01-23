import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ParsedQuestion {
  order_index: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

interface ParsedExam {
  title: string;
  description?: string;
  duration_minutes: number;
  passing_score: number;
  questions: ParsedQuestion[];
}

interface ExamUploadDialogProps {
  onSuccess?: () => void;
}

export function ExamUploadDialog({ onSuccess }: ExamUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedExam, setParsedExam] = useState<ParsedExam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        'Nº': 1,
        'Questão': 'Qual é a capital do Brasil?',
        'Opção A': 'São Paulo',
        'Opção B': 'Rio de Janeiro',
        'Opção C': 'Brasília',
        'Opção D': 'Salvador',
        'Opção E': 'Belo Horizonte',
        'Gabarito': 'C',
        'Explicação': 'Brasília é a capital federal do Brasil desde 1960.'
      },
      {
        'Nº': 2,
        'Questão': 'Qual técnica preserva melhor os folículos capilares?',
        'Opção A': 'FUT tradicional',
        'Opção B': 'FUE com punch manual',
        'Opção C': 'Raspagem completa',
        'Opção D': 'Incisões profundas',
        'Opção E': 'Nenhuma das alternativas',
        'Gabarito': 'B',
        'Explicação': 'O FUE com punch manual permite maior precisão e menos trauma aos folículos.'
      },
    ];

    const configData = [
      {
        'Campo': 'Título da Prova',
        'Valor': 'Nome da Prova Aqui'
      },
      {
        'Campo': 'Descrição',
        'Valor': 'Descrição opcional da prova'
      },
      {
        'Campo': 'Duração (minutos)',
        'Valor': 40
      },
      {
        'Campo': 'Nota Mínima (%)',
        'Valor': 70
      }
    ];

    const wb = XLSX.utils.book_new();
    
    // Sheet de configuração
    const wsConfig = XLSX.utils.json_to_sheet(configData);
    wsConfig['!cols'] = [{ wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsConfig, 'Configuração');
    
    // Sheet de questões
    const wsQuestions = XLSX.utils.json_to_sheet(templateData);
    wsQuestions['!cols'] = [
      { wch: 4 },   // Nº
      { wch: 60 },  // Questão
      { wch: 40 },  // Opção A
      { wch: 40 },  // Opção B
      { wch: 40 },  // Opção C
      { wch: 40 },  // Opção D
      { wch: 40 },  // Opção E
      { wch: 8 },   // Gabarito
      { wch: 50 },  // Explicação
    ];
    XLSX.utils.book_append_sheet(wb, wsQuestions, 'Questões');

    XLSX.writeFile(wb, 'template-prova.xlsx');
    toast.success('Template baixado!');
  };

  const parseExcelFile = (file: File) => {
    setError(null);
    setParsedExam(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Ler configuração
        const configSheet = workbook.Sheets['Configuração'];
        if (!configSheet) {
          setError('Planilha "Configuração" não encontrada. Use o template correto.');
          return;
        }

        const configData = XLSX.utils.sheet_to_json<{ Campo: string; Valor: string | number }>(configSheet);
        const getConfigValue = (field: string) => {
          const row = configData.find(r => r.Campo === field);
          return row?.Valor;
        };

        const title = getConfigValue('Título da Prova')?.toString();
        if (!title) {
          setError('Título da prova é obrigatório na aba Configuração.');
          return;
        }

        // Ler questões
        const questionsSheet = workbook.Sheets['Questões'];
        if (!questionsSheet) {
          setError('Planilha "Questões" não encontrada. Use o template correto.');
          return;
        }

        const questionsData = XLSX.utils.sheet_to_json<Record<string, any>>(questionsSheet);
        if (questionsData.length === 0) {
          setError('Nenhuma questão encontrada na aba Questões.');
          return;
        }

        const questions: ParsedQuestion[] = questionsData.map((row, idx) => {
          const options = [
            row['Opção A'] || '',
            row['Opção B'] || '',
            row['Opção C'] || '',
            row['Opção D'] || '',
            row['Opção E'] || '',
          ].filter(opt => opt.toString().trim() !== '');

          return {
            order_index: row['Nº'] || idx + 1,
            question_text: row['Questão'] || '',
            options,
            correct_answer: row['Gabarito']?.toString().toUpperCase() || 'A',
            explanation: row['Explicação'] || '',
          };
        });

        // Validar questões
        const invalidQuestions = questions.filter(
          q => !q.question_text || q.options.length < 2
        );
        if (invalidQuestions.length > 0) {
          setError(`${invalidQuestions.length} questão(ões) inválida(s). Cada questão precisa de texto e pelo menos 2 opções.`);
          return;
        }

        setParsedExam({
          title,
          description: getConfigValue('Descrição')?.toString() || '',
          duration_minutes: Number(getConfigValue('Duração (minutos)')) || 40,
          passing_score: Number(getConfigValue('Nota Mínima (%)')) || 70,
          questions,
        });

      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
        setError('Erro ao processar arquivo. Verifique se é um arquivo Excel válido.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  const handleUpload = async () => {
    if (!parsedExam) return;

    setIsUploading(true);
    try {
      // Buscar course_id do curso IBRAMEC
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('title', 'Formação IBRAMEC')
        .single();

      const courseId = courses?.id || null;

      // Criar a prova
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: parsedExam.title,
          description: parsedExam.description,
          duration_minutes: parsedExam.duration_minutes,
          passing_score: parsedExam.passing_score,
          course_id: courseId,
          is_active: true,
          max_attempts: 1,
          shuffle_questions: false,
          shuffle_options: false,
          show_results_immediately: true,
        })
        .select()
        .single();

      if (examError) throw examError;

      // Criar as questões
      const questionsToInsert = parsedExam.questions.map(q => ({
        exam_id: exam.id,
        order_index: q.order_index,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        question_type: 'multiple_choice',
        points: 1,
      }));

      const { error: questionsError } = await supabase
        .from('exam_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast.success(`Prova "${parsedExam.title}" criada com ${parsedExam.questions.length} questões!`);
      setParsedExam(null);
      setOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();

    } catch (err) {
      console.error('Erro ao criar prova:', err);
      toast.error('Erro ao criar prova. Verifique os dados e tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setParsedExam(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Importar Prova</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Prova via Excel
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel com as questões e gabarito da prova.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Template download */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">Baixe o template</p>
                    <p className="text-xs text-muted-foreground">
                      Use o modelo Excel para preencher corretamente as questões
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File upload */}
          <div className="space-y-2">
            <Label htmlFor="exam-file">Arquivo Excel (.xlsx)</Label>
            <Input
              ref={fileInputRef}
              id="exam-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </div>

          {/* Error message */}
          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parsed exam preview */}
          {parsedExam && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Prova processada com sucesso!</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Título</p>
                    <p className="font-medium">{parsedExam.title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Questões</p>
                    <p className="font-medium">{parsedExam.questions.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duração</p>
                    <p className="font-medium">{parsedExam.duration_minutes} minutos</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nota Mínima</p>
                    <p className="font-medium">{parsedExam.passing_score}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-sm mb-2">Prévia das questões:</p>
                  <ScrollArea className="h-[200px] border rounded-md p-3">
                    <div className="space-y-3">
                      {parsedExam.questions.slice(0, 5).map((q, idx) => (
                        <div key={idx} className="text-sm border-b pb-2 last:border-0">
                          <p className="font-medium">
                            {q.order_index}. {q.question_text.slice(0, 100)}
                            {q.question_text.length > 100 && '...'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {q.options.length} opções
                            </Badge>
                            <Badge className="text-xs bg-green-500">
                              Gabarito: {q.correct_answer}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {parsedExam.questions.length > 5 && (
                        <p className="text-muted-foreground text-xs">
                          ... e mais {parsedExam.questions.length - 5} questões
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!parsedExam || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Criar Prova
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
