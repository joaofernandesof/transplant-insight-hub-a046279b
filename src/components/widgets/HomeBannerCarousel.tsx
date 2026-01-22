import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, GraduationCap, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  highlight?: string;
  icon: React.ElementType;
  bgClass: string;
  textClass: string;
  route: string;
}

const bannerSlides: BannerSlide[] = [
  {
    id: 'university',
    title: 'Aprenda a escalar',
    subtitle: 'sua clínica com a',
    highlight: 'Universidade ByNeofolic',
    icon: GraduationCap,
    bgClass: 'bg-gradient-to-br from-primary to-primary/80',
    textClass: 'text-primary-foreground',
    route: '/university'
  },
  {
    id: 'referral',
    title: 'Indique colegas e',
    subtitle: 'ganhe',
    highlight: '5% de comissão',
    icon: Gift,
    bgClass: 'bg-gradient-to-br from-amber-500 to-orange-500',
    textClass: 'text-white',
    route: '/indique-e-ganhe'
  },
  {
    id: 'mentorship',
    title: 'Participe da',
    subtitle: 'próxima',
    highlight: 'Sala Técnica',
    icon: Sparkles,
    bgClass: 'bg-gradient-to-br from-violet-600 to-purple-600',
    textClass: 'text-white',
    route: '/sala-tecnica'
  }
];

export function HomeBannerCarousel() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      {bannerSlides.map((slide) => (
        <Card
          key={slide.id}
          className={`${slide.bgClass} ${slide.textClass} border-0 cursor-pointer group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]`}
          onClick={() => navigate(slide.route)}
        >
          <div className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <slide.icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm opacity-90 leading-tight">
                {slide.title} {slide.subtitle}
              </p>
              {slide.highlight && (
                <p className="font-bold text-base truncate">{slide.highlight}</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
}