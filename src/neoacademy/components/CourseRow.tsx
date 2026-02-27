import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseCard } from './CourseCard';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  thumbnail_url?: string | null;
  category?: string | null;
  total_lessons?: number;
  total_duration_minutes?: number;
}

interface CourseRowProps {
  title: string;
  courses: Course[];
  variant?: 'default' | 'continue';
}

export function CourseRow({ title, courses, variant = 'default' }: CourseRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -400 : 400;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (courses.length === 0) return null;

  return (
    <section className="relative group/row">
      <h2 className="text-xl font-bold text-white mb-4 px-1">{title}</h2>
      
      {/* Scroll buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 mt-4 z-10 h-24 w-10 bg-black/60 rounded-r-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
      >
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 mt-4 z-10 h-24 w-10 bg-black/60 rounded-l-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
      >
        <ChevronRight className="h-5 w-5 text-white" />
      </button>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-4 overflow-x-auto pb-4 scrollbar-hide",
          "scroll-smooth snap-x snap-mandatory"
        )}
      >
        {courses.map(course => (
          <div key={course.id} className={cn(
            "snap-start shrink-0",
            variant === 'continue' ? "w-[380px]" : "w-[240px]"
          )}>
            <CourseCard
              id={course.id}
              title={course.title}
              thumbnail={course.thumbnail_url}
              category={course.category}
              totalLessons={course.total_lessons}
              totalDuration={course.total_duration_minutes}
              variant={variant}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
