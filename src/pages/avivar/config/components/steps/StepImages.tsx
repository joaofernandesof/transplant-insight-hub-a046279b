/**
 * Etapa 9: Fotos Antes e Depois
 * Suporta upload de arquivos do dispositivo (computador/celular), drag & drop, paste e URLs
 */

import React from 'react';
import { ImageUpload } from '../ImageUpload';

interface StepImagesProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function StepImages({ images, onChange }: StepImagesProps) {
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

      <div className="max-w-xl mx-auto">
        <ImageUpload 
          images={images} 
          onChange={onChange} 
          maxImages={10} 
        />
      </div>
    </div>
  );
}