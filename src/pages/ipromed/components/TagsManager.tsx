/**
 * IPROMED - Gestão de Etiquetas/Tags
 * Organização por etiquetas coloridas
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TagItem {
  id: string;
  name: string;
  color: string;
  category: string;
  created_at: string;
}

const colorOptions = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#6B7280', label: 'Cinza' },
];

const categoryOptions = [
  { value: 'geral', label: 'Geral' },
  { value: 'processo', label: 'Processo' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'tarefa', label: 'Tarefa' },
];

export default function TagsManager() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    category: 'geral',
  });

  const queryClient = useQueryClient();

  // Fetch tags
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['ipromed-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_tags')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as TagItem[];
    },
  });

  // Save tag
  const saveTag = useMutation({
    mutationFn: async () => {
      if (editingTag) {
        const { error } = await supabase
          .from('ipromed_tags')
          .update({
            name: formData.name,
            color: formData.color,
            category: formData.category,
          })
          .eq('id', editingTag.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('ipromed_tags')
          .insert([{
            name: formData.name,
            color: formData.color,
            category: formData.category,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-tags'] });
      toast.success(editingTag ? 'Etiqueta atualizada!' : 'Etiqueta criada!');
      closeForm();
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    },
  });

  // Delete tag
  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ipromed_tags')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-tags'] });
      toast.success('Etiqueta removida');
    },
  });

  const openEditForm = (tag: TagItem) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      category: tag.category,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTag(null);
    setFormData({
      name: '',
      color: '#3B82F6',
      category: 'geral',
    });
  };

  // Group by category
  const groupedTags = categoryOptions.reduce((acc, cat) => {
    acc[cat.value] = tags.filter(t => t.category === cat.value);
    return acc;
  }, {} as Record<string, TagItem[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Tag className="h-6 w-6 text-[#0066CC]" />
            Etiquetas
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize processos, clientes e tarefas com etiquetas
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#0066CC]">
              <Plus className="h-4 w-4" />
              Nova Etiqueta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Editar Etiqueta' : 'Nova Etiqueta'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome da etiqueta"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, color: v }))}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: formData.color }}
                        />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Badge
                    style={{
                      backgroundColor: formData.color + '20',
                      color: formData.color,
                      borderColor: formData.color,
                    }}
                    variant="outline"
                  >
                    {formData.name || 'Nome da etiqueta'}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeForm}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => saveTag.mutate()}
                  disabled={!formData.name || saveTag.isPending}
                  className="bg-[#0066CC]"
                >
                  {saveTag.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTag ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags by Category */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tags.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Tag className="h-12 w-12 opacity-20 mb-4" />
            <p className="font-medium">Nenhuma etiqueta criada</p>
            <p className="text-sm">Crie sua primeira etiqueta</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {categoryOptions.map((cat) => {
            const catTags = groupedTags[cat.value] || [];
            if (catTags.length === 0) return null;

            return (
              <Card key={cat.value} className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{cat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {catTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="group relative"
                      >
                        <Badge
                          style={{
                            backgroundColor: tag.color + '20',
                            color: tag.color,
                            borderColor: tag.color,
                          }}
                          variant="outline"
                          className="pr-8 cursor-pointer"
                          onClick={() => openEditForm(tag)}
                        >
                          {tag.name}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full w-6 opacity-0 group-hover:opacity-100 transition-opacity text-rose-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTag.mutate(tag.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
