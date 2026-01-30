/**
 * Etapa 9: Fotos Antes e Depois
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, Plus, Trash2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepImagesProps {
  images: string[];
  onChange: (images: string[]) => void;
}

const MAX_IMAGES = 10;

export function StepImages({ images, onChange }: StepImagesProps) {
  const [imageStatuses, setImageStatuses] = useState<Record<number, 'valid' | 'invalid' | 'loading'>>({});

  const addImage = () => {
    if (images.length < MAX_IMAGES) {
      onChange([...images, '']);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    
    // Update statuses
    const newStatuses = { ...imageStatuses };
    delete newStatuses[index];
    setImageStatuses(newStatuses);
  };

  const updateImage = (index: number, url: string) => {
    const updated = [...images];
    updated[index] = url;
    onChange(updated);

    // Validate URL
    if (url) {
      setImageStatuses(prev => ({ ...prev, [index]: 'loading' }));
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Try to load image
        const img = new window.Image();
        img.onload = () => setImageStatuses(prev => ({ ...prev, [index]: 'valid' }));
        img.onerror = () => setImageStatuses(prev => ({ ...prev, [index]: 'invalid' }));
        img.src = url;
      } else {
        setImageStatuses(prev => ({ ...prev, [index]: 'invalid' }));
      }
    } else {
      setImageStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[index];
        return newStatuses;
      });
    }
  };

  const validImages = images.filter((url, i) => url && imageStatuses[i] === 'valid');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Adicione fotos de resultados (opcional)
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Mostre resultados reais! A IA enviará quando pacientes pedirem
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        {/* Image list */}
        {images.map((url, index) => (
          <Card key={index} className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Preview thumbnail */}
                <div className={cn(
                  "w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
                  "bg-[hsl(var(--avivar-muted))] border border-[hsl(var(--avivar-border))]"
                )}>
                  {url && imageStatuses[index] === 'valid' ? (
                    <img 
                      src={url} 
                      alt={`Imagem ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="h-6 w-6 text-[hsl(var(--avivar-muted-foreground))]" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <Label className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Imagem {index + 1}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={url}
                      onChange={(e) => updateImage(index, e.target.value)}
                      placeholder="https://exemplo.com/foto.jpg"
                      className="flex-1 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImage(index)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Status indicator */}
                  {url && imageStatuses[index] && (
                    <div className="flex items-center gap-1 text-xs">
                      {imageStatuses[index] === 'loading' && (
                        <span className="text-[hsl(var(--avivar-muted-foreground))]">⏳ Validando...</span>
                      )}
                      {imageStatuses[index] === 'valid' && (
                        <span className="text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Válida
                        </span>
                      )}
                      {imageStatuses[index] === 'invalid' && (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Não foi possível carregar
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add button */}
        {images.length < MAX_IMAGES && (
          <Button
            variant="outline"
            onClick={addImage}
            className="w-full border-dashed border-2 border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:border-[hsl(var(--avivar-primary))] hover:text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.05)]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Imagem
          </Button>
        )}

        {/* Counter */}
        <div className="flex items-center justify-center">
          <Badge variant="secondary" className="bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]">
            {images.length} de {MAX_IMAGES} imagens adicionadas
          </Badge>
        </div>

        {/* Tip */}
        <p className="text-center text-xs text-[hsl(var(--avivar-muted-foreground))]">
          💡 Dica: Use URLs públicas (Imgur, Google Drive, Dropbox)
        </p>
      </div>
    </div>
  );
}
