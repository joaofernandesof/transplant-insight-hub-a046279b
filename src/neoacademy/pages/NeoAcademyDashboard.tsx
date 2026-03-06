import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { HeroCarousel } from '../components/HeroCarousel';
import { CourseCard } from '../components/CourseCard';
import { Loader2, Search, Monitor, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NeoAcademyDashboard() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'online' | 'presencial'>('online');

  const { data: courses, isLoading } = useQuery({
    queryKey: ['neoacademy-courses'],
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

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['neoacademy-presencial-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_classes')
        .select('*, courses(title, thumbnail_url)')
        .order('start_date', { ascending: true });
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

  const filteredClasses = classes?.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }) || [];

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      confirmed: { label: 'Confirmada', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      in_progress: { label: 'Em andamento', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      completed: { label: 'Concluída', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
      cancelled: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    return map[status] || { label: status, color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="px-6 pt-6 space-y-6">
        {/* Banner Carousel */}
        <HeroCarousel />

        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('online')}
            className={`flex items-center justify-center gap-3 py-4 px-5 rounded-2xl text-base font-bold transition-all border-2 ${
              activeTab === 'online'
                ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/30 scale-[1.02]'
                : 'bg-[#14141f] text-zinc-400 border-white/10 hover:text-white hover:border-blue-500/40 hover:bg-[#1a1a2e]'
            }`}
          >
            <Monitor className="h-5 w-5" />
            Cursos Online
          </button>
          <button
            onClick={() => setActiveTab('presencial')}
            className={`flex items-center justify-center gap-3 py-4 px-5 rounded-2xl text-base font-bold transition-all border-2 ${
              activeTab === 'presencial'
                ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/30 scale-[1.02]'
                : 'bg-[#14141f] text-zinc-400 border-white/10 hover:text-white hover:border-blue-500/40 hover:bg-[#1a1a2e]'
            }`}
          >
            <MapPin className="h-5 w-5" />
            Cursos Presenciais
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'online' ? 'Buscar cursos...' : 'Buscar turmas...'}
            className="pl-10 bg-[#14141f] border-white/5 text-white placeholder:text-zinc-500"
          />
        </div>

        {activeTab === 'online' ? (
          <>
            {/* Category pills */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedCategory(null)} className={cn_pill(!selectedCategory)}>
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

            {filtered.length === 0 && (
              <div className="text-center py-20 text-zinc-500">Nenhum curso encontrado</div>
            )}
          </>
        ) : (
          <>
            {classesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">Nenhuma turma presencial encontrada</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredClasses.map(cls => {
                  const status = getStatusLabel(cls.status);
                  const courseData = cls.courses as any;
                  return (
                    <div key={cls.id} className="group rounded-xl bg-[#14141f] border border-white/5 hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden cursor-pointer hover:scale-[1.02]">
                      {/* Banner */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-blue-900/40 to-sky-900/40">
                        {courseData?.thumbnail_url ? (
                          <img src={courseData.thumbnail_url} alt={cls.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-blue-400/40" />
                          </div>
                        )}
                        {/* Status badge overlay */}
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border backdrop-blur-sm ${status.color}`}>{status.label}</span>
                        </div>
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-sky-500/80 text-[10px] font-bold uppercase text-white tracking-wider">
                          Presencial
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="text-base font-semibold text-white line-clamp-2 leading-tight min-h-[2.5em]">{cls.name}</h3>
                          {courseData?.title && <p className="text-sm text-zinc-500 mt-1 truncate">{courseData.title}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-blue-400" />
                            {format(new Date(cls.start_date), "dd MMM yyyy", { locale: ptBR })}
                            {cls.end_date && ` - ${format(new Date(cls.end_date), "dd MMM yyyy", { locale: ptBR })}`}
                          </span>
                          {cls.location && (
                            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-400" />{cls.location}</span>
                          )}
                          {cls.max_students && (
                            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-blue-400" />{cls.max_students} vagas</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
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
