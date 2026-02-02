/**
 * Step 5: Base de Conhecimento
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, BookOpen, ArrowRight, Loader2, FileText, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAvivarOnboarding } from '../../hooks/useAvivarOnboarding';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Props {
  onComplete: () => void;
}

export function OnboardingStepKnowledge({ onComplete }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateStep, onboardingStatus } = useAvivarOnboarding();

  // Buscar documentos de conhecimento
  const { data: documents, isLoading } = useQuery({
    queryKey: ['avivar-knowledge-onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('avivar_knowledge_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const hasKnowledge = documents && documents.length > 0;
  const isStepComplete = onboardingStatus?.steps.knowledge_base_setup ?? false;

  React.useEffect(() => {
    if (hasKnowledge && !isStepComplete) {
      updateStep({ stepId: 'knowledge_base_setup', completed: true });
    }
  }, [hasKnowledge, isStepComplete]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={cn(
        "p-4 rounded-xl border",
        hasKnowledge
          ? "bg-green-500/10 border-green-500/30" 
          : "bg-amber-500/10 border-amber-500/30"
      )}>
        <div className="flex items-center gap-3">
          {hasKnowledge ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <BookOpen className="h-6 w-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium">
              {hasKnowledge ? 'Base de conhecimento configurada!' : 'Configure a base de conhecimento'}
            </p>
            <p className="text-sm text-muted-foreground">
              {hasKnowledge 
                ? `${documents?.length} documento(s) na base`
                : 'Adicione informações para sua IA responder corretamente'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 rounded-xl bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-primary)/0.2)]">
        <p className="text-sm">
          <strong>Dica:</strong> Adicione informações sobre seus serviços, preços, procedimentos, FAQs e qualquer conteúdo que ajude a IA a responder dúvidas dos leads.
        </p>
      </div>

      {/* Lista de documentos ou CTA */}
      {hasKnowledge ? (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {documents?.map((doc) => (
            <Card 
              key={doc.id}
              className="p-4 bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center">
                    <FileText className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.chunks_count || 0} chunks • {doc.content_type || 'text'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-500/30">
                  Indexado
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center bg-[hsl(var(--avivar-secondary))] border-dashed">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-[hsl(var(--avivar-primary))]" />
          <h4 className="font-medium mb-2">Nenhum documento na base</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione documentos ou FAQs para treinar sua IA
          </p>
          <Button
            onClick={() => navigate('/avivar/config')}
            className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
          >
            <Upload className="h-4 w-4" />
            Adicionar Conhecimento
          </Button>
        </Card>
      )}

      {/* Ação para pular (temporário durante desenvolvimento) */}
      {!hasKnowledge && (
        <Button
          variant="ghost"
          onClick={() => {
            updateStep({ stepId: 'knowledge_base_setup', completed: true });
            onComplete();
          }}
          className="text-muted-foreground"
        >
          Pular por enquanto
        </Button>
      )}

      {/* Ações */}
      {hasKnowledge && (
        <div className="flex justify-end">
          <Button
            onClick={onComplete}
            className="gap-2 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
