/**
 * Avivar Cadences Page
 * Multi-channel automated follow-up sequences
 * Com experiência de onboarding e templates pré-configurados
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Plus,
  Zap,
  Clock,
  Activity,
  Settings,
} from 'lucide-react';
import { 
  CadenceList, 
  CadenceEditor, 
  CadenceExecutions, 
  CadenceSequence,
  CadenceOnboarding,
  CadenceTemplate,
  useCadenceSequences,
  useCreateCadence
} from './cadence';
import { toast } from 'sonner';

export default function AvivarCadencesPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editSequence, setEditSequence] = useState<CadenceSequence | null>(null);
  const [templateToApply, setTemplateToApply] = useState<CadenceTemplate | null>(null);
  
  const { data: sequences, isLoading } = useCadenceSequences();
  const createCadence = useCreateCadence();

  // Verificar se usuário tem cadências configuradas (não templates)
  const userSequences = sequences?.filter(s => !s.is_template) || [];
  const hasConfiguredCadences = userSequences.length > 0;

  const handleEdit = (sequence: CadenceSequence) => {
    setEditSequence(sequence);
    setTemplateToApply(null);
    setEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditSequence(null);
    setTemplateToApply(null);
    setEditorOpen(true);
  };

  const handleSelectTemplate = (template: CadenceTemplate) => {
    // Aplicar template criando cadência com os steps pré-configurados
    createCadence.mutate({
      name: template.name,
      description: template.description,
      trigger_type: 'no_response',
      trigger_stage: template.targetColumn,
      steps: template.steps.map(step => ({
        channel: step.channel,
        delay_minutes: step.delayMinutes,
        message_template: step.message,
        is_active: true,
        step_order: 0
      }))
    }, {
      onSuccess: () => {
        toast.success(`Template "${template.name}" aplicado com sucesso!`);
      }
    });
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditSequence(null);
    setTemplateToApply(null);
  };

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  // Se não tem cadências configuradas, mostrar onboarding
  if (!hasConfiguredCadences) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              Cadências Automáticas
              <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            </h1>
            <p className="text-[hsl(var(--avivar-muted-foreground))]">
              Configure sequências de follow-up multi-canal (WhatsApp, SMS, Email, Ligação)
            </p>
          </div>
        </div>

        <CadenceOnboarding 
          onSelectTemplate={handleSelectTemplate}
          onCreateFromScratch={handleCreateNew}
        />

        {/* Editor Sheet */}
        <CadenceEditor
          open={editorOpen}
          onClose={handleCloseEditor}
          editSequence={editSequence}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            Cadências Automáticas
            <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Configure sequências de follow-up multi-canal (WhatsApp, SMS, Email, Ligação)
          </p>
        </div>
        <Button 
          onClick={handleCreateNew}
          className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white shadow-lg shadow-[hsl(var(--avivar-primary)/0.25)]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Cadência
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="sequences" className="space-y-6">
        <TabsList className="bg-[hsl(var(--avivar-secondary))] border border-[hsl(var(--avivar-border))]">
          <TabsTrigger 
            value="sequences"
            className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
          <TabsTrigger 
            value="executions"
            className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
          >
            <Activity className="h-4 w-4 mr-2" />
            Em Andamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sequences">
          <CadenceList 
            onEdit={handleEdit}
            onCreateNew={handleCreateNew}
          />
        </TabsContent>

        <TabsContent value="executions">
          <CadenceExecutions />
        </TabsContent>
      </Tabs>

      {/* Editor Sheet */}
      <CadenceEditor
        open={editorOpen}
        onClose={handleCloseEditor}
        editSequence={editSequence}
      />
    </div>
  );
}
