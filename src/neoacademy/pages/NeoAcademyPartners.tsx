import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Copy, Check, ExternalLink, Tag, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function NeoAcademyPartners() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const categories = [...new Set(coupons?.map(c => c.category).filter(Boolean))];

  const filtered = coupons?.filter(c => {
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

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-blue-400" />
          <h1 className="text-lg font-bold text-white">Vitrine de Parceiros</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-1">Cupons exclusivos de desconto dos nossos parceiros</p>
      </header>

      <div className="px-6 pt-6 space-y-6">
        {/* Search */}
        <div className="relative">
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
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cnPill(!selectedCategory)}
            >
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

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <Store className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
            <p>Nenhum cupom disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(coupon => {
              const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
              return (
                <div
                  key={coupon.id}
                  className={`rounded-2xl bg-[#14141f] border border-white/5 overflow-hidden transition-all hover:border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/5 ${isExpired ? 'opacity-50' : ''}`}
                >
                  {/* Partner header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-4">
                      {coupon.partner_logo_url ? (
                        <img
                          src={coupon.partner_logo_url}
                          alt={coupon.partner_name}
                          className="w-14 h-14 rounded-xl object-cover bg-[#1a1a2e] shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center shrink-0">
                          <Store className="h-6 w-6 text-blue-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white truncate">{coupon.partner_name}</h3>
                        {coupon.category && (
                          <span className="text-xs text-zinc-500 uppercase tracking-wider">{coupon.category}</span>
                        )}
                      </div>
                    </div>
                    {coupon.description && (
                      <p className="text-sm text-zinc-400 mt-3 line-clamp-2">{coupon.description}</p>
                    )}
                  </div>

                  {/* Discount badge */}
                  <div className="mx-5 mb-4">
                    <div className="bg-gradient-to-r from-blue-500/10 to-sky-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-300/70 font-medium mb-0.5">DESCONTO</p>
                        <p className="text-lg font-bold text-blue-300">{coupon.discount_label}</p>
                      </div>
                      <Tag className="h-5 w-5 text-blue-400/50" />
                    </div>
                  </div>

                  {/* Coupon code + actions */}
                  <div className="px-5 pb-5 space-y-3">
                    <button
                      onClick={() => handleCopy(coupon.id, coupon.coupon_code)}
                      disabled={!!isExpired}
                      className="w-full flex items-center justify-between gap-3 bg-[#1a1a2e] border border-dashed border-white/10 rounded-xl px-4 py-3 hover:border-blue-500/30 transition-all group"
                    >
                      <code className="text-sm font-mono text-white tracking-wider">{coupon.coupon_code}</code>
                      {copiedId === coupon.id ? (
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                      )}
                    </button>

                    <div className="flex items-center justify-between">
                      {coupon.valid_until && (
                        <span className="text-xs text-zinc-600">
                          {isExpired ? 'Expirado' : `Válido até ${new Date(coupon.valid_until).toLocaleDateString('pt-BR')}`}
                        </span>
                      )}
                      {coupon.link_url && (
                        <a
                          href={coupon.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                          Visitar site <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
