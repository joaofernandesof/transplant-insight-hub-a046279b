import { useEffect, useCallback, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';
import { useActiveBanners, useTrackBannerClick, Banner } from '@/hooks/useBanners';
import { Skeleton } from '@/components/ui/skeleton';

// Fallback banners caso o banco esteja vazio
const fallbackBanners = [
  {
    id: 'university-fallback',
    title: 'Aprenda a escalar sua clínica',
    subtitle: 'Conheça a',
    highlight: 'Academia ByNeofolic',
    bg_color: 'bg-gradient-to-r from-[#1e3a5f] via-[#2d5a87] to-[#1e3a5f]',
    bg_image_url: null,
    text_position: 'left',
    route: '/university'
  },
  {
    id: 'sala-tecnica-fallback',
    title: 'Participe dos eventos exclusivos',
    subtitle: 'Mentorias, workshops e encontros',
    highlight: 'Agenda do Licenciado',
    bg_color: 'bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700',
    bg_image_url: null,
    text_position: 'left',
    route: '/sala-tecnica'
  }
];

export function HomeBannerCarousel() {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data: banners, isLoading } = useActiveBanners();
  const trackClick = useTrackBannerClick();
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    skipSnaps: false
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000);

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      clearInterval(autoplay);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleBannerClick = (banner: Banner | typeof fallbackBanners[0]) => {
    // Track click only for real banners from DB
    if ('click_count' in banner) {
      trackClick.mutate(banner.id);
    }
    navigate(banner.route);
  };

  const displayBanners = banners && banners.length > 0 ? banners : fallbackBanners;

  if (isLoading) {
    return (
      <div className="mb-6">
        <Skeleton className="h-40 sm:h-48 md:h-56 lg:h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="relative mb-6 group">
      {/* Main Carousel */}
      <div className="overflow-hidden rounded-2xl shadow-lg" ref={emblaRef}>
        <div className="flex">
          {displayBanners.map((slide) => (
            <div 
              key={slide.id} 
              className="flex-[0_0_100%] min-w-0"
            >
              <div
                className={cn(
                  "relative h-40 sm:h-48 md:h-56 lg:h-64 cursor-pointer overflow-hidden transition-all duration-500",
                  slide.bg_color,
                  !slide.bg_image_url && "text-white"
                )}
                style={slide.bg_image_url ? { 
                  backgroundImage: `url(${slide.bg_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
                onClick={() => handleBannerClick(slide)}
              >
                {/* Overlay para imagens de fundo */}
                {slide.bg_image_url && (
                  <div className="absolute inset-0 bg-black/30" />
                )}
                
                {/* Conteúdo do Banner */}
                <div className={cn(
                  "relative h-full flex flex-col justify-center px-6 sm:px-10 md:px-16",
                  slide.text_position === 'center' && "items-center text-center",
                  slide.text_position === 'right' && "items-end text-right"
                )}>
                  {slide.subtitle && (
                    <p className="text-sm sm:text-base opacity-90 mb-1">
                      {slide.subtitle}
                    </p>
                  )}
                  {slide.highlight && (
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                      {slide.highlight}
                    </h2>
                  )}
                  {slide.title && (
                    <p className="text-base sm:text-lg opacity-90 max-w-xl">
                      {slide.title}
                    </p>
                  )}
                  
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-white/5 blur-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
        aria-label="Próximo"
      >
        <ChevronRight className="h-5 w-5 text-foreground" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {displayBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              selectedIndex === index 
                ? "w-8 bg-primary" 
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}