/**
 * AvivarTutorialsPage - Página de Tutoriais do Avivar
 * Exibe vídeos de treinamento gerenciados por admins
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Plus, 
  Pencil, 
  Trash2, 
  Video,
  Loader2,
  BookOpen,
  Search
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { toast } from 'sonner';

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  { value: 'inicio', label: 'Primeiros Passos' },
  { value: 'leads', label: 'Gestão de Leads' },
  { value: 'chats', label: 'Chats & Mensagens' },
  { value: 'agentes', label: 'Agentes de IA' },
  { value: 'agenda', label: 'Agenda & Agendamentos' },
  { value: 'integracao', label: 'Integrações' },
  { value: 'dicas', label: 'Dicas & Truques' },
  { value: 'geral', label: 'Geral' },
];

export default function AvivarTutorialsPage() {
  const { isAdmin } = useUnifiedAuth();
  const { accountId } = useAvivarAccount();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    category: 'geral',
  });

  // Fetch tutorials
  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ['avivar-tutorials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avivar_tutorials')
        .select('*')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Tutorial[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('avivar_tutorials')
          .update({
            title: data.title,
            description: data.description,
            video_url: data.video_url,
            thumbnail_url: data.thumbnail_url || null,
            category: data.category,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('avivar_tutorials')
          .insert({
            account_id: accountId!,
            title: data.title,
            description: data.description,
            video_url: data.video_url,
            thumbnail_url: data.thumbnail_url || null,
            category: data.category,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingTutorial ? 'Tutorial atualizado!' : 'Tutorial criado!');
      queryClient.invalidateQueries({ queryKey: ['avivar-tutorials'] });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving tutorial:', error);
      toast.error('Erro ao salvar tutorial');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('avivar_tutorials')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tutorial excluído!');
      queryClient.invalidateQueries({ queryKey: ['avivar-tutorials'] });
    },
    onError: (error) => {
      console.error('Error deleting tutorial:', error);
      toast.error('Erro ao excluir tutorial');
    },
  });

  const handleOpenDialog = (tutorial?: Tutorial) => {
    if (tutorial) {
      setEditingTutorial(tutorial);
      setFormData({
        title: tutorial.title,
        description: tutorial.description || '',
        video_url: tutorial.video_url,
        thumbnail_url: tutorial.thumbnail_url || '',
        category: tutorial.category,
      });
    } else {
      setEditingTutorial(null);
      setFormData({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        category: 'geral',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTutorial(null);
    setFormData({
      title: '',
      description: '',
      video_url: '',
      thumbnail_url: '',
      category: 'geral',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.video_url) {
      toast.error('Preencha título e URL do vídeo');
      return;
    }
    saveMutation.mutate({ ...formData, id: editingTutorial?.id });
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tutorial?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter tutorials
  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tutorial.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedTutorials = filteredTutorials.reduce((acc, tutorial) => {
    const cat = tutorial.category || 'geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tutorial);
    return acc;
  }, {} as Record<string, Tutorial[]>);

  // Extract video ID for embedding
  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    
    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;
    
    return url;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
            Tutoriais
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Aprenda a utilizar todas as funcionalidades do Avivar
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tutorial
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
              <DialogHeader>
                <DialogTitle className="text-[hsl(var(--avivar-foreground))]">
                  {editingTutorial ? 'Editar Tutorial' : 'Novo Tutorial'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Como configurar seu primeiro agente"
                    className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descrição do conteúdo..."
                    className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL do Vídeo *</Label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                    className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                  />
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    Suporta YouTube, Vimeo e Loom
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveMutation.isPending}
                    className="bg-[hsl(var(--avivar-primary))]"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingTutorial ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          <Input
            placeholder="Buscar tutorial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Video Player Modal */}
      {playingVideo && (
        <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
          <DialogContent className="max-w-4xl bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <div className="aspect-video">
              <iframe
                src={getEmbedUrl(playingVideo)}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Empty State */}
      {tutorials.length === 0 && (
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center mb-4">
              <Video className="h-10 w-10 text-[hsl(var(--avivar-primary))]" />
            </div>
            <h3 className="text-xl font-semibold text-[hsl(var(--avivar-foreground))] mb-2">
              Nenhum tutorial disponível
            </h3>
            <p className="text-[hsl(var(--avivar-muted-foreground))] text-center max-w-md">
              Em breve teremos tutoriais para te ajudar a aproveitar ao máximo o Avivar
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tutorials by Category */}
      {Object.entries(groupedTutorials).map(([category, categoryTutorials]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Badge variant="outline" className="border-[hsl(var(--avivar-primary)/0.5)] text-[hsl(var(--avivar-primary))]">
              {CATEGORIES.find(c => c.value === category)?.label || category}
            </Badge>
            <span className="text-sm font-normal text-[hsl(var(--avivar-muted-foreground))]">
              ({categoryTutorials.length} {categoryTutorials.length === 1 ? 'vídeo' : 'vídeos'})
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTutorials.map((tutorial) => (
              <Card 
                key={tutorial.id}
                className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)] transition-colors group"
              >
                <CardHeader className="p-4 pb-2">
                  <div 
                    className="relative aspect-video bg-[hsl(var(--avivar-background))] rounded-lg overflow-hidden cursor-pointer mb-3"
                    onClick={() => setPlayingVideo(tutorial.video_url)}
                  >
                    {tutorial.thumbnail_url ? (
                      <img 
                        src={tutorial.thumbnail_url} 
                        alt={tutorial.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(270_75%_45%/0.3)] to-[hsl(280_80%_50%/0.3)]">
                        <Video className="h-12 w-12 text-[hsl(var(--avivar-primary))]" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-6 w-6 text-[hsl(var(--avivar-primary))] ml-1" />
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">
                    {tutorial.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {tutorial.description && (
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] line-clamp-2 mb-3">
                      {tutorial.description}
                    </p>
                  )}
                  
                  {isAdmin && (
                    <div className="flex gap-2 pt-2 border-t border-[hsl(var(--avivar-border))]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(tutorial)}
                        className="text-[hsl(var(--avivar-muted-foreground))]"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tutorial.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
