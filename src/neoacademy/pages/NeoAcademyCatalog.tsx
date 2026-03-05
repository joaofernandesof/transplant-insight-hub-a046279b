import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CourseCard } from '../components/CourseCard';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function NeoAcademyCatalog() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['neoacademy-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoacademy_courses')
        .select('*')
        .eq('is_published', true)
        .order('order_index');
      if (error) throw error;
      return data || [];
    },
  });

  const categories = [...new Set(courses?.map(c => c.category).filter(Boolean))];

  const filtered = courses?.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory && c.category !== selectedCategory) return false;
    return true;
  }) || [];

  return (
    <div className="min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <h1 className="text-lg font-bold text-white">Catálogo</h1>
      </header>

      <div className="px-6 pt-6 space-y-6">
        {/* Search & filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar cursos..."
              className="pl-10 bg-[#14141f] border-white/5 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn_pill(!selectedCategory)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat!)}
              className={cn_pill(selectedCategory === cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(course => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                thumbnail={course.thumbnail_url}
                category={course.category}
                totalLessons={course.total_lessons}
                totalDuration={course.total_duration_minutes}
              />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            Nenhum curso encontrado
          </div>
        )}
      </div>
    </div>
  );
}

function cn_pill(active: boolean) {
  return `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10'
  }`;
}
