/**
 * LeadTagsDialog - Modal para gerenciar tags do lead
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Tag } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeadTagsDialogProps {
  leadPhone: string;
  leadName: string;
  currentTags: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function LeadTagsDialog({ 
  leadPhone, 
  leadName,
  currentTags = [], 
  open, 
  onOpenChange, 
  onSaved 
}: LeadTagsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  // Reset state quando abre
  useEffect(() => {
    if (open) {
      setSelectedTags(currentTags);
      setSearchQuery('');
      loadAllTags();
    }
  }, [open, currentTags]);

  // Carregar todas as tags existentes
  const loadAllTags = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('avivar_kanban_leads')
        .select('tags')
        .eq('user_id', user.id)
        .not('tags', 'is', null);

      if (error) throw error;

      // Contar ocorrências de cada tag
      const tagCounts: Record<string, number> = {};
      data?.forEach(lead => {
        if (lead.tags && Array.isArray(lead.tags)) {
          lead.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Converter para array e ordenar por contagem
      const tagsArray = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);

      setAllTags(tagsArray);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Tags filtradas pela busca
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return allTags;
    const query = searchQuery.toLowerCase();
    return allTags.filter(t => t.tag.toLowerCase().includes(query));
  }, [allTags, searchQuery]);

  // Verificar se a tag de busca é nova
  const isNewTag = useMemo(() => {
    if (!searchQuery.trim()) return false;
    return !allTags.some(t => t.tag.toLowerCase() === searchQuery.toLowerCase().trim());
  }, [allTags, searchQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addNewTag = () => {
    const newTag = searchQuery.trim();
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag]);
      setSearchQuery('');
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('avivar_kanban_leads')
        .update({ 
          tags: selectedTags,
          updated_at: new Date().toISOString()
        })
        .eq('phone', leadPhone)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Tags atualizadas com sucesso!');
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error('Erro ao salvar tags:', error);
      toast.error('Erro ao salvar tags');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
            Gerenciar tags
          </DialogTitle>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
            {leadName}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tags selecionadas */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-[hsl(var(--avivar-muted)/0.3)] border border-[hsl(var(--avivar-border))]">
              {selectedTags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 bg-[hsl(var(--avivar-primary)/0.15)] text-[hsl(var(--avivar-primary))] border-[hsl(var(--avivar-primary)/0.3)]"
                >
                  #{tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Localizar ou adicionar uma tag"
              className="pl-10 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isNewTag) {
                  e.preventDefault();
                  addNewTag();
                }
              }}
            />
          </div>

          {/* Botão para adicionar nova tag */}
          {isNewTag && searchQuery.trim() && (
            <Button
              variant="outline"
              size="sm"
              onClick={addNewTag}
              className="w-full gap-2 border-dashed border-[hsl(var(--avivar-primary))] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
            >
              <Plus className="h-4 w-4" />
              Criar tag "{searchQuery.trim()}"
            </Button>
          )}

          {/* Lista de tags existentes */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-1">
              {isLoading ? (
                <p className="text-center text-sm text-[hsl(var(--avivar-muted-foreground))] py-4">
                  Carregando tags...
                </p>
              ) : filteredTags.length === 0 ? (
                <p className="text-center text-sm text-[hsl(var(--avivar-muted-foreground))] py-4">
                  {searchQuery ? 'Nenhuma tag encontrada' : 'Nenhuma tag criada ainda'}
                </p>
              ) : (
                filteredTags.map(({ tag, count }) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        isSelected 
                          ? 'bg-[hsl(var(--avivar-primary)/0.15)] border border-[hsl(var(--avivar-primary)/0.3)]' 
                          : 'hover:bg-[hsl(var(--avivar-muted)/0.5)] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Tag className={`h-4 w-4 ${isSelected ? 'text-[hsl(var(--avivar-primary))]' : 'text-[hsl(var(--avivar-muted-foreground))]'}`} />
                        <span className={`text-sm ${isSelected ? 'text-[hsl(var(--avivar-primary))] font-medium' : 'text-[hsl(var(--avivar-foreground))]'}`}>
                          #{tag}
                        </span>
                      </div>
                      <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2 border-t border-[hsl(var(--avivar-border))]">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-[hsl(var(--avivar-muted-foreground))]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
