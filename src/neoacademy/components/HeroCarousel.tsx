import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  order_index: number;
}

export function HeroCarousel() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ['neoacademy-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (error) throw error;
      return (data || []) as Banner[];
    },
  });

  const items = banners || [];
  const total = items.length;

  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total]);

  // Auto-advance every 6s
  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [total, next]);

  if (!items.length) return null;

  const banner = items[current];

  return (
    <div className="relative w-full h-[220px] sm:h-[280px] rounded-2xl overflow-hidden group">
      {/* Background image */}
      <div className="absolute inset-0 transition-opacity duration-700">
        {banner.image_url ? (
          <img
            src={banner.image_url}
            alt={banner.title || 'Banner'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900/80 via-[#1a1a2e] to-sky-900/60" />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 sm:p-8 max-w-xl">
        {banner.title && (
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-1 leading-tight">
            {banner.title}
          </h2>
        )}
        {banner.subtitle && (
          <p className="text-zinc-200 text-xs sm:text-sm mb-4 line-clamp-2">
            {banner.subtitle}
          </p>
        )}
        {banner.link_url && (
          <button
            onClick={() => {
              if (banner.link_url!.startsWith('http')) {
                window.open(banner.link_url!, '_blank');
              } else {
                navigate(banner.link_url!);
              }
            }}
            className="self-start px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-500/30"
          >
            {banner.link_label || 'Saiba Mais'}
          </button>
        )}
      </div>

      {/* Nav arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === current ? "w-6 bg-blue-400" : "w-1.5 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
