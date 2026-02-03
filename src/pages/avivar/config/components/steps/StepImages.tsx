/**
 * Etapa 9: Galeria de Imagens do Agente
 * Categorias: Antes/Depois, Catálogo, Localização, Geral
 */

import React from 'react';
import { ImageGalleryUpload } from '../ImageGalleryUpload';
import { ImageGallery, EMPTY_IMAGE_GALLERY } from '../../types';

interface StepImagesProps {
  gallery: ImageGallery;
  onChange: (gallery: ImageGallery) => void;
  // Legado - para compatibilidade
  images?: string[];
  onImagesChange?: (images: string[]) => void;
}

export function StepImages({ gallery = EMPTY_IMAGE_GALLERY, onChange }: StepImagesProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Galeria de Imagens do Agente
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Configure as imagens que a IA pode enviar durante as conversas
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <ImageGalleryUpload 
          gallery={gallery} 
          onChange={onChange} 
          maxImagesPerCategory={10} 
        />
      </div>
    </div>
  );
}