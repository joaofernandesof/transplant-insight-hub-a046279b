import { useState } from "react";
import { Video, useVideos, CreateVideoData } from "@/hooks/useVideos";
import { VideoCard, VideoPlayer } from "@/components/VideoPlayer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Link, 
  Search, 
  Film, 
  Loader2, 
  X, 
  Plus,
  PlayCircle,
  Grid,
  List
} from "lucide-react";

const VIDEO_CATEGORIES = [
  { value: 'geral', label: 'Geral' },
  { value: 'tutorial', label: 'Tutoriais' },
  { value: 'apresentacao', label: 'Apresentações' },
  { value: 'depoimento', label: 'Depoimentos' },
  { value: 'treinamento', label: 'Treinamentos' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'marketing', label: 'Marketing' },
];

interface VideoLibraryDialogProps {
  onSelect?: (video: Video) => void;
  trigger?: React.ReactNode;
  category?: string;
  title?: string;
}

export function VideoLibraryDialog({ 
  onSelect, 
  trigger,
  category: filterCategory,
  title = "Biblioteca de Vídeos"
}: VideoLibraryDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(filterCategory || "all");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { videos, isLoading } = useVideos(filterCategory);

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (video: Video) => {
    if (onSelect) {
      onSelect(video);
      setOpen(false);
    } else {
      setSelectedVideo(video);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Film className="h-4 w-4 mr-2" />
            Biblioteca de Vídeos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Selecione um vídeo da biblioteca ou adicione um novo
          </DialogDescription>
        </DialogHeader>

        {selectedVideo ? (
          // Video preview mode
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedVideo(null)}
              className="mb-2"
            >
              ← Voltar para lista
            </Button>
            <VideoPlayer video={selectedVideo} className="w-full" />
            <div>
              <h3 className="font-semibold text-lg">{selectedVideo.title}</h3>
              {selectedVideo.description && (
                <p className="text-muted-foreground mt-1">{selectedVideo.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{selectedVideo.category}</Badge>
                {selectedVideo.tags?.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
            {onSelect && (
              <Button onClick={() => { onSelect(selectedVideo); setOpen(false); }}>
                Selecionar este vídeo
              </Button>
            )}
          </div>
        ) : (
          // Library view
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar vídeos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {VIDEO_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-md">
                <Button 
                  variant={viewMode === "grid" ? "secondary" : "ghost"} 
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "secondary" : "ghost"} 
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Videos grid/list */}
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Film className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum vídeo encontrado' : 'Nenhum vídeo na biblioteca'}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
                  {filteredVideos.map(video => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      onClick={handleSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredVideos.map(video => (
                    <div
                      key={video.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleSelect(video)}
                    >
                      <div className="w-24 aspect-video bg-muted rounded overflow-hidden flex-shrink-0">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{video.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{video.description}</p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">{video.category}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Upload dialog for admins
interface VideoUploadDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (video: Video) => void;
}

export function VideoUploadDialog({ trigger, onSuccess }: VideoUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "link">("link");
  const { uploadVideo, isUploading } = useVideos();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("geral");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("geral");
    setExternalUrl("");
    setFile(null);
    setTags([]);
    setTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateVideoData = {
      title,
      description,
      category,
      tags,
    };

    if (uploadType === "file" && file) {
      data.file = file;
    } else if (uploadType === "link" && externalUrl) {
      data.external_url = externalUrl;
      // Auto-generate thumbnail for YouTube
      const ytMatch = externalUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        data.thumbnail_url = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
      }
    }

    try {
      const video = await uploadVideo(data);
      onSuccess?.(video);
      setOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Vídeo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Vídeo</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo ou adicione um link do YouTube/Vimeo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload type tabs */}
          <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as "file" | "link")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">
                <Link className="h-4 w-4 mr-2" />
                Link Externo
              </TabsTrigger>
              <TabsTrigger value="file">
                <Upload className="h-4 w-4 mr-2" />
                Upload Arquivo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="mt-4">
              <div className="space-y-2">
                <Label>URL do Vídeo (YouTube ou Vimeo)</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="file" className="mt-4">
              <div className="space-y-2">
                <Label>Arquivo de Vídeo</Label>
                <Input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Formatos: MP4, WebM, MOV. Máximo: 100MB
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Common fields */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              placeholder="Nome do vídeo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descrição breve do vídeo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isUploading || !title || (uploadType === "file" ? !file : !externalUrl)}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Adicionar Vídeo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
