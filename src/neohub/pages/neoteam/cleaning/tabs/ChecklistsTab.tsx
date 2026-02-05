import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Plus, ListChecks, Trash2, GripVertical, 
  AlertCircle, ChevronRight 
} from 'lucide-react';
import { useCleaningEnvironments, useCleaningChecklists } from '../hooks';
import { 
  CleaningItemCategory, 
  ITEM_CATEGORY_LABELS,
  RISK_LEVEL_BADGES 
} from '../types';

interface ChecklistsTabProps {
  branchId: string;
}

export function ChecklistsTab({ branchId }: ChecklistsTabProps) {
  const { environments, isLoading: loadingEnvs } = useCleaningEnvironments(branchId);
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);

  if (loadingEnvs) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Lista de ambientes */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Ambientes</CardTitle>
          <CardDescription>
            Selecione para editar o checklist
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {environments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 px-4">
              Nenhum ambiente cadastrado. Crie ambientes na aba "Ambientes".
            </p>
          ) : (
            <div className="divide-y">
              {environments.map(env => (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnvId(env.id)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between ${
                    selectedEnvId === env.id ? 'bg-muted' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{env.name}</span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        {...RISK_LEVEL_BADGES[env.sanitary_risk_level]}
                      >
                        {RISK_LEVEL_BADGES[env.sanitary_risk_level].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {env.items_count || 0} itens
                    </p>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${selectedEnvId === env.id ? 'rotate-90' : ''}`} />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor de checklist */}
      <div className="md:col-span-2">
        {selectedEnvId ? (
          <ChecklistEditor environmentId={selectedEnvId} />
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Selecione um ambiente</h3>
              <p className="text-muted-foreground text-sm">
                Escolha um ambiente na lista ao lado para editar seu checklist.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ChecklistEditorProps {
  environmentId: string;
}

function ChecklistEditor({ environmentId }: ChecklistEditorProps) {
  const { checklist, items, isLoading, addItem, updateItem, removeItem } = useCleaningChecklists(environmentId);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<CleaningItemCategory>('limpeza_geral');
  const [newItemCritical, setNewItemCritical] = useState(false);

  const handleAddItem = async () => {
    if (!checklist || !newItemDescription.trim()) return;

    await addItem.mutateAsync({
      checklistId: checklist.id,
      item: {
        description: newItemDescription.trim(),
        category: newItemCategory,
        is_critical: newItemCritical,
      },
    });

    setNewItemDescription('');
    setNewItemCritical(false);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!checklist) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="font-semibold mb-2">Checklist não encontrado</h3>
          <p className="text-muted-foreground text-sm">
            Este ambiente ainda não possui um checklist configurado.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar por categoria
  const itemsByCategory = items.reduce((acc, item) => {
    const cat = item.category || 'limpeza_geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Checklist</CardTitle>
            <CardDescription>
              Versão {checklist.version} • {items.length} itens
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar novo item */}
        <div className="border rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">Adicionar Item</h4>
          <div className="flex gap-3">
            <Input
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder="Descrição do item..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Select value={newItemCategory} onValueChange={(v) => setNewItemCategory(v as CleaningItemCategory)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ITEM_CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="critical"
                checked={newItemCritical}
                onCheckedChange={(c) => setNewItemCritical(!!c)}
              />
              <label htmlFor="critical" className="text-sm">
                Item crítico (obrigatório)
              </label>
            </div>
            <Button 
              onClick={handleAddItem}
              disabled={!newItemDescription.trim() || addItem.isPending}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Lista de itens por categoria */}
        {Object.entries(ITEM_CATEGORY_LABELS).map(([category, label]) => {
          const categoryItems = itemsByCategory[category] || [];
          if (categoryItems.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="font-medium text-sm mb-2 text-muted-foreground uppercase tracking-wide">
                {label}
              </h4>
              <div className="space-y-2">
                {categoryItems.map((item, index) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg group hover:bg-muted/30"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="w-6 text-center text-sm text-muted-foreground">{index + 1}</span>
                    <span className="flex-1">{item.description}</span>
                    {item.is_critical && (
                      <Badge variant="destructive" className="text-xs">Crítico</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 text-red-500"
                      onClick={() => {
                        if (confirm('Remover este item?')) {
                          removeItem.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhum item cadastrado. Adicione itens ao checklist acima.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
