/**
 * List of cadence sequences with templates
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MessageSquare,
  Mail,
  Phone,
  PhoneCall,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Play,
  Pause,
  Sparkles,
  Clock,
  Zap,
  Plus,
  LayoutTemplate,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useCadenceSequences, 
  useCloneTemplate, 
  useUpdateCadence, 
  useDeleteCadence,
  CadenceSequence 
} from '../hooks/useCadences';

const CHANNEL_ICONS = {
  whatsapp: MessageSquare,
  sms: Phone,
  email: Mail,
  call: PhoneCall,
};

const CHANNEL_COLORS = {
  whatsapp: 'bg-green-500',
  sms: 'bg-blue-500',
  email: 'bg-purple-500',
  call: 'bg-amber-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  capilar: 'Transplante Capilar',
  estetica: 'Estética',
  geral: 'Uso Geral',
};

interface CadenceListProps {
  onEdit: (sequence: CadenceSequence) => void;
  onCreateNew: () => void;
}

export function CadenceList({ onEdit, onCreateNew }: CadenceListProps) {
  const { data: sequences, isLoading } = useCadenceSequences();
  const cloneTemplate = useCloneTemplate();
  const updateCadence = useUpdateCadence();
  const deleteCadence = useDeleteCadence();
  
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const templates = sequences?.filter(s => s.is_template) || [];
  const userSequences = sequences?.filter(s => !s.is_template) || [];

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateCadence.mutate({ id, updates: { is_active: !isActive } });
  };

  const handleClone = (templateId: string) => {
    cloneTemplate.mutate(templateId);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCadence.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const renderSequenceCard = (sequence: CadenceSequence, isTemplate = false) => (
    <Card 
      key={sequence.id}
      className={cn(
        "bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.4)] transition-all group",
        !sequence.is_active && !isTemplate && "opacity-60"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isTemplate && (
                <Badge className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] border-[hsl(var(--avivar-primary)/0.3)] text-xs">
                  <LayoutTemplate className="h-3 w-3 mr-1" />
                  Template
                </Badge>
              )}
              {sequence.template_category && (
                <Badge variant="outline" className="text-xs border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]">
                  {CATEGORY_LABELS[sequence.template_category] || sequence.template_category}
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] truncate">
              {sequence.name}
            </h3>
            
            {sequence.description && (
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] line-clamp-2 mt-1">
                {sequence.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                <Clock className="h-3 w-3" />
                {sequence.trigger_type === 'no_response' ? 'Sem resposta' : 
                 sequence.trigger_type === 'after_stage' ? 'Após etapa' : 'Personalizado'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isTemplate && (
              <Switch
                checked={sequence.is_active}
                onCheckedChange={() => handleToggleActive(sequence.id, sequence.is_active)}
              />
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isTemplate ? (
                  <DropdownMenuItem onClick={() => handleClone(sequence.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Usar este template
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(sequence)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleClone(sequence.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteTarget(sequence.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-4">
              <div className="h-4 w-32 bg-[hsl(var(--avivar-muted))] rounded animate-pulse mb-2" />
              <div className="h-3 w-48 bg-[hsl(var(--avivar-muted))] rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-cadences">
        <TabsList className="bg-[hsl(var(--avivar-secondary))] border border-[hsl(var(--avivar-border))]">
          <TabsTrigger 
            value="my-cadences"
            className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Minhas Cadências ({userSequences.length})
          </TabsTrigger>
          <TabsTrigger 
            value="templates"
            className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white"
          >
            <LayoutTemplate className="h-4 w-4 mr-2" />
            Templates Prontos ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-cadences" className="mt-4">
          {userSequences.length === 0 ? (
            <Card className="bg-[hsl(var(--avivar-card)/0.5)] border-dashed border-[hsl(var(--avivar-primary)/0.3)]">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-[hsl(var(--avivar-primary))]" />
                </div>
                <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] mb-2">
                  Nenhuma cadência configurada
                </h3>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mb-4 max-w-md mx-auto">
                  Crie sua primeira cadência do zero ou use um dos nossos templates prontos para começar rapidamente.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={onCreateNew} className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar do Zero
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userSequences.map(seq => renderSequenceCard(seq, false))}
              
              {/* Add New Card */}
              <Card 
                className="bg-[hsl(var(--avivar-card)/0.5)] border-dashed border-[hsl(var(--avivar-primary)/0.3)] hover:border-[hsl(var(--avivar-primary)/0.5)] transition-all cursor-pointer group"
                onClick={onCreateNew}
              >
                <CardContent className="p-4 h-full flex flex-col items-center justify-center min-h-[150px]">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center mb-3 group-hover:bg-[hsl(var(--avivar-primary)/0.3)] transition-colors">
                    <Plus className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
                  </div>
                  <p className="font-medium text-[hsl(var(--avivar-primary))]">Nova Cadência</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="mb-4">
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              Clique em "Usar este template" para copiar e personalizar uma cadência pronta.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => renderSequenceCard(tpl, true))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cadência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as execuções em andamento serão canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
