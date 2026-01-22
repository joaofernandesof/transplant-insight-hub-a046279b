import { useEffect, useCallback, useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

interface BannerSlide {
  id: string;
  title?: string;
  subtitle?: string;
  highlight?: string;
  bgColor?: string;
  bgImage?: string;
  textPosition?: 'left' | 'center' | 'right';
  route: string;
}

// Banners configuráveis - adicione imagens de banner aqui
const bannerSlides: BannerSlide[] = [
  {
    id: 'university',
    title: 'Aprenda a escalar sua clínica',
    subtitle: 'Conheça a',
    highlight: 'Universidade ByNeofolic',
    bgColor: 'bg-gradient-to-r from-[#1e3a5f] via-[#2d5a87] to-[#1e3a5f]',
    textPosition: 'left',
    route: '/university'
  },
  {
    id: 'referral',
    title: 'Indique colegas e ganhe',
    subtitle: 'Programa de indicação',
    highlight: '5% de comissão',
    bgColor: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600',
    textPosition: 'left',
    route: '/indique-e-ganhe'
  },
  {
    id: 'sala-tecnica',
    title: 'Participe dos eventos exclusivos',
    subtitle: 'Mentorias, workshops e encontros',
    highlight: 'Agenda do Licenciado',
    bgColor: 'bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700',
    textPosition: 'left',
    route: '/sala-tecnica'
  },
  {
    id: 'hotleads',
    title: 'Leads qualificados para você',
    subtitle: 'Acompanhe em tempo real',
    highlight: 'HotLeads',
    bgColor: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600',
    textPosition: 'left',
    route: '/hotleads'
  }
];

export function HomeBannerCarousel() {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
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

  return (
    <div className="relative mb-6 group">
      {/* Main Carousel */}
      <div className="overflow-hidden rounded-2xl shadow-lg" ref={emblaRef}>
        <div className="flex">
          {bannerSlides.map((slide) => (
            <div 
              key={slide.id} 
              className="flex-[0_0_100%] min-w-0"
            >
              <div
                className={cn(
                  "relative h-40 sm:h-48 md:h-56 lg:h-64 cursor-pointer overflow-hidden transition-all duration-500",
                  slide.bgColor,
                  !slide.bgImage && "text-white"
                )}
                style={slide.bgImage ? { 
                  backgroundImage: `url(${slide.bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
                onClick={() => navigate(slide.route)}
              >
                {/* Overlay para imagens de fundo */}
                {slide.bgImage && (
                  <div className="absolute inset-0 bg-black/30" />
                )}
                
                {/* Conteúdo do Banner */}
                <div className={cn(
                  "relative h-full flex flex-col justify-center px-6 sm:px-10 md:px-16",
                  slide.textPosition === 'center' && "items-center text-center",
                  slide.textPosition === 'right' && "items-end text-right"
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
                  
                  {/* CTA Arrow */}
                  <div className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2">
                    <div className="p-2 sm:p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                      <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                  </div>
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
        {bannerSlides.map((_, index) => (
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