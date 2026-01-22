import { useEffect, useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight, Sparkles, GraduationCap, Gift, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

interface BannerSlide {
  id: string;
  title: string;
  highlight: string;
  icon: React.ElementType;
  bgClass: string;
  route: string;
}

const bannerSlides: BannerSlide[] = [
  {
    id: 'university',
    title: 'Aprenda a escalar sua clínica com a',
    highlight: 'Universidade ByNeofolic',
    icon: GraduationCap,
    bgClass: 'bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87]',
    route: '/university'
  },
  {
    id: 'referral',
    title: 'Indique colegas e ganhe',
    highlight: '5% de comissão',
    icon: Gift,
    bgClass: 'bg-gradient-to-r from-orange-500 to-amber-500',
    route: '/indique-e-ganhe'
  },
  {
    id: 'mentorship',
    title: 'Participe da próxima',
    highlight: 'Sala Técnica',
    icon: Sparkles,
    bgClass: 'bg-gradient-to-r from-violet-600 to-purple-600',
    route: '/sala-tecnica'
  },
  {
    id: 'hotleads',
    title: 'Acompanhe seus leads quentes no',
    highlight: 'HotLeads',
    icon: Sparkles,
    bgClass: 'bg-gradient-to-r from-rose-500 to-pink-600',
    route: '/hotleads'
  }
];

export function HomeBannerCarousel() {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'start',
      skipSnaps: false
    }
  );

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
    }, 5000);

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
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {bannerSlides.map((slide) => (
            <div 
              key={slide.id} 
              className="flex-[0_0_100%] min-w-0 pl-0"
            >
              <Card
                className={`${slide.bgClass} text-white border-0 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl`}
                onClick={() => navigate(slide.route)}
              >
                <div className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
                    <slide.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm opacity-90 leading-tight mb-0.5">
                      {slide.title}
                    </p>
                    <p className="font-bold text-lg">{slide.highlight}</p>
                  </div>
                  <ChevronRight className="h-6 w-6 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        aria-label="Próximo"
      >
        <ChevronRight className="h-4 w-4 text-foreground" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {bannerSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              selectedIndex === index 
                ? "w-6 bg-primary" 
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}