import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Plus, Building2, Trash2, Edit, GripVertical } from 'lucide-react';
import { useCleaningEnvironments } from '../hooks';
import { 
  CleaningEnvironmentWithChecklist, 
  RISK_LEVEL_BADGES, 
  SanitaryRiskLevel,
  CreateEnvironmentForm 
} from '../types';

interface EnvironmentsTabProps {
  branchId: string;
}

export function EnvironmentsTab({ branchId }: EnvironmentsTabProps) {
  const { environments, isLoading, createEnvironment, updateEnvironment, deactivateEnvironment } = useCleaningEnvironments(branchId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<CleaningEnvironmentWithChecklist | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ambientes Cadastrados</h2>
          <p className="text-sm text-muted-foreground">
            {environments.length} ambiente(s) ativos
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ambiente
            </Button>
          </DialogTrigger>
          <EnvironmentFormDialog
            branchId={branchId}
            onSubmit={async (data) => {
              await createEnvironment.mutateAsync(data);
              setShowCreateDialog(false);
            }}
            isLoading={createEnvironment.isPending}
          />
        </Dialog>
      </div>

      {/* Lista de ambientes */}
      <div className="space-y-3">
        {environments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhum ambiente cadastrado</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Cadastre os ambientes da clínica para iniciar a rotina de limpeza.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Ambiente
              </Button>
            </CardContent>
          </Card>
        ) : (
          environments.map((env, index) => (
            <Card key={env.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Drag handle */}
                  <div className="text-muted-foreground cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>

                  {/* Posição */}
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{env.name}</span>
                      <Badge {...RISK_LEVEL_BADGES[env.sanitary_risk_level]}>
                        {RISK_LEVEL_BADGES[env.sanitary_risk_level].label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                      {env.environment_type && <span>{env.environment_type}</span>}
                      <span>{env.items_count || 0} itens no checklist</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditingEnvironment(env)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        if (confirm('Deseja desativar este ambiente?')) {
                          deactivateEnvironment.mutate(env.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de edição */}
      {editingEnvironment && (
        <Dialog open={!!editingEnvironment} onOpenChange={() => setEditingEnvironment(null)}>
          <EnvironmentFormDialog
            branchId={branchId}
            environment={editingEnvironment}
            onSubmit={async (data) => {
              await updateEnvironment.mutateAsync({ id: editingEnvironment.id, ...data });
              setEditingEnvironment(null);
            }}
            isLoading={updateEnvironment.isPending}
          />
        </Dialog>
      )}
    </div>
  );
}

interface EnvironmentFormDialogProps {
  branchId: string;
  environment?: CleaningEnvironmentWithChecklist;
  onSubmit: (data: CreateEnvironmentForm) => Promise<void>;
  isLoading: boolean;
}

function EnvironmentFormDialog({ branchId, environment, onSubmit, isLoading }: EnvironmentFormDialogProps) {
  const [name, setName] = useState(environment?.name || '');
  const [description, setDescription] = useState(environment?.description || '');
  const [environmentType, setEnvironmentType] = useState(environment?.environment_type || '');
  const [riskLevel, setRiskLevel] = useState<SanitaryRiskLevel>(environment?.sanitary_risk_level || 'nao_critico');
  const [priorityOrder, setPriorityOrder] = useState(environment?.priority_order || 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      description: description || undefined,
      environment_type: environmentType || undefined,
      sanitary_risk_level: riskLevel,
      priority_order: priorityOrder,
      branch_id: branchId,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {environment ? 'Editar Ambiente' : 'Novo Ambiente'}
        </DialogTitle>
        <DialogDescription>
          Configure as informações do ambiente de limpeza.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nome *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Centro Cirúrgico 1"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Descrição</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional do ambiente"
            rows={2}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tipo do Ambiente</label>
          <Input
            value={environmentType}
            onChange={(e) => setEnvironmentType(e.target.value)}
            placeholder="Ex: Sala de Procedimento"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Nível de Risco Sanitário *</label>
          <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as SanitaryRiskLevel)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critico">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Crítico</Badge>
                  <span className="text-xs text-muted-foreground">Centro cirúrgico, salas de procedimento</span>
                </div>
              </SelectItem>
              <SelectItem value="semicritico">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Semicrítico</Badge>
                  <span className="text-xs text-muted-foreground">Consultórios, recuperação</span>
                </div>
              </SelectItem>
              <SelectItem value="nao_critico">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Não Crítico</Badge>
                  <span className="text-xs text-muted-foreground">Recepção, administrativo</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Ordem de Prioridade</label>
          <Input
            type="number"
            value={priorityOrder}
            onChange={(e) => setPriorityOrder(parseInt(e.target.value) || 100)}
            min={1}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Menor número = maior prioridade na fila
          </p>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={!name || isLoading}>
            {environment ? 'Salvar Alterações' : 'Criar Ambiente'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
