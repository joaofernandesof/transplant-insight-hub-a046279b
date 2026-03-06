import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { HeroCarousel } from '../components/HeroCarousel';
import { CourseRow } from '../components/CourseRow';
import { Loader2, Sparkles } from 'lucide-react';

export default function NeoAcademyDashboard() {
  const { user } = useUnifiedAuth();

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

  const { data: enrollments } = useQuery({
    queryKey: ['neoacademy-enrollments', user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return [];
      const { data, error } = await supabase
        .from('neoacademy_enrollments')
        .select('*')
        .eq('user_id', user.authUserId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.authUserId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const allCourses = courses || [];
  const enrolledIds = new Set(enrollments?.map(e => e.course_id) || []);
  const categories = [...new Set(allCourses.map(c => c.category).filter(Boolean))];

  return (
    <div className="min-h-screen pb-12">
      <div className="px-6 pt-6 space-y-10">
        {/* Banner Carousel — from DB */}
        <HeroCarousel />

        {allCourses.length > 0 && (
          <CourseRow title="📚 Todos os Cursos" courses={allCourses} />
        )}

        {categories.map(cat => {
          const catCourses = allCourses.filter(c => c.category === cat);
          return <CourseRow key={cat} title={cat!} courses={catCourses} />;
        })}
      </div>
    </div>
  );
}
