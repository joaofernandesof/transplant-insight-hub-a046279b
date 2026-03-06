import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { HeroCarousel } from '../components/HeroCarousel';
import { CourseRow } from '../components/CourseRow';
import { Loader2, Sparkles, TrendingUp, BookOpen, Trophy } from 'lucide-react';

export default function NeoAcademyDashboard() {
  const { user } = useUnifiedAuth();

  // Fetch courses
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

  // Fetch enrollments for progress
  const { data: enrollments } = useQuery({
    queryKey: ['neoacademy-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('neoacademy_enrollments')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const featuredCourses = courses?.filter(c => c.is_featured) || [];
  const allCourses = courses || [];
  const enrolledIds = new Set(enrollments?.map(e => e.course_id) || []);
  const myCourses = allCourses.filter(c => enrolledIds.has(c.id));
  const newCourses = allCourses.filter(c => !enrolledIds.has(c.id));

  // Group by category
  const categories = [...new Set(allCourses.map(c => c.category).filter(Boolean))];

  return (
    <div className="min-h-screen pb-12">

      <div className="px-6 pt-6 space-y-10">
        {/* Hero */}
        {featuredCourses.length > 0 ? (
          <HeroCarousel 
            items={featuredCourses.map(c => ({
              id: c.id,
              title: c.title,
              description: c.short_description || c.description,
              bannerUrl: c.banner_url,
              category: c.category,
            }))}
          />
        ) : (
          <div className="relative w-full h-[300px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-900/60 via-[#1a1a2e] to-sky-900/40 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Bem-vindo ao Conecta Capilar</h2>
              <p className="text-zinc-400 max-w-md">
                Sua plataforma premium de aprendizado. Explore cursos, participe da comunidade e conquiste badges.
              </p>
            </div>
          </div>
        )}


        {/* Continue watching */}
        {myCourses.length > 0 && (
          <CourseRow title="🔥 Continuar Assistindo" courses={myCourses} variant="continue" />
        )}


        {/* By category */}
        {categories.map(cat => {
          const catCourses = allCourses.filter(c => c.category === cat);
          return <CourseRow key={cat} title={cat!} courses={catCourses} />;
        })}

        {/* All courses */}
        {allCourses.length > 0 && (
          <CourseRow title="📚 Todos os Cursos" courses={allCourses} />
        )}
      </div>
    </div>
  );
}
