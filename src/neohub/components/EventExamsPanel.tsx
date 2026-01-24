import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Plus,
  Link2,
  Link2Off,
  RotateCcw,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEventExams, ClassExam } from "@/neohub/hooks/useEventExams";

interface EventExamsPanelProps {
  classId: string | null;
}

export function EventExamsPanel({ classId }: EventExamsPanelProps) {
  const { exams, availableExams, isLoading, linkExam, unlinkExam, toggleExamActive, resetAllAttempts } = useEventExams(classId);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedExamToLink, setSelectedExamToLink] = useState<string>("");
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const handleLinkExam = () => {
    if (selectedExamToLink) {
      linkExam.mutate(selectedExamToLink);
      setShowLinkDialog(false);
      setSelectedExamToLink("");
    }
  };

  const handleResetAttempts = (examId: string) => {
    resetAllAttempts.mutate(examId);
    setConfirmReset(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Provas do Evento</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as provas vinculadas a este evento
          </p>
        </div>
        <Button onClick={() => setShowLinkDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Vincular Prova
        </Button>
      </div>

      {/* Exams List */}
      {exams && exams.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prova</TableHead>
                  <TableHead className="text-center">Questões</TableHead>
                  <TableHead className="text-center">Tentativas</TableHead>
                  <TableHead className="text-center">Aprovações</TableHead>
                  <TableHead className="text-center">Visível</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{exam.title}</p>
                        {exam.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {exam.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{exam.question_count}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {exam.attempt_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        {exam.pass_count}
                        <span className="text-muted-foreground text-xs">
                          ({exam.attempt_count > 0 ? Math.round((exam.pass_count / exam.attempt_count) * 100) : 0}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={exam.is_active}
                        onCheckedChange={(checked) =>
                          toggleExamActive.mutate({ examId: exam.id, isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setConfirmReset(exam.id)}
                          disabled={exam.attempt_count === 0}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmUnlink(exam.id)}
                        >
                          <Link2Off className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhuma prova vinculada a este evento</p>
            <p className="text-sm text-muted-foreground">Clique em "Vincular Prova" para adicionar</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      {exams && exams.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exams.length}</p>
                <p className="text-xs text-muted-foreground">Provas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exams.reduce((sum, e) => sum + e.attempt_count, 0)}</p>
                <p className="text-xs text-muted-foreground">Tentativas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exams.reduce((sum, e) => sum + e.pass_count, 0)}</p>
                <p className="text-xs text-muted-foreground">Aprovações</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Eye className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exams.filter(e => e.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Link Exam Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Prova</DialogTitle>
            <DialogDescription>
              Selecione uma prova disponível para vincular a este evento
            </DialogDescription>
          </DialogHeader>
          
          {availableExams && availableExams.length > 0 ? (
            <div className="space-y-4">
              <Select value={selectedExamToLink} onValueChange={setSelectedExamToLink}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma prova..." />
                </SelectTrigger>
                <SelectContent>
                  {availableExams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleLinkExam} disabled={!selectedExamToLink}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Vincular
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Nenhuma prova disponível para vincular</p>
              <p className="text-sm text-muted-foreground">Todas as provas já estão vinculadas a eventos</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Reset Dialog */}
      <Dialog open={!!confirmReset} onOpenChange={() => setConfirmReset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Resetar Tentativas
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja resetar todas as tentativas desta prova? Esta ação não pode ser desfeita.
              Todos os resultados e notas serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmReset && handleResetAttempts(confirmReset)}
            >
              Resetar Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Unlink Dialog */}
      <Dialog open={!!confirmUnlink} onOpenChange={() => setConfirmUnlink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Link2Off className="h-5 w-5" />
              Desvincular Prova
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desvincular esta prova do evento? 
              A prova não será excluída, apenas desvinculada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUnlink(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (confirmUnlink) {
                  unlinkExam.mutate(confirmUnlink);
                  setConfirmUnlink(null);
                }
              }}
            >
              Desvincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
