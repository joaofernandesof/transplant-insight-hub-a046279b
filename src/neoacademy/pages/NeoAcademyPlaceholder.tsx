import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description?: string;
}

export default function NeoAcademyPlaceholder({ title, description }: PlaceholderProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <h1 className="text-lg font-bold text-white">{title}</h1>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto">
            <Construction className="h-8 w-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-zinc-500 max-w-md">
            {description || 'Este módulo está em desenvolvimento e será liberado em breve.'}
          </p>
        </div>
      </div>
    </div>
  );
}
