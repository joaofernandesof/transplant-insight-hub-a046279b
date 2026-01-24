import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lock, LockOpen, FileCheck, ClipboardList, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LinkGalleryRequirementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  galleryId: string;
  galleryTitle: string;
  classId: string | null;
  currentRequirement: 'none' | 'exam' | 'survey';
  currentExamId: string | null;
  currentSurveyType: string | null;
}

const SURVEY_OPTIONS = [
  { value: 'day1_satisfaction', label: 'Pesquisa de Satisfação - Dia 1' },
  { value: 'day2_satisfaction', label: 'Pesquisa de Satisfação - Dia 2' },
  { value: 'day3_satisfaction', label: 'Pesquisa de Satisfação - Dia 3' },
  { value: 'final_satisfaction', label: 'Pesquisa Final do Curso' },
];

export function LinkGalleryRequirementDialog({
  open,
  onOpenChange,
  galleryId,
  galleryTitle,
  classId,
  currentRequirement,
  currentExamId,
  currentSurveyType,
}: LinkGalleryRequirementDialogProps) {
  const queryClient = useQueryClient();
  const [requirement, setRequirement] = useState<'none' | 'exam' | 'survey'>(currentRequirement);
  const [selectedExamId, setSelectedExamId] = useState<string>(currentExamId || '');
  const [selectedSurveyType, setSelectedSurveyType] = useState<string>(currentSurveyType || '');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setRequirement(currentRequirement);
      setSelectedExamId(currentExamId || '');
      setSelectedSurveyType(currentSurveyType || '');
    }
  }, [open, currentRequirement, currentExamId, currentSurveyType]);

  // Fetch exams for the class
  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['exams-for-gallery', classId],
    queryFn: async () => {
      let query = supabase
        .from('exams')
        .select('id, title, class_id')
        .eq('is_active', true)
        .order('title');

      // Filter by class if available
      if (classId) {
        query = query.or(`class_id.eq.${classId},class_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open && requirement === 'exam',
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, any> = {
        unlock_requirement: requirement,
        required_exam_id: requirement === 'exam' ? selectedExamId : null,
        required_survey_type: requirement === 'survey' ? selectedSurveyType : null,
      };

      const { error } = await supabase
        .from('course_galleries')
        .update(updates)
        .eq('id', galleryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-galleries'] });
      queryClient.invalidateQueries({ queryKey: ['student-galleries'] });
      toast.success('Requisito de desbloqueio salvo!');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const handleSave = () => {
    // Validate selection
    if (requirement === 'exam' && !selectedExamId) {
      toast.error('Selecione uma prova');
      return;
    }
    if (requirement === 'survey' && !selectedSurveyType) {
      toast.error('Selecione uma pesquisa');
      return;
    }
    saveMutation.mutate();
  };

  const getRequirementLabel = () => {
    switch (requirement) {
      case 'exam':
        return 'O aluno precisa completar a prova selecionada';
      case 'survey':
        return 'O aluno precisa responder a pesquisa selecionada';
      default:
        return 'Sem requisitos - acesso livre';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Requisito de Desbloqueio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Gallery info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Galeria</p>
            <p className="font-medium">{galleryTitle}</p>
          </div>

          {/* Requirement type selection */}
          <div className="space-y-3">
            <Label>Tipo de Requisito</Label>
            <RadioGroup
              value={requirement}
              onValueChange={(value) => setRequirement(value as 'none' | 'exam' | 'survey')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="flex items-center gap-2 cursor-pointer flex-1">
                  <LockOpen className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Sem Requisito</p>
                    <p className="text-xs text-muted-foreground">Acesso livre às fotos</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="exam" id="exam" />
                <Label htmlFor="exam" className="flex items-center gap-2 cursor-pointer flex-1">
                  <FileCheck className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Completar Prova</p>
                    <p className="text-xs text-muted-foreground">Aluno deve finalizar a prova</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="survey" id="survey" />
                <Label htmlFor="survey" className="flex items-center gap-2 cursor-pointer flex-1">
                  <ClipboardList className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="font-medium">Responder Pesquisa</p>
                    <p className="text-xs text-muted-foreground">Aluno deve completar pesquisa de satisfação</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Exam selection */}
          {requirement === 'exam' && (
            <div className="space-y-2">
              <Label>Selecione a Prova</Label>
              {examsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : exams && exams.length > 0 ? (
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma prova..." />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        <div className="flex items-center gap-2">
                          {exam.title}
                          {exam.class_id === classId && (
                            <Badge variant="secondary" className="text-[10px]">Da turma</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Nenhuma prova disponível
                </div>
              )}
            </div>
          )}

          {/* Survey selection */}
          {requirement === 'survey' && (
            <div className="space-y-2">
              <Label>Selecione a Pesquisa</Label>
              <Select value={selectedSurveyType} onValueChange={setSelectedSurveyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma pesquisa..." />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_OPTIONS.map((survey) => (
                    <SelectItem key={survey.value} value={survey.value}>
                      {survey.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Info box */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400 text-sm">
            <p>{getRequirementLabel()}</p>
            {requirement !== 'none' && (
              <p className="mt-1 text-xs opacity-80">
                As fotos aparecerão com efeito de blur e cadeado até o aluno completar o requisito.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}