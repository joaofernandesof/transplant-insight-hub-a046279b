import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Copy, Check, ExternalLink, Tag, Store, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function NeoAcademyPartners() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch banners
  const { data: banners = [] } = useQuery({
    queryKey: ['neoacademy-partner-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_partner_banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch coupons
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['neoacademy-partner-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_partner_coupons')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
  });

  // Auto-advance carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const categories = [...new Set(coupons?.map(c => c.category).filter(Boolean))];

  const featured = coupons?.filter((c: any) => c.is_featured) || [];
  const regular = coupons?.filter((c: any) => {
    if ((c as any).is_featured) return false;
    if (search && !c.partner_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && c.category !== selectedCategory) return false;
    return true;
  }) || [];

  const handleCopy = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Cupom copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const goSlide = useCallback((dir: number) => {
    setCurrentSlide(prev => (prev + dir + banners.length) % banners.length);
  }, [banners.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">Vitrine de Parceiros</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-1">Cupons exclusivos de desconto dos nossos parceiros</p>
      </header>

      <div className="px-6 pt-6 space-y-8">
        {/* ============ LAYER 1: BANNER CAROUSEL ============ */}
        {banners.length > 0 && (
          <section>
            <div className="relative rounded-2xl overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {banners.map((banner) => (
                  <div key={banner.id} className="w-full shrink-0">
                    <a
                      href={banner.link_url || '#'}
                      target={banner.link_url ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={banner.image_url}
                        alt={banner.title || 'Parceiro'}
                        className="w-full h-48 sm:h-56 lg:h-64 object-cover"
                      />
                    </a>
                  </div>
                ))}
              </div>

              {/* Navigation arrows */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={() => goSlide(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => goSlide(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/70 transition"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Dots */}
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============ LAYER 2: FEATURED PARTNERS ============ */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Parceiros em Destaque</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map(coupon => (
                <FeaturedPartnerCard
                  key={coupon.id}
                  coupon={coupon}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          </section>
        )}

        {/* ============ LAYER 3: ALL PARTNERS ============ */}
        <section>
          <h2 className="text-base font-bold text-white mb-4">Todos os Parceiros</h2>

          {/* Search */}
          <div className="relative mb-4">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar parceiro..."
              className="pl-10 bg-[#14141f] border-white/5 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              <button onClick={() => setSelectedCategory(null)} className={cnPill(!selectedCategory)}>
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat!)}
                  className={cnPill(selectedCategory === cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {regular.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Store className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
              <p>Nenhum cupom disponível no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {regular.map(coupon => (
                <RegularPartnerCard
                  key={coupon.id}
                  coupon={coupon}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* ==============================
 * FEATURED PARTNER CARD (larger)
 * ============================== */
function FeaturedPartnerCard({ coupon, copiedId, onCopy }: { coupon: any; copiedId: string | null; onCopy: (id: string, code: string) => void }) {
  const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();

  return (
    <div className={`rounded-2xl bg-[#14141f] border border-white/5 overflow-hidden transition-all hover:border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/5 ${isExpired ? 'opacity-50' : ''}`}>
      {/* Banner / Logo */}
      <div className="relative h-36 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] flex items-center justify-center overflow-hidden">
        {coupon.banner_url ? (
          <img src={coupon.banner_url} alt={coupon.partner_name} className="w-full h-full object-cover" />
        ) : coupon.partner_logo_url ? (
          <img src={coupon.partner_logo_url} alt={coupon.partner_name} className="max-h-20 max-w-[70%] object-contain drop-shadow-lg" />
        ) : (
          <Store className="h-12 w-12 text-amber-400/40" />
        )}
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500/90 text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-1">
          <Star className="h-3 w-3" /> Destaque
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{coupon.partner_name}</h3>
            {coupon.category && (
              <span className="text-xs text-zinc-500 uppercase tracking-wider">{coupon.category}</span>
            )}
            {coupon.description && (
              <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{coupon.description}</p>
            )}
          </div>
        </div>

        {/* Discount */}
        <div className="mt-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-amber-300/70 font-medium mb-0.5 uppercase tracking-wider">Desconto Exclusivo</p>
            <p className="text-xl font-bold text-amber-300">{coupon.discount_label}</p>
          </div>
          <Tag className="h-6 w-6 text-amber-400/30" />
        </div>

        {/* Code */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onCopy(coupon.id, coupon.coupon_code)}
            disabled={!!isExpired}
            className="flex-1 flex items-center justify-between gap-3 bg-[#1a1a2e] border border-dashed border-white/10 rounded-xl px-4 py-3 hover:border-amber-500/30 transition-all group"
          >
            <code className="text-sm font-mono text-white tracking-wider">{coupon.coupon_code}</code>
            {copiedId === coupon.id ? (
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <Copy className="h-4 w-4 text-zinc-500 group-hover:text-amber-400 shrink-0 transition-colors" />
            )}
          </button>
        </div>

        {/* Contact button */}
        {coupon.link_url && (
          <a
            href={coupon.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 rounded-xl px-4 py-3 text-sm font-semibold transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            Falar com Parceiro
          </a>
        )}


        {coupon.valid_until && (
          <p className="text-[10px] text-zinc-600 mt-2">
            {isExpired ? 'Expirado' : `Válido até ${new Date(coupon.valid_until).toLocaleDateString('pt-BR')}`}
          </p>
        )}
      </div>
    </div>
  );
}

/* ==============================
 * REGULAR PARTNER CARD (smaller)
 * ============================== */
function RegularPartnerCard({ coupon, copiedId, onCopy }: { coupon: any; copiedId: string | null; onCopy: (id: string, code: string) => void }) {
  const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();

  return (
    <div className={`rounded-xl bg-[#14141f] border border-white/5 overflow-hidden transition-all hover:border-blue-500/20 hover:shadow-md hover:shadow-blue-500/5 ${isExpired ? 'opacity-50' : ''}`}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          {coupon.partner_logo_url ? (
            <img src={coupon.partner_logo_url} alt={coupon.partner_name} className="w-10 h-10 rounded-lg object-cover bg-[#1a1a2e] shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center shrink-0">
              <Store className="h-4 w-4 text-blue-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{coupon.partner_name}</h3>
            {coupon.category && (
              <span className="text-[10px] text-zinc-500 uppercase">{coupon.category}</span>
            )}
          </div>
        </div>

        {coupon.description && (
          <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{coupon.description}</p>
        )}

        {/* Compact discount */}
        <div className="mt-3 bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2 flex items-center justify-between">
          <p className="text-sm font-bold text-blue-300">{coupon.discount_label}</p>
          <Tag className="h-3.5 w-3.5 text-blue-400/40" />
        </div>

        {/* Code */}
        <button
          onClick={() => onCopy(coupon.id, coupon.coupon_code)}
          disabled={!!isExpired}
          className="mt-2 w-full flex items-center justify-between bg-[#1a1a2e] border border-dashed border-white/10 rounded-lg px-3 py-2 hover:border-blue-500/30 transition-all group"
        >
          <code className="text-xs font-mono text-white tracking-wider">{coupon.coupon_code}</code>
          {copiedId === coupon.id ? (
            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-zinc-500 group-hover:text-blue-400 shrink-0 transition-colors" />
          )}
        </button>

        <div className="flex items-center justify-between mt-2">
          {coupon.valid_until && (
            <span className="text-[10px] text-zinc-600">
              {isExpired ? 'Expirado' : `Até ${new Date(coupon.valid_until).toLocaleDateString('pt-BR')}`}
            </span>
          )}
          {coupon.link_url && (
            <a
              href={coupon.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Site <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function cnPill(active: boolean) {
  return `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10'
  }`;
}
