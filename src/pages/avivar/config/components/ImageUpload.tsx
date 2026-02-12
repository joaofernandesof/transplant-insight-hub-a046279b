/**
 * ImageUpload - Upload de Imagens Antes/Depois
 * Suporta: Drag & Drop, Paste (Ctrl+V), Seleção de Diretório, URLs manuais
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Image, 
  Upload, 
  Link2, 
  Trash2, 
  Plus, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Clipboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  preview?: string;
  isUploaded: boolean;
  isUploading?: boolean;
  error?: string;
}

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 10 }: ImageUploadProps) {
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [manualUrl, setManualUrl] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Sync with external images prop
  useEffect(() => {
    if (images.length > 0 && imageItems.length === 0) {
      const items: ImageItem[] = images.map(url => ({
        id: crypto.randomUUID(),
        url,
        isUploaded: true
      }));
      setImageItems(items);
    }
  }, [images]);

  // Update parent when items change
  const updateParent = useCallback((items: ImageItem[]) => {
    const urls = items
      .filter(img => img.isUploaded && img.url)
      .map(img => img.url);
    onChange(urls);
  }, [onChange]);

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Upload to surgery-photos bucket (reusing existing bucket)
    const { data, error } = await supabase.storage
      .from('surgery-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get signed URL since bucket is private
    const { data: signedData } = await supabase.storage
      .from('surgery-photos')
      .createSignedUrl(fileName, 86400); // 24-hour expiry

    return signedData?.signedUrl || fileName;
  };

  // Process files (from drop, paste, or select)
  const processFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isImage && isValidSize;
    });

    if (validFiles.length === 0) {
      toast.error('Nenhuma imagem válida. Use PNG, JPG, GIF ou WebP (máx. 5MB)');
      return;
    }

    const remainingSlots = maxImages - imageItems.length;
    const filesToProcess = validFiles.slice(0, remainingSlots);

    if (filesToProcess.length < validFiles.length) {
      toast.warning(`Apenas ${filesToProcess.length} imagens adicionadas. Limite: ${maxImages}`);
    }

    // Create temporary items with previews
    const newItems: ImageItem[] = filesToProcess.map(file => ({
      id: crypto.randomUUID(),
      url: '',
      file,
      preview: URL.createObjectURL(file),
      isUploaded: false,
      isUploading: true
    }));

    setImageItems(prev => [...prev, ...newItems]);

    // Upload each file
    for (const item of newItems) {
      if (!item.file) continue;

      try {
        const url = await uploadImage(item.file);
        
        setImageItems(prev => {
          const updated = prev.map(img => 
            img.id === item.id 
              ? { ...img, url, isUploaded: true, isUploading: false }
              : img
          );
          updateParent(updated);
          return updated;
        });
        
      } catch (error: any) {
        console.error('Upload error:', error);
        
        setImageItems(prev => 
          prev.map(img => 
            img.id === item.id 
              ? { ...img, isUploading: false, error: 'Falha no upload' }
              : img
          )
        );
      }
    }
  };

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [imageItems.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  // Paste handler
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      processFiles(imageFiles);
      toast.info('Imagem colada da área de transferência');
    }
  }, [imageItems.length]);

  // Add paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  // File select handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add manual URL
  const addManualUrl = () => {
    if (!manualUrl.trim()) return;

    try {
      new URL(manualUrl);
      
      if (imageItems.length >= maxImages) {
        toast.error(`Limite de ${maxImages} imagens atingido`);
        return;
      }

      const newItem: ImageItem = {
        id: crypto.randomUUID(),
        url: manualUrl,
        isUploaded: true
      };

      setImageItems(prev => {
        const updated = [...prev, newItem];
        updateParent(updated);
        return updated;
      });
      
      setManualUrl('');
      toast.success('Imagem adicionada');
      
    } catch {
      toast.error('URL inválida');
    }
  };

  // Remove image
  const removeImage = (id: string) => {
    setImageItems(prev => {
      const item = prev.find(img => img.id === id);
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
      const updated = prev.filter(img => img.id !== id);
      updateParent(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
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
        
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center">
            <Image className="h-8 w-8 text-[hsl(var(--avivar-primary))]" />
          </div>
          
          {isDragActive ? (
            <p className="text-[hsl(var(--avivar-primary))] font-medium">
              Solte as imagens aqui...
            </p>
          ) : (
            <>
              <p className="text-[hsl(var(--avivar-foreground))] font-medium">
                Arraste imagens, cole (Ctrl+V) ou clique
              </p>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                PNG, JPG, GIF, WebP • Máximo 5MB por imagem
              </p>
            </>
          )}
        </div>
      </div>

      {/* Paste hint */}
      <div className="flex items-center justify-center gap-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
        <Clipboard className="h-3 w-3" />
        <span>Dica: Use Ctrl+V para colar imagens da área de transferência</span>
      </div>

      {/* Manual URL input */}
      <div className="space-y-2">
        <Label className="text-[hsl(var(--avivar-foreground))]">
          Ou adicione via URL
        </Label>
        <div className="flex gap-2">
          <Input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
            className="flex-1 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
            onKeyPress={(e) => e.key === 'Enter' && addManualUrl()}
          />
          <Button
            type="button"
            onClick={addManualUrl}
            disabled={!manualUrl.trim() || imageItems.length >= maxImages}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            <Link2 className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Image grid */}
      {imageItems.length > 0 && (
        <div className="space-y-3">
          <Label className="text-[hsl(var(--avivar-foreground))]">
            Imagens Adicionadas ({imageItems.length}/{maxImages})
          </Label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageItems.map((image) => (
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
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999">Erro</text></svg>';
                      }}
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(image.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
                        <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">
                          <CheckCircle2 className="h-2 w-2 mr-0.5" />
                          OK
                        </Badge>
                      </div>
                    )}
                    
                    {image.error && (
                      <div className="absolute top-1 right-1">
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          <AlertCircle className="h-2 w-2 mr-0.5" />
                          Erro
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Counter */}
      <div className="flex items-center justify-center">
        <Badge 
          variant="secondary" 
          className={cn(
            "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]",
            imageItems.length >= maxImages && "bg-amber-500/20 text-amber-600"
          )}
        >
          {imageItems.length} de {maxImages} imagens
        </Badge>
      </div>

      {/* Tip */}
      <p className="text-center text-xs text-[hsl(var(--avivar-muted-foreground))]">
        💡 Dica: Imagens de antes/depois aumentam a confiança dos pacientes!
      </p>
    </div>
  );
}
