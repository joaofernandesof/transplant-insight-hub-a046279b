import React from 'react';
import { Play, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroItem {
  id: string;
  title: string;
  description?: string;
  bannerUrl?: string;
  category?: string;
}

interface HeroCarouselProps {
  items: HeroItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const navigate = useNavigate();
  const featured = items[0];

  if (!featured) return null;

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden group">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-[#1a1a2e] to-sky-900/60">
        {featured.bannerUrl && (
          <img 
            src={featured.bannerUrl} 
            alt={featured.title} 
            className="w-full h-full object-cover opacity-40"
          />
        )}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/90 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-8 max-w-2xl">
        {featured.category && (
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
            <span className="text-sm font-semibold text-yellow-400 uppercase tracking-wider">
              {featured.category}
            </span>
          </div>
        )}
        <h1 className="text-4xl font-bold text-white mb-3 leading-tight">
          {featured.title}
        </h1>
        {featured.description && (
          <p className="text-zinc-300 text-base mb-6 line-clamp-2">
            {featured.description}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/neoacademy/course/${featured.id}`)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors shadow-lg shadow-blue-500/30"
          >
            <Play className="h-5 w-5" fill="white" />
            Assistir Agora
          </button>
          <button
            onClick={() => navigate(`/neoacademy/course/${featured.id}`)}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors border border-white/10"
          >
            Mais Detalhes
          </button>
        </div>
      </div>
    </div>
  );
}
