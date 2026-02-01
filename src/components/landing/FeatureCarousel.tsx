import React, { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CarouselPlaceholder } from './CarouselPlaceholder';

interface CarouselSlide {
  title: string;
  description: string;
  imagePlaceholder: string;
  imageUrl?: string;
  placeholderType?: 'dashboard-kpis' | 'dashboard-calendar' | 'dashboard-patient' | 
        'crm-pipeline' | 'crm-whatsapp' | 'crm-detective' |
        'mobile-scheduling' | 'mobile-journey';
  features?: string[];
}

interface FeatureCarouselProps {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  slides: CarouselSlide[];
  imagePosition?: 'left' | 'right';
}

export function FeatureCarousel({ 
  title, 
  subtitle, 
  badge, 
  badgeColor,
  slides,
  imagePosition = 'left'
}: FeatureCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  const currentSlide = slides[selectedIndex];

  return (
    <div className={cn(
      "grid gap-8 lg:gap-12 items-center",
      imagePosition === 'left' ? "lg:grid-cols-[1.2fr_1fr]" : "lg:grid-cols-[1fr_1.2fr]"
    )}>
      {/* Image/Carousel Side */}
      <div className={cn(
        "relative",
        imagePosition === 'right' && "lg:order-2"
      )}>
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide, index) => (
              <div 
                key={index}
                className="flex-[0_0_100%] min-w-0"
              >
                {/* Visual placeholder or image */}
                <div className="aspect-[16/10] bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                  {slide.placeholderType ? (
                    <CarouselPlaceholder type={slide.placeholderType} className="w-full h-full" />
                  ) : slide.imageUrl ? (
                    <img 
                      src={slide.imageUrl} 
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full p-4 flex flex-col">
                      {/* Mock header */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                        <div className="flex-1 h-6 bg-slate-800 rounded ml-4" />
                      </div>
                      {/* Mock content */}
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-slate-500 text-sm">{slide.imagePlaceholder}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/80 border-slate-700 hover:bg-slate-800 text-white"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/80 border-slate-700 hover:bg-slate-800 text-white"
          onClick={scrollNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === selectedIndex
                  ? `w-6 ${badgeColor}`
                  : "bg-slate-700 hover:bg-slate-600"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content Side */}
      <div className={cn(
        imagePosition === 'right' && "lg:order-1"
      )}>
        <Badge className={cn("mb-4 border-0", badgeColor.replace('bg-', 'bg-').concat('/20'), "text-white")}>
          {badge}
        </Badge>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {title}
        </h3>
        <p className="text-slate-400 mb-6">
          {subtitle}
        </p>

        {/* Current slide info */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h4 className="font-semibold text-white text-lg mb-1">{currentSlide.title}</h4>
            <p className="text-slate-500 text-sm">{currentSlide.description}</p>
          </div>
          
          {currentSlide.features && currentSlide.features.length > 0 && (
            <ul className="space-y-2">
              {currentSlide.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                  <div className={cn("w-1.5 h-1.5 rounded-full", badgeColor)} />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Slide thumbnails */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                index === selectedIndex
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:border-slate-600"
              )}
            >
              {slide.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
