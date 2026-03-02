import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleLayout } from '@/components/ModuleLayout';
import { useProcessTemplates, ProcessTemplate } from '@/hooks/useProcessTemplates';
import { useNeoTeamBranches } from '@/neohub/hooks/useNeoTeamBranches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Search, Workflow, GitBranch, BarChart3, Archive,
  Pencil, Trash2, MoreHorizontal, CheckCircle2, Clock, FileEdit,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  draft: { label: 'Em revisão', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <FileEdit className="h-3 w-3" /> },
  archived: { label: 'Arquivado', color: 'bg-muted text-muted-foreground border-border', icon: <Archive className="h-3 w-3" /> },
};

const CATEGORY_OPTIONS = [
  { value: 'pre_operatorio', label: 'Pré-operatório' },
  { value: 'pos_operatorio', label: 'Pós-operatório' },
  { value: 'documentacao', label: 'Documentação' },
  { value: 'alta', label: 'Alta' },
  { value: 'custom', label: 'Personalizado' },
];

const COLOR_OPTIONS = [
  '#1E3A8A', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4',
];

export default function ProcessLibraryPage() {
  const navigate = useNavigate();
  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate } = useProcessTemplates();
  const { branches } = useNeoTeamBranches();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFlow, setNewFlow] = useState({ name: '', description: '', category: '', color: '#3B82F6', branch_id: '' });

  const filtered = useMemo(() => {
    return templates.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (branchFilter !== 'all' && t.branch_id !== branchFilter) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [templates, search, statusFilter, branchFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length, active: 0, draft: 0, archived: 0 };
    templates.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return counts;
  }, [templates]);

  const handleCreate = async () => {
    if (!newFlow.name.trim()) return;
    const result = await createTemplate.mutateAsync(newFlow);
    setShowCreateDialog(false);
    setNewFlow({ name: '', description: '', category: '', color: '#3B82F6', branch_id: '' });
    if (result?.id) navigate(`/neoteam/processos/${result.id}`);
  };

  return (
    <ModuleLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Workflow className="h-7 w-7 text-[#1E3A8A]" />
              Fluxos de Processo
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os fluxos de processos vinculados à agenda cirúrgica.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Novo Fluxo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fluxo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as filiais</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            {(['all', 'active', 'draft', 'archived'] as const).map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  statusFilter === status && 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90',
                )}
              >
                {status === 'all' ? 'Todos' : STATUS_CONFIG[status]?.label}
                <span className="ml-1.5 text-xs opacity-70">({statusCounts[status] || 0})</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Workflow className="h-16 w-16 text-muted-foreground/40" />
            <p className="text-muted-foreground text-lg">
              {search || statusFilter !== 'all' ? 'Nenhum fluxo encontrado.' : 'Nenhum fluxo criado ainda.'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Criar seu primeiro fluxo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                branches={branches}
                onEdit={() => navigate(`/neoteam/processos/${template.id}`)}
                onStatusChange={(status) => updateTemplate.mutate({ id: template.id, status })}
                onDelete={() => deleteTemplate.mutate(template.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-[#1E3A8A]" />
              Criar Novo Fluxo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Fluxo *</Label>
              <Input
                placeholder="Ex: Protocolo Pré-operatório"
                value={newFlow.name}
                onChange={e => setNewFlow(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva o objetivo deste fluxo..."
                value={newFlow.description}
                onChange={e => setNewFlow(p => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={newFlow.category} onValueChange={v => setNewFlow(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all',
                      newFlow.color === c ? 'border-foreground scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewFlow(p => ({ ...p, color: c }))}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Filial</Label>
              <Select value={newFlow.branch_id || '__none__'} onValueChange={v => setNewFlow(p => ({ ...p, branch_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a filial..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todas (padrão)</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={!newFlow.name.trim() || createTemplate.isPending}
              className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
            >
              {createTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Fluxo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}

// ==========================================
// Template Card
// ==========================================
function TemplateCard({
  template,
  branches,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  template: ProcessTemplate;
  branches: { id: string; name: string }[];
  onEdit: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  const statusCfg = STATUS_CONFIG[template.status] || STATUS_CONFIG.draft;
  const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === template.category)?.label || template.category || 'Sem categoria';
  const branchName = template.branch_id ? branches.find(b => b.id === template.branch_id)?.name : null;

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
      style={{ borderLeftColor: template.color }}
      onClick={onEdit}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {categoryLabel}
              {branchName && <span className="ml-1.5 text-primary/70">• {branchName}</span>}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </DropdownMenuItem>
              {template.status !== 'active' && (
                <DropdownMenuItem onClick={() => onStatusChange('active')}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Ativar
                </DropdownMenuItem>
              )}
              {template.status !== 'archived' && (
                <DropdownMenuItem onClick={() => onStatusChange('archived')}>
                  <Archive className="h-4 w-4 mr-2" /> Arquivar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" />
            {template.steps_count} etapas
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {template.instances_count} execuções
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn('text-xs gap-1', statusCfg.color)}>
            {statusCfg.icon}
            {statusCfg.label}
          </Badge>
          {template.instances_count! > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${template.completion_rate}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{template.completion_rate}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
