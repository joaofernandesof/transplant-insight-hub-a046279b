/**
 * LeadTagsInline - Tags inline com seleção, exclusão e adição rápida
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LeadTagsInlineProps {
  leadPhone: string;
  tags: string[];
  onTagsChanged?: () => void;
}

export function LeadTagsInline({ leadPhone, tags, onTagsChanged }: LeadTagsInlineProps) {
  const [selectedTagIndex, setSelectedTagIndex] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Carregar todas as tags existentes quando abre dropdown
  useEffect(() => {
    if (isDropdownOpen && user) {
      loadAllTags();
    }
  }, [isDropdownOpen, user]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setSelectedTagIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handler de teclado para exclusão
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedTagIndex !== null && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        removeTag(tags[selectedTagIndex]);
      }
      if (e.key === 'Escape') {
        setSelectedTagIndex(null);
        setIsDropdownOpen(false);
      }
    };

    if (selectedTagIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedTagIndex, tags]);

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

      const tagCounts: Record<string, number> = {};
      data?.forEach(lead => {
        if (lead.tags && Array.isArray(lead.tags)) {
          lead.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

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

  // Tags disponíveis para adicionar (excluindo as já existentes)
  const availableTags = useMemo(() => {
    return allTags.filter(t => !tags.includes(t.tag));
  }, [allTags, tags]);

  const removeTag = async (tagToRemove: string) => {
    if (!user) return;

    const newTags = tags.filter(t => t !== tagToRemove);
    
    try {
      const { error } = await supabase
        .from('avivar_kanban_leads')
        .update({ tags: newTags, updated_at: new Date().toISOString() })
        .eq('phone', leadPhone)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setSelectedTagIndex(null);
      onTagsChanged?.();
    } catch (error) {
      console.error('Erro ao remover tag:', error);
      toast.error('Erro ao remover tag');
    }
  };

  const addTag = async (tagToAdd: string) => {
    if (!user || tags.includes(tagToAdd)) return;

    const newTags = [...tags, tagToAdd];
    
    try {
      const { error } = await supabase
        .from('avivar_kanban_leads')
        .update({ tags: newTags, updated_at: new Date().toISOString() })
        .eq('phone', leadPhone)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setIsDropdownOpen(false);
      onTagsChanged?.();
    } catch (error) {
      console.error('Erro ao adicionar tag:', error);
      toast.error('Erro ao adicionar tag');
    }
  };

  const handleTagClick = (index: number) => {
    if (selectedTagIndex === index) {
      // Toggle dropdown se já está selecionado
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setSelectedTagIndex(index);
      setIsDropdownOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative mt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag, idx) => (
          <button
            key={idx}
            onClick={() => handleTagClick(idx)}
            className={cn(
              "text-xs px-1.5 py-0.5 rounded transition-all outline-none",
              selectedTagIndex === idx
                ? "bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] ring-1 ring-[hsl(var(--avivar-primary)/0.5)]"
                : "text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-muted)/0.5)]"
            )}
          >
            #{tag}
          </button>
        ))}
        
        {/* Botão para adicionar tag */}
        <button
          onClick={() => {
            setSelectedTagIndex(null);
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className="text-xs px-1.5 py-0.5 rounded text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-muted)/0.5)] hover:text-[hsl(var(--avivar-primary))] transition-colors"
        >
          + tag
        </button>
      </div>

      {/* Dropdown de tags */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 max-h-48 overflow-y-auto bg-popover border border-[hsl(var(--avivar-border))] rounded-md shadow-lg z-50">
          {isLoading ? (
            <div className="p-3 text-xs text-[hsl(var(--avivar-muted-foreground))] text-center">
              Carregando...
            </div>
          ) : availableTags.length === 0 ? (
            <div className="p-3 text-xs text-[hsl(var(--avivar-muted-foreground))] text-center">
              Nenhuma tag disponível
            </div>
          ) : (
            <div className="py-1">
              {availableTags.map(({ tag }) => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="w-full text-left px-3 py-1.5 text-sm text-[hsl(var(--avivar-foreground))] hover:bg-[hsl(var(--avivar-muted)/0.5)] transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dica de exclusão */}
      {selectedTagIndex !== null && (
        <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] mt-1">
          Pressione Delete para remover
        </p>
      )}
    </div>
  );
}
