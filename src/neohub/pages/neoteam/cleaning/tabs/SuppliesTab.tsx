import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { 
  Plus, Package, AlertTriangle, ArrowUp, 
  ArrowDown, Minus, Trash2 
} from 'lucide-react';
import { useCleaningSupplies } from '../hooks';
import { CleaningSupply, SupplyCategory, SUPPLY_CATEGORY_LABELS } from '../types';

interface SuppliesTabProps {
  branchId: string;
}

export function SuppliesTab({ branchId }: SuppliesTabProps) {
  const { supplies, lowStockSupplies, isLoading, createSupply, registerMovement, deactivateSupply } = useCleaningSupplies(branchId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [movementSupply, setMovementSupply] = useState<CleaningSupply | null>(null);

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
      {/* Alertas de estoque baixo */}
      {lowStockSupplies.length > 0 && (
        <Card className="border-yellow-300 dark:border-yellow-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockSupplies.map(supply => (
                <Badge key={supply.id} variant="destructive" className="gap-1">
                  {supply.name}: {supply.current_stock} {supply.unit}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Insumos de Limpeza</h2>
          <p className="text-sm text-muted-foreground">
            {supplies.length} insumo(s) cadastrados
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Insumo
            </Button>
          </DialogTrigger>
          <SupplyFormDialog
            branchId={branchId}
            onSubmit={async (data) => {
              await createSupply.mutateAsync(data);
              setShowCreateDialog(false);
            }}
            isLoading={createSupply.isPending}
          />
        </Dialog>
      </div>

      {/* Lista de insumos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {supplies.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Nenhum insumo cadastrado</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Cadastre os insumos de limpeza para controlar o estoque.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Insumo
              </Button>
            </CardContent>
          </Card>
        ) : (
          supplies.map(supply => (
            <Card key={supply.id} className={supply.current_stock <= supply.min_stock ? 'border-yellow-300' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{supply.name}</h3>
                    <Badge variant="outline" className="text-xs mt-1">
                      {SUPPLY_CATEGORY_LABELS[supply.category as SupplyCategory] || supply.category}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => {
                      if (confirm('Deseja desativar este insumo?')) {
                        deactivateSupply.mutate(supply.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estoque atual:</span>
                    <span className={`font-semibold ${supply.current_stock <= supply.min_stock ? 'text-red-500' : ''}`}>
                      {supply.current_stock} {supply.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estoque mínimo:</span>
                    <span>{supply.min_stock} {supply.unit}</span>
                  </div>
                  {supply.cost_unit && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Custo unitário:</span>
                      <span>R$ {supply.cost_unit.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setMovementSupply(supply)}
                  >
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Entrada
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setMovementSupply(supply)}
                  >
                    <ArrowDown className="h-3 w-3 mr-1" />
                    Saída
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de movimentação */}
      {movementSupply && (
        <MovementDialog
          supply={movementSupply}
          onClose={() => setMovementSupply(null)}
          onSubmit={async (type, quantity, notes) => {
            await registerMovement.mutateAsync({
              supply_id: movementSupply.id,
              movement_type: type,
              quantity,
              notes,
            });
            setMovementSupply(null);
          }}
          isLoading={registerMovement.isPending}
        />
      )}
    </div>
  );
}

interface SupplyFormDialogProps {
  branchId: string;
  onSubmit: (data: {
    name: string;
    category: SupplyCategory;
    unit: string;
    min_stock: number;
    cost_unit?: number;
    branch_id: string;
  }) => Promise<void>;
  isLoading: boolean;
}

function SupplyFormDialog({ branchId, onSubmit, isLoading }: SupplyFormDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SupplyCategory>('outros');
  const [unit, setUnit] = useState('un');
  const [minStock, setMinStock] = useState(10);
  const [costUnit, setCostUnit] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      category,
      unit,
      min_stock: minStock,
      cost_unit: costUnit ? parseFloat(costUnit) : undefined,
      branch_id: branchId,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo Insumo</DialogTitle>
        <DialogDescription>
          Cadastre um novo insumo de limpeza.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nome *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Desinfetante Quaternário"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Categoria</label>
            <Select value={category} onValueChange={(v) => setCategory(v as SupplyCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPLY_CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Unidade</label>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="un, L, kg..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Estoque Mínimo</label>
            <Input
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Custo Unitário (R$)</label>
            <Input
              type="number"
              step="0.01"
              value={costUnit}
              onChange={(e) => setCostUnit(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={!name || isLoading}>
            Criar Insumo
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

interface MovementDialogProps {
  supply: CleaningSupply;
  onClose: () => void;
  onSubmit: (type: 'entrada' | 'saida' | 'ajuste', quantity: number, notes?: string) => Promise<void>;
  isLoading: boolean;
}

function MovementDialog({ supply, onClose, onSubmit, isLoading }: MovementDialogProps) {
  const [type, setType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimentação de Estoque</DialogTitle>
          <DialogDescription>
            {supply.name} - Estoque atual: {supply.current_stock} {supply.unit}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tipo de Movimentação</label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    Entrada
                  </div>
                </SelectItem>
                <SelectItem value="saida">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-4 w-4 text-red-500" />
                    Saída
                  </div>
                </SelectItem>
                <SelectItem value="ajuste">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-blue-500" />
                    Ajuste (definir quantidade)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">
              {type === 'ajuste' ? 'Nova quantidade' : 'Quantidade'}
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Observações</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSubmit(type, parseFloat(quantity) || 0, notes || undefined)}
            disabled={!quantity || isLoading}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
