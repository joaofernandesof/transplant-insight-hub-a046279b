/**
 * ImageGalleryUpload - Upload de Imagens por Categoria
 * Categorias: Antes/Depois, Catálogo, Localização, Geral
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, 
  Upload, 
  Link2, 
  Trash2, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Clipboard,
  Split,
  ShoppingBag,
  MapPin,
  ImageIcon,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  ImageGallery, 
  GalleryImage, 
  ImageCategory, 
  IMAGE_CATEGORY_LABELS,
  EMPTY_IMAGE_GALLERY 
} from '../types';

interface ImageItem {
  id: string;
  url: string;
  caption: string;
  file?: File;
  preview?: string;
  isUploaded: boolean;
  isUploading?: boolean;
  error?: string;
}

interface ImageGalleryUploadProps {
  gallery: ImageGallery;
  onChange: (gallery: ImageGallery) => void;
  maxImagesPerCategory?: number;
}

const CATEGORY_ICONS: Record<ImageCategory, React.ReactNode> = {
  before_after: <Split className="h-4 w-4" />,
  catalog: <ShoppingBag className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  general: <ImageIcon className="h-4 w-4" />
};

export function ImageGalleryUpload({ 
  gallery = EMPTY_IMAGE_GALLERY, 
  onChange, 
  maxImagesPerCategory = 10 
}: ImageGalleryUploadProps) {
  const [activeCategory, setActiveCategory] = useState<ImageCategory>('before_after');
  const [imageItems, setImageItems] = useState<Record<ImageCategory, ImageItem[]>>({
    before_after: [],
    catalog: [],
    location: [],
    general: []
  });
  const [manualUrl, setManualUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with external gallery prop - track if initially loaded
  const [initiallyLoaded, setInitiallyLoaded] = useState(false);
  
  useEffect(() => {
    // Only sync from external gallery on first meaningful load
    // or when gallery has content and we haven't synced yet
    const hasGalleryContent = gallery && Object.values(gallery).some(arr => arr && arr.length > 0);
    
    if (!initiallyLoaded && hasGalleryContent) {
      const items: Record<ImageCategory, ImageItem[]> = {
        before_after: [],
        catalog: [],
        location: [],
        general: []
      };

      (Object.keys(gallery) as ImageCategory[]).forEach(cat => {
        items[cat] = (gallery[cat] || []).map(img => ({
          id: img.id,
          url: img.url,
          caption: img.caption || '',
          isUploaded: true
        }));
      });

      setImageItems(items);
      setInitiallyLoaded(true);
    } else if (!initiallyLoaded && !hasGalleryContent) {
      // Mark as loaded even if empty, so we don't overwrite user additions
      setInitiallyLoaded(true);
    }
  }, [gallery, initiallyLoaded]);

  // Update parent when items change
  const updateParent = useCallback((items: Record<ImageCategory, ImageItem[]>) => {
    const newGallery: ImageGallery = {
      before_after: items.before_after.filter(i => i.isUploaded).map(i => ({
        id: i.id,
        url: i.url,
        caption: i.caption,
        category: 'before_after' as ImageCategory
      })),
      catalog: items.catalog.filter(i => i.isUploaded).map(i => ({
        id: i.id,
        url: i.url,
        caption: i.caption,
        category: 'catalog' as ImageCategory
      })),
      location: items.location.filter(i => i.isUploaded).map(i => ({
        id: i.id,
        url: i.url,
        caption: i.caption,
        category: 'location' as ImageCategory
      })),
      general: items.general.filter(i => i.isUploaded).map(i => ({
        id: i.id,
        url: i.url,
        caption: i.caption,
        category: 'general' as ImageCategory
      }))
    };
    onChange(newGallery);
  }, [onChange]);

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/gallery/${activeCategory}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('surgery-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('surgery-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Process files
  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isImage && isValidSize;
    });

    if (validFiles.length === 0) {
      toast.error('Nenhuma imagem válida. Use PNG, JPG, GIF ou WebP (máx. 5MB)');
      return;
    }

    const currentItems = imageItems[activeCategory];
    const remainingSlots = maxImagesPerCategory - currentItems.length;
    const filesToProcess = validFiles.slice(0, remainingSlots);

    if (filesToProcess.length < validFiles.length) {
      toast.warning(`Apenas ${filesToProcess.length} imagens adicionadas. Limite: ${maxImagesPerCategory}`);
    }

    const newItems: ImageItem[] = filesToProcess.map(file => ({
      id: crypto.randomUUID(),
      url: '',
      caption: '',
      file,
      preview: URL.createObjectURL(file),
      isUploaded: false,
      isUploading: true
    }));

    setImageItems(prev => ({
      ...prev,
      [activeCategory]: [...prev[activeCategory], ...newItems]
    }));

    for (const item of newItems) {
      if (!item.file) continue;

      try {
        const url = await uploadImage(item.file);
        
        setImageItems(prev => {
          const updated = {
            ...prev,
            [activeCategory]: prev[activeCategory].map(img => 
              img.id === item.id 
                ? { ...img, url, isUploaded: true, isUploading: false }
                : img
            )
          };
          updateParent(updated);
          return updated;
        });
        
      } catch (error: any) {
        console.error('Upload error:', error);
        setImageItems(prev => ({
          ...prev,
          [activeCategory]: prev[activeCategory].map(img => 
            img.id === item.id 
              ? { ...img, isUploading: false, error: 'Falha no upload' }
              : img
          )
        }));
      }
    }
  };

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [activeCategory, imageItems]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  // File select handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add manual URL
  const addManualUrl = () => {
    if (!manualUrl.trim()) return;

    try {
      new URL(manualUrl);
      
      const currentItems = imageItems[activeCategory];
      if (currentItems.length >= maxImagesPerCategory) {
        toast.error(`Limite de ${maxImagesPerCategory} imagens atingido`);
        return;
      }

      const newItem: ImageItem = {
        id: crypto.randomUUID(),
        url: manualUrl,
        caption: caption,
        isUploaded: true
      };

      setImageItems(prev => {
        const updated = {
          ...prev,
          [activeCategory]: [...prev[activeCategory], newItem]
        };
        updateParent(updated);
        return updated;
      });
      
      setManualUrl('');
      setCaption('');
      toast.success('Imagem adicionada');
      
    } catch {
      toast.error('URL inválida');
    }
  };

  // Update caption
  const updateCaption = (id: string, newCaption: string) => {
    setImageItems(prev => {
      const updated = {
        ...prev,
        [activeCategory]: prev[activeCategory].map(img => 
          img.id === id ? { ...img, caption: newCaption } : img
        )
      };
      updateParent(updated);
      return updated;
    });
  };

  // Remove image
  const removeImage = (id: string) => {
    setImageItems(prev => {
      const item = prev[activeCategory].find(img => img.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      
      const updated = {
        ...prev,
        [activeCategory]: prev[activeCategory].filter(img => img.id !== id)
      };
      updateParent(updated);
      return updated;
    });
  };

  const currentItems = imageItems[activeCategory];
  const totalImages = Object.values(imageItems).reduce((acc, items) => acc + items.filter(i => i.isUploaded).length, 0);

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ImageCategory)}>
        <TabsList className="grid grid-cols-4 w-full">
          {(Object.keys(IMAGE_CATEGORY_LABELS) as ImageCategory[]).map(cat => (
            <TabsTrigger 
              key={cat} 
              value={cat}
              className="flex items-center gap-1.5 text-xs sm:text-sm"
            >
              {CATEGORY_ICONS[cat]}
              <span className="hidden sm:inline">{IMAGE_CATEGORY_LABELS[cat].name}</span>
              {imageItems[cat].length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                  {imageItems[cat].filter(i => i.isUploaded).length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(IMAGE_CATEGORY_LABELS) as ImageCategory[]).map(cat => (
          <TabsContent key={cat} value={cat} className="mt-4 space-y-4">
            {/* Category description */}
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] text-center">
              {IMAGE_CATEGORY_LABELS[cat].description}
            </p>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer",
                isDragActive 
                  ? "border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)]" 
                  : "border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center">
                  <Upload className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
                </div>
                
                <p className="text-sm text-[hsl(var(--avivar-foreground))]">
                  Arraste imagens ou clique para selecionar
                </p>
              </div>
            </div>

            {/* Manual URL input with caption */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="flex-1 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
                <Button
                  type="button"
                  onClick={addManualUrl}
                  disabled={!manualUrl.trim() || currentItems.length >= maxImagesPerCategory}
                  className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
              
              {manualUrl && (
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Legenda (ex: 'Resultado após 6 meses')"
                  className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                />
              )}
            </div>

            {/* Image grid */}
            {currentItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentItems.map((image) => (
                  <Card 
                    key={image.id}
                    className={cn(
                      "relative group overflow-hidden bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]",
                      image.error && "border-red-500/50"
                    )}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square relative">
                        <img
                          src={image.preview || image.url}
                          alt={image.caption || "Preview"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999">Erro</text></svg>';
                          }}
                        />
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(image.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </div>
                        
                        {/* Status indicators */}
                        {image.isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        )}
                        
                        {image.isUploaded && !image.isUploading && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500 drop-shadow" />
                          </div>
                        )}
                      </div>
                      
                      {/* Caption input */}
                      <div className="p-2 border-t border-[hsl(var(--avivar-border))]">
                        <Input
                          value={image.caption}
                          onChange={(e) => updateCaption(image.id, e.target.value)}
                          placeholder="Legenda (opcional)"
                          className="text-xs h-7 bg-transparent border-none p-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Counter */}
            <div className="flex items-center justify-center">
              <Badge 
                variant="secondary" 
                className={cn(
                  "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]",
                  currentItems.length >= maxImagesPerCategory && "bg-amber-500/20 text-amber-600"
                )}
              >
                {currentItems.filter(i => i.isUploaded).length} de {maxImagesPerCategory} imagens
              </Badge>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Total summary */}
      <div className="text-center text-sm text-[hsl(var(--avivar-muted-foreground))]">
        Total: <span className="font-medium text-[hsl(var(--avivar-foreground))]">{totalImages}</span> imagens na galeria
      </div>

      {/* Usage tip */}
      <Card className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.2)]">
        <CardContent className="p-4">
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
            💡 <strong>Dica:</strong> Adicione legendas descritivas! A IA usa as legendas para saber 
            quando enviar cada imagem. Ex: "Resultado de transplante capilar masculino após 1 ano"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
