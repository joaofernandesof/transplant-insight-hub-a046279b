/**
 * AvivarLeadsSelector - Página de seleção de Kanbans
 * Lista todos os kanbans disponíveis para o usuário escolher
 * Cria kanbans padrão automaticamente para novos usuários
 * @module AvivarLeadsSelector
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Briefcase, HeartPulse, TrendingUp, Users, ArrowRight, Plus, 
  Loader2, LayoutGrid, Trash2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { toast } from 'sonner';

const iconOptions = [
  { value: 'briefcase', label: 'Pasta', icon: Briefcase },
  { value: 'heart-pulse', label: 'Saúde', icon: HeartPulse },
  { value: 'trending-up', label: 'Crescimento', icon: TrendingUp },
  { value: 'users', label: 'Pessoas', icon: Users },
  { value: 'layout-grid', label: 'Grade', icon: LayoutGrid },
];

const colorOptions = [
  { value: 'from-blue-500 to-blue-600', label: 'Azul', preview: 'bg-blue-500' },
  { value: 'from-emerald-500 to-emerald-600', label: 'Verde', preview: 'bg-emerald-500' },
  { value: 'from-purple-500 to-purple-600', label: 'Roxo', preview: 'bg-purple-500' },
  { value: 'from-amber-500 to-amber-600', label: 'Laranja', preview: 'bg-amber-500' },
  { value: 'from-pink-500 to-pink-600', label: 'Rosa', preview: 'bg-pink-500' },
  { value: 'from-cyan-500 to-cyan-600', label: 'Ciano', preview: 'bg-cyan-500' },
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'heart-pulse': return HeartPulse;
    case 'trending-up': return TrendingUp;
    case 'users': return Users;
    case 'layout-grid': return LayoutGrid;
    default: return Briefcase;
  }
};

interface KanbanData {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_active: boolean;
  order_index: number;
}

export function AvivarLeadsSelector() {
  const navigate = useNavigate();
  const { user, session } = useUnifiedAuth();
  const authUserId = session?.user?.id;
  const { accountId } = useAvivarAccount();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [newKanban, setNewKanban] = useState({
    name: '',
    description: '',
    icon: 'briefcase',
    color: 'from-blue-500 to-blue-600',
  });

  // Initialize default kanbans for new users
  useEffect(() => {
    const initializeKanbans = async () => {
      if (!authUserId) {
        setIsInitializing(false);
        return;
      }

      try {
        // Check if user already has kanbans
        const { data: existingKanbans, error: checkError } = await supabase
          .from('avivar_kanbans')
          .select('id')
          .limit(1);

        if (checkError) {
          console.error('Error checking kanbans:', checkError);
          setIsInitializing(false);
          return;
        }

        // If user has no kanbans, create defaults
        if (!existingKanbans || existingKanbans.length === 0) {
          const { error: rpcError } = await supabase.rpc('create_default_avivar_kanbans', {
            p_user_id: authUserId
          });

          if (rpcError) {
            console.error('Error creating default kanbans:', rpcError);
          } else {
            // Invalidate query to refetch
            queryClient.invalidateQueries({ queryKey: ['avivar-kanbans'] });
          }
        }
      } catch (error) {
        console.error('Error initializing kanbans:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeKanbans();
  }, [authUserId, queryClient]);

  // Fetch kanbans from database
  const { data: kanbans, isLoading: isLoadingKanbans } = useQuery({
    queryKey: ['avivar-kanbans', authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_kanbans')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as KanbanData[];
    },
    enabled: !!authUserId && !isInitializing,
  });

  const isLoading = isInitializing || isLoadingKanbans;

  // Create kanban mutation
  const createKanban = useMutation({
    mutationFn: async (kanbanData: typeof newKanban) => {
      if (!authUserId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('avivar_kanbans')
        .insert({
          user_id: authUserId,
          account_id: accountId!,
          name: kanbanData.name,
          description: kanbanData.description || null,
          icon: kanbanData.icon,
          color: kanbanData.color,
          order_index: (kanbans?.length || 0) + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanbans'] });
      setIsDialogOpen(false);
      setNewKanban({ name: '', description: '', icon: 'briefcase', color: 'from-blue-500 to-blue-600' });
      toast.success('Kanban criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating kanban:', error);
      toast.error('Erro ao criar kanban');
    },
  });

  const handleCreateKanban = () => {
    if (!newKanban.name.trim()) {
      toast.error('Digite um nome para o kanban');
      return;
    }
    createKanban.mutate(newKanban);
  };

  const [kanbanToDelete, setKanbanToDelete] = useState<KanbanData | null>(null);

  const deleteKanban = useMutation({
    mutationFn: async (kanbanId: string) => {
      // Delete columns first, then the kanban
      const { error: colError } = await supabase
        .from('avivar_kanban_columns')
        .delete()
        .eq('kanban_id', kanbanId);
      if (colError) throw colError;

      const { error } = await supabase
        .from('avivar_kanbans')
        .delete()
        .eq('id', kanbanId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-kanbans'] });
      toast.success('Kanban excluído com sucesso!');
      setKanbanToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting kanban:', error);
      toast.error('Erro ao excluir kanban. Verifique se não há leads vinculados.');
      setKanbanToDelete(null);
    },
  });

  const handleNavigateToKanban = (kanbanId: string) => {
    navigate(`/avivar/kanban/${kanbanId}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mb-2">
            Leads
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Selecione o kanban que deseja visualizar
          </p>
        </div>

        {/* Add Kanban Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Kanban
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <DialogHeader>
              <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
                Criar Novo Kanban
              </DialogTitle>
              <DialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
                Configure seu novo kanban de leads personalizado
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[hsl(var(--avivar-foreground))]">
                  Nome do Kanban
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Leads Instagram"
                  value={newKanban.name}
                  onChange={(e) => setNewKanban({ ...newKanban, name: e.target.value })}
                  className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[hsl(var(--avivar-foreground))]">
                  Descrição (opcional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito deste kanban..."
                  value={newKanban.description}
                  onChange={(e) => setNewKanban({ ...newKanban, description: e.target.value })}
                  className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[hsl(var(--avivar-foreground))]">Ícone</Label>
                  <Select
                    value={newKanban.icon}
                    onValueChange={(value) => setNewKanban({ ...newKanban, icon: value })}
                  >
                    <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[hsl(var(--avivar-foreground))]">Cor</Label>
                  <Select
                    value={newKanban.color}
                    onValueChange={(value) => setNewKanban({ ...newKanban, color: value })}
                  >
                    <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${opt.preview}`} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-[hsl(var(--avivar-border))]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateKanban}
                disabled={createKanban.isPending}
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
              >
                {createKanban.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar Kanban
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
          </div>
        ) : kanbans && kanbans.length > 0 ? (
          kanbans.map((kanban) => {
            const Icon = getIconComponent(kanban.icon);
            return (
              <Card
                key={kanban.id}
                className="group cursor-pointer border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:bg-[hsl(var(--avivar-primary)/0.05)] hover:border-[hsl(var(--avivar-primary)/0.3)] transition-all duration-300"
                onClick={() => handleNavigateToKanban(kanban.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kanban.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] text-lg">
                          {kanban.name}
                        </h3>
                      </div>
                      {kanban.description && (
                        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                          {kanban.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setKanbanToDelete(kanban);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ArrowRight className="h-5 w-5 text-[hsl(var(--avivar-muted-foreground))] group-hover:text-[hsl(var(--avivar-primary))] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--avivar-primary)/0.1)] flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="h-8 w-8 text-[hsl(var(--avivar-primary))]" />
              </div>
              <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] mb-2">
                Nenhum kanban criado
              </h3>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mb-4">
                Crie seu primeiro kanban para organizar seus leads
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Kanban
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!kanbanToDelete} onOpenChange={(open) => !open && setKanbanToDelete(null)}>
        <AlertDialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[hsl(var(--avivar-foreground))]">
              Excluir Kanban
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[hsl(var(--avivar-muted-foreground))]">
              Tem certeza que deseja excluir o kanban <strong>"{kanbanToDelete?.name}"</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[hsl(var(--avivar-border))]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => kanbanToDelete && deleteKanban.mutate(kanbanToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteKanban.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AvivarLeadsSelector;
