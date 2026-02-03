/**
 * Etapa Simplificada: Galeria de Imagens
 * Permite anexar imagens por categoria para o agente enviar quando fizer sentido.
 */

import React from 'react';
import { ImageGalleryUpload } from '../../ImageGalleryUpload';
import { EMPTY_IMAGE_GALLERY, ImageGallery } from '../../../types';

interface StepImagesSimpleProps {
  gallery: ImageGallery;
  onChange: (gallery: ImageGallery) => void;
}

export function StepImagesSimple({ gallery = EMPTY_IMAGE_GALLERY, onChange }: StepImagesSimpleProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Adicionar imagens
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Configure imagens (antes/depois, catálogo, localização) para a IA enviar no momento certo.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <ImageGalleryUpload gallery={gallery} onChange={onChange} maxImagesPerCategory={10} />
      </div>
    </div>
  );
}
