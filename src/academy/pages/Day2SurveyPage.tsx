import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useClassDetails } from '@/academy/hooks/useClassDetails';
import { Day2SurveyDialog } from '@/academy/components/Day2SurveyDialog';
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Day2SurveyPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useUnifiedAuth();
  const { classDetails, isLoading: classLoading } = useClassDetails(classId || null);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Auto-open survey when page loads
  useEffect(() => {
    if (!authLoading && !classLoading && user && classDetails && !completed) {
      setSurveyOpen(true);
    }
  }, [authLoading, classLoading, user, classDetails, completed]);

  const handleComplete = () => {
    setCompleted(true);
    setSurveyOpen(false);
  };

  const handleClose = (open: boolean) => {
    setSurveyOpen(open);
    if (!open && !completed) {
      // User closed without completing - stay on page
    }
  };

  if (authLoading || classLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Você precisa estar logado para responder a pesquisa.
            </p>
            <Button onClick={() => navigate('/login', { state: { from: `/academy/pesquisa-dia2/${classId}` } })}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Turma não encontrada</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              A turma solicitada não foi encontrada.
            </p>
            <Button variant="outline" onClick={() => navigate('/academy')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Academy
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-emerald-200 bg-emerald-50">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-emerald-500" />
            </div>
            <CardTitle className="text-center text-emerald-800">Pesquisa Concluída!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-emerald-700">
              Obrigado por responder a Pesquisa de Satisfação do Dia 2!
            </p>
            <p className="text-sm text-emerald-600">
              Suas respostas são muito importantes para continuarmos melhorando.
            </p>
            <Button 
              onClick={() => navigate(`/academy/classes/${classId}`)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Voltar para a Turma
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with class info */}
      <div className="bg-primary/10 border-b p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-primary">{classDetails.name}</h1>
          <p className="text-sm text-muted-foreground">Pesquisa de Satisfação - Dia 2</p>
        </div>
      </div>

      {/* Survey Dialog */}
      <Day2SurveyDialog
        open={surveyOpen}
        onOpenChange={handleClose}
        classId={classId}
        onComplete={handleComplete}
      />

      {/* Fallback content when dialog is closed */}
      {!surveyOpen && !completed && (
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <p className="text-muted-foreground">
                A pesquisa foi fechada. Deseja continuar respondendo?
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => navigate(`/academy/classes/${classId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => setSurveyOpen(true)}>
                  Continuar Pesquisa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
