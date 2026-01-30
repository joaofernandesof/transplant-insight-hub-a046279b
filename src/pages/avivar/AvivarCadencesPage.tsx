/**
 * Avivar Cadences Page
 * Multi-channel automated follow-up sequences
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
import { CadenceList, CadenceEditor, CadenceExecutions, CadenceSequence } from './cadence';

export default function AvivarCadencesPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editSequence, setEditSequence] = useState<CadenceSequence | null>(null);

  const handleEdit = (sequence: CadenceSequence) => {
    setEditSequence(sequence);
    setEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditSequence(null);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditSequence(null);
  };

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
